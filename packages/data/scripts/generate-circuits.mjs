import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "";

if (!API_KEY) {
  console.warn("⚠️ No Google Maps API Key found. Generating MOCK circuits with straight lines.");
}

const STORES_DIR = path.resolve(__dirname, '../stores');
const OUTPUT_FILE = path.resolve(__dirname, '../../../apps/mobile/src/features/circuit/circuitsData.json');

// Haversine distance formula (in km)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// TSP using nearest neighbor (good enough for small N)
function optimizeOrder(stores) {
  if (stores.length <= 1) return stores;
  let remaining = [...stores];
  const ordered = [];

  // Start with the store closest to city center (or just the first one)
  let current = remaining.shift();
  ordered.push(current);

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = getDistance(
        current.coordinates.latitude, current.coordinates.longitude,
        remaining[i].coordinates.latitude, remaining[i].coordinates.longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    current = remaining.splice(nearestIdx, 1)[0];
    ordered.push(current);
  }
  return ordered;
}

async function fetchRoute(origin, destination, mode = 'walking') {
  if (!API_KEY) {
    // Generate mock route using straight line and basic speed estimation
    const distKm = getDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
    const speedKmh = mode === 'walking' ? 5 : 20; // 5km/h walking, 20km/h transit
    const durationSeconds = Math.round((distKm / speedKmh) * 3600);
    const distanceMeters = Math.round(distKm * 1000);

    // Very simple polyline encoding for a straight line with just 2 points
    // Note: We'll just pass the points natively here to decode later or just mock a standard string
    // A proper polyline encoder isn't needed if we just mock a line, but here is a simple mock string.
    // Instead of polyline string, we'll return the coordinates and encode them, or just use a dummy.
    // Actually, react-native-maps accepts coordinates natively, but our schema expects a string.
    // We will just provide a very basic polyline string (it might be invalid, but it's a fallback)
    // To prevent map crashes, let's just make an empty polyline if no API key.

    return {
      routes: [
        {
          legs: [
            {
              duration: { value: durationSeconds, text: `${Math.round(durationSeconds / 60)} mins` },
              distance: { value: distanceMeters, text: `${(distKm).toFixed(1)} km` },
              steps: [
                {
                  html_instructions: `Walk straight to destination`,
                  distance: { text: `${(distKm).toFixed(1)} km` },
                  duration: { text: `${Math.round(durationSeconds / 60)} mins` },
                  travel_mode: mode.toUpperCase()
                }
              ]
            }
          ],
          overview_polyline: { points: "" } // Empty polyline to prevent crashes
        }
      ]
    };
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${mode}&key=${API_KEY}`;

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log("Reading stores...");
  const files = fs.readdirSync(STORES_DIR).filter(f => f.endsWith('.json'));

  const allStores = [];
  for (const file of files) {
    const store = JSON.parse(fs.readFileSync(path.join(STORES_DIR, file), 'utf8'));
    if (store.status === 'open') allStores.push(store);
  }

  const clusters = [];
  const unvisited = new Set(allStores);

  while (unvisited.size > 0) {
    const startStore = unvisited.values().next().value;
    unvisited.delete(startStore);
    
    const cluster = [startStore];
    let added;
    do {
      added = false;
      for (const store of [...unvisited]) {
        const isNear = cluster.some(c => getDistance(c.coordinates.latitude, c.coordinates.longitude, store.coordinates.latitude, store.coordinates.longitude) <= 50);
        if (isNear) {
          cluster.push(store);
          unvisited.delete(store);
          added = true;
        }
      }
    } while (added);
    
    if (cluster.length >= 2) {
      clusters.push(cluster);
    }
  }

  console.log(`Found ${clusters.length} circuits (clusters) with >= 2 stores within 50km.`);

  const circuitsData = {};

  // Process all valid clusters
  for (const stores of clusters) {
    const cityCounts = {};
    for (const s of stores) {
      cityCounts[s.city] = (cityCounts[s.city] || 0) + 1;
    }
    const city = Object.keys(cityCounts).reduce((a, b) => cityCounts[a] > cityCounts[b] ? a : b);

    console.log(`Processing circuit for ${city} (${stores.length} stores)...`);
    const orderedStores = optimizeOrder(stores);

    const circuit = {
      city,
      countryName: stores[0].countryName,
      stores: orderedStores.map(s => ({
        id: s.id,
        name: s.name, // Keep object to support romanized / localized
        coordinates: s.coordinates
      })),
      legs: [],
      totalDuration: 0,
      totalDistance: 0
    };

    // Calculate legs
    for (let i = 0; i < orderedStores.length - 1; i++) {
      const start = orderedStores[i].coordinates;
      const end = orderedStores[i + 1].coordinates;

      // Attempt walking first
      let routeData = await fetchRoute(start, end, 'walking');
      let leg = routeData.routes[0]?.legs[0];
      let mode = 'walking';

      if (leg) {
        // If walking is > 45 mins (2700s) or > 3.5km, try transit
        if (leg.duration.value > 2700 || leg.distance.value > 3500) {
          const transitData = await fetchRoute(start, end, 'transit');
          if (transitData.routes && transitData.routes.length > 0) {
            leg = transitData.routes[0].legs[0];
            mode = 'transit';
            routeData = transitData;
          }
        }

        circuit.legs.push({
          startStoreId: orderedStores[i].id,
          endStoreId: orderedStores[i + 1].id,
          mode: mode,
          duration: leg.duration.value, // in seconds
          distance: leg.distance.value, // in meters
          polyline: routeData.routes[0].overview_polyline.points,
          steps: leg.steps.map(s => ({
            instruction: s.html_instructions,
            distance: s.distance.text,
            duration: s.duration.text,
            mode: s.travel_mode
          }))
        });

        circuit.totalDuration += leg.duration.value;
        circuit.totalDistance += leg.distance.value;
      }

      // Be nice to API limits
      await new Promise(r => setTimeout(r, 200));
    }

    circuitsData[city] = circuit;
  }

  // Create directory if it doesn't exist
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(circuitsData, null, 2));
  console.log(`Successfully generated circuits for ${Object.keys(circuitsData).length} cities.`);
}

main().catch(console.error);
