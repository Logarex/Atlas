import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dataRoot = join(here, "..");
const repoRoot = join(dataRoot, "..", "..");
const storesDir = join(dataRoot, "stores");
const bundlePath = join(dataRoot, "stores.json");
const mobileGeneratedPath = join(
  repoRoot,
  "apps",
  "mobile",
  "src",
  "features",
  "stores",
  "generatedStores.ts"
);
const importsDir = join(dataRoot, "imports", "alltheplaces");

const runId = "2026-05-09-13-32-52";
const sourceUrl = `https://alltheplaces-data.openaddresses.io/runs/${runId}/output/apple.geojson`;
const runStatsUrl = `https://alltheplaces-data.openaddresses.io/runs/${runId}/stats/_results.json`;
const verifiedAt = "2026-05-12";
const generatedAt = "2026-05-17";

const attributeKeys = [
  "avenue",
  "boardroom",
  "forum",
  "geniusBar",
  "glassCube",
  "greenWall",
  "historicFacade",
  "outdoor",
  "pickup",
  "plaza",
  "trees",
  "videoWall"
];

const regionNames = {
  CA: {
    AB: "Alberta",
    BC: "British Columbia",
    MB: "Manitoba",
    NS: "Nova Scotia",
    ON: "Ontario",
    QC: "Quebec"
  },
  US: {
    AK: "Alaska",
    AL: "Alabama",
    AR: "Arkansas",
    AZ: "Arizona",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DC: "District of Columbia",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    IA: "Iowa",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    MA: "Massachusetts",
    MD: "Maryland",
    ME: "Maine",
    MI: "Michigan",
    MN: "Minnesota",
    MO: "Missouri",
    MS: "Mississippi",
    NC: "North Carolina",
    NE: "Nebraska",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NV: "Nevada",
    NY: "New York",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VA: "Virginia",
    WA: "Washington",
    WI: "Wisconsin"
  }
};

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg.startsWith("--")) {
      args.set(arg.slice(2), argv[index + 1]);
      index += 1;
    }
  }

  return args;
}

function normalizeOfficialUrl(value) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";

  if (!url.pathname.endsWith("/")) {
    url.pathname = `${url.pathname}/`;
  }

  return url.toString();
}

