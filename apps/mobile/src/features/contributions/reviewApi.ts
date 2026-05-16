import { supabase } from "@/lib/supabase";
import type { StoreRecord } from "../stores/store.types";

export type StoreCandidate = StoreRecord & {
  importedAt: string;
};

/**
 * Fetches candidates from our local Wikidata import.
 * In a real production app, this could come from a Supabase table.
 * For now, we'll assume the JSON is served or we can inject it.
 */
/**
 * Fetches candidates from our Supabase change_requests table.
 */
export async function getStoreCandidates(): Promise<StoreCandidate[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("change_requests")
      .select("payload")
      .eq("type", "new_store_candidate")
      .eq("status", "pending");

    if (error) throw error;

    return (data?.map((d: any) => d.payload) || []) as StoreCandidate[];
  } catch (e) {
    console.error("Failed to load candidates from Supabase", e);
    return [];
  }
}

/**
 * Promotes a candidate to a live store in Supabase.
 */
export async function promoteStore(candidate: StoreCandidate) {
  if (!supabase) throw new Error("Supabase not configured");

  // Prepare the data for the 'stores' table
  const { importedAt, ...storeData } = candidate;
  
  // Transform to match SQL schema (snake_case)
  const dbRecord = {
    id: storeData.id,
    status: storeData.status,
    name: storeData.name,
    country_code: storeData.countryCode,
    country_name: storeData.countryName,
    region: storeData.region,
    city: storeData.city,
    address: storeData.address,
    latitude: storeData.coordinates.latitude,
    longitude: storeData.coordinates.longitude,
    opened_on: storeData.openedOn,
    closed_on: storeData.closedOn,
    official_url: storeData.officialUrl,
    architecture: storeData.architecture,
    hours: storeData.hours,
    last_verified_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("stores")
    .insert(dbRecord);

  if (error) throw error;

  // Also insert sources if any
  if (storeData.sources && storeData.sources.length > 0) {
    const sources = storeData.sources.map(s => ({
      store_id: storeData.id,
      label: s.label,
      url: s.url,
      license: s.license,
      field_path: s.fields?.join(",") || "all",
      verified_at: s.verifiedAt || new Date().toISOString()
    }));

    const { error: sourceError } = await supabase
      .from("store_sources")
      .insert(sources);
      
    if (sourceError) console.warn("Failed to insert sources", sourceError);
  }

  return true;
}