function retailSlugFromUrl(value) {
  const url = new URL(value);
  const parts = url.pathname.split("/").filter(Boolean);
  const retailIndex = parts.indexOf("retail");
  return parts[retailIndex + 1] ?? parts.at(-1) ?? "";
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function baseStoreId(feature) {
  const properties = feature.properties;
  const branchSlug = slugify(properties.branch ?? "");
  const urlSlug = slugify(retailSlugFromUrl(properties["@source_uri"] ?? properties.website));
  return `apple-${branchSlug || urlSlug}`;
}

function buildStoreId(feature, duplicateBaseIds) {
  const baseId = baseStoreId(feature);

  if (!duplicateBaseIds.has(baseId)) {
    return baseId;
  }

  const countryCode = countryCodeForFeature(feature).toLowerCase();
  return `${baseId}-${countryCode}`;
}

function countryCodeForFeature(feature) {
  const properties = feature.properties;
  const officialUrl = properties["@source_uri"] ?? properties.website;

  if (
    properties["addr:country"] === "VA" &&
    officialUrl?.includes("/it/retail/") &&
    properties["addr:city"] === "Roma"
  ) {
    return "IT";
  }

  return properties["addr:country"];
}

function countryNameForCode(countryCode) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

function regionNameForFeature(properties, countryCode) {
  const region = properties["addr:state"];
  return regionNames[countryCode]?.[region] ?? region;
}

function compactParts(parts) {
  const result = [];
  const seen = new Set();

  for (const part of parts) {
    const value = String(part ?? "").trim();

    if (!value) continue;

    const key = value.toLocaleLowerCase();
    const alreadyCovered = result.some((existing) =>
      existing.toLocaleLowerCase().includes(key)
    );

    if (!seen.has(key) && !alreadyCovered) {
      result.push(value);
      seen.add(key);
    }
  }

  return result;
}

function formatAddress(properties, countryCode) {
  const street = properties["addr:street_address"];
  const city = properties["addr:city"];
  const state = properties["addr:state"];
  const postcode = properties["addr:postcode"];

  if (countryCode === "US" || countryCode === "CA") {
    const statePostcode = compactParts([state, postcode]).join(" ");
    return compactParts([street, city, statePostcode]).join(", ");
  }

  return compactParts([street, postcode, city, state]).join(", ");
}

function defaultAttributes() {
  return Object.fromEntries(attributeKeys.map((key) => [key, "unknown"]));
}

function sourceList(officialUrl) {
  return [
    {
      type: "alltheplaces_cc0",
      label: `All the Places Apple GeoJSON run ${runId}`,
      url: sourceUrl,
      license: "CC0-1.0",
      fields: [
        "storeNumber",
        "name",
        "address",
        "city",
        "region",
        "countryCode",
        "countryName",
        "coordinates",
        "officialUrl"
      ],
      verifiedAt
    },
    {
      type: "apple_official_page",
      label: "Apple official store page",
      url: officialUrl,
      license: "reference_only",
      fields: ["officialUrl", "hours.officialUrl"],
      verifiedAt
    }
  ];
}

function sourceKey(source) {
  return `${source.type ?? ""}|${source.url}|${source.license}`;
}

function mergeSources(existingSources = [], importedSources = []) {
  const merged = [];
  const seen = new Set();

  for (const source of [...existingSources, ...importedSources]) {
    const key = sourceKey(source);

    if (!seen.has(key)) {
      merged.push(source);
      seen.add(key);
    }
  }

  return merged;
}

function isCuratedArchitecture(architecture) {
  if (!architecture) return false;
  if (architecture.era && architecture.era !== "Unknown") return true;
  if (architecture.typology && architecture.typology !== "Unknown") return true;
  if (architecture.notes?.length) return true;
  return Object.values(architecture.attributes ?? {}).some((value) => value !== "unknown");
}

function normalizeArchitecture(architecture) {
  return {
    ...architecture,
    attributes: {
      ...defaultAttributes(),
      ...(architecture.attributes ?? {})
    }
  };
}

function latestDate(left, right) {
  if (!left) return right;
  if (!right) return left;
  return left > right ? left : right;
}

function buildImportedRecord(feature, duplicateBaseIds) {
  const properties = feature.properties;
  const officialUrl = normalizeOfficialUrl(properties["@source_uri"] ?? properties.website);
  const countryCode = countryCodeForFeature(feature);
  const branch = properties.branch.trim();
  const [longitude, latitude] = feature.geometry.coordinates;

  return {
    id: buildStoreId(feature, duplicateBaseIds),
    storeNumber: properties.ref,
    name: {
      en: `Apple ${branch}`,
      fr: `Apple ${branch}`
    },
    status: "open",
    city: properties["addr:city"],
    region: regionNameForFeature(properties, countryCode),
    countryCode,
    countryName: countryNameForCode(countryCode),
    address: formatAddress(properties, countryCode),
    coordinates: {
      latitude: Number(latitude.toFixed(6)),
      longitude: Number(longitude.toFixed(6))
    },
    openedOn: null,
    closedOn: null,
    officialUrl,
    architecture: {
      era: "Unknown",
      typology: "Unknown",
      attributes: defaultAttributes()
    },
    hours: {
      policy: "official-link-only",
      officialUrl,
      lastVerifiedAt: null,
      note: "Hours change often. Verify on the official Apple page before visiting."
    },
    photos: [],
    sources: sourceList(officialUrl),
    lastVerifiedAt: verifiedAt
  };
}

async function loadGeoJson(inputPath) {
  if (inputPath) {
    return JSON.parse(await readFile(resolve(inputPath), "utf8"));
  }

  const response = await fetch(sourceUrl);

  if (!response.ok) {
    throw new Error(`Unable to download ${sourceUrl}: ${response.status}`);
  }

  return response.json();
}

async function readExistingStores() {
  const stores = new Map();

  if (!existsSync(storesDir)) {
    return stores;
  }

  const files = (await readdir(storesDir)).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const record = JSON.parse(await readFile(join(storesDir, file), "utf8"));
    stores.set(record.id, record);
  }

  return stores;
}

function mergeRecord(importedRecord, existingRecord) {
  if (!existingRecord) {
    return importedRecord;
  }

  return {
    ...importedRecord,
    id: existingRecord.id,
    openedOn: existingRecord.openedOn ?? importedRecord.openedOn,
    closedOn: existingRecord.closedOn ?? importedRecord.closedOn,
    architecture: isCuratedArchitecture(existingRecord.architecture)
      ? normalizeArchitecture(existingRecord.architecture)
      : importedRecord.architecture,
    photos: existingRecord.photos ?? importedRecord.photos,
    sources: mergeSources(existingRecord.sources, importedRecord.sources),
    lastVerifiedAt: latestDate(existingRecord.lastVerifiedAt, importedRecord.lastVerifiedAt)
  };
}

function sortStores(stores) {
  return stores.sort((left, right) => {
    const leftKey = [
      left.countryName ?? left.countryCode,
      left.region ?? "",
      left.city,
      left.name.en
    ].join("\u0000");
    const rightKey = [
      right.countryName ?? right.countryCode,
      right.region ?? "",
      right.city,
      right.name.en
    ].join("\u0000");

    return leftKey.localeCompare(rightKey, "en");
  });
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeMobileStores(stores) {
  const body = JSON.stringify(stores, null, 2);
  const content = `/* This file is generated by packages/data/scripts/import-apple-from-alltheplaces.mjs. */\nimport type { StoreRecord } from "./store.types";\n\nexport const generatedStores: StoreRecord[] = ${body};\n`;
  await writeFile(mobileGeneratedPath, content);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const geoJson = await loadGeoJson(args.get("input"));
  const features = geoJson.features ?? [];
  const baseIds = new Map();

  for (const feature of features) {
    const baseId = baseStoreId(feature);
    baseIds.set(baseId, (baseIds.get(baseId) ?? 0) + 1);
  }

  const duplicateBaseIds = new Set(
    [...baseIds.entries()].filter(([, count]) => count > 1).map(([id]) => id)
  );
  const existingStores = await readExistingStores();
  const importedStores = [];

  for (const feature of features) {
    const importedRecord = buildImportedRecord(feature, duplicateBaseIds);
    const existingRecord = existingStores.get(importedRecord.id);
    importedStores.push(mergeRecord(importedRecord, existingRecord));
  }

  const importedIds = new Set(importedStores.map((store) => store.id));
  const preservedStores = [...existingStores.values()].filter((store) => !importedIds.has(store.id));
  const stores = sortStores([...importedStores, ...preservedStores]);

  await mkdir(storesDir, { recursive: true });
  await mkdir(importsDir, { recursive: true });

  for (const store of stores) {
    await writeJson(join(storesDir, `${store.id}.json`), store);
  }

  await writeJson(bundlePath, stores);
  await writeMobileStores(stores);
  await writeJson(join(importsDir, `apple-${runId}.manifest.json`), {
    source: "All the Places",
    sourceUrl,
    runStatsUrl,
    license: "CC0-1.0",
    runId,
    verifiedAt,
    generatedAt,
    importedFeatureCount: features.length,
    generatedStoreCount: stores.length,
    notes: [
      "This import covers stores present in the published All the Places Apple GeoJSON snapshot.",
      "Opening dates, closure history, architecture, and community photos remain null or unknown unless independently curated.",
      "Apple official pages are stored as reference links only; Atlas does not run the Apple spider."
    ]
  });

  console.log(`Imported ${features.length} Apple store feature(s).`);
  console.log(`Generated ${stores.length} Atlas store record(s).`);
}

await main();
