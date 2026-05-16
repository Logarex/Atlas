import { supabase } from "@/lib/supabase";
import type { StoreRecord } from "../stores/store.types";


/**
 * Updates an existing store directly in the database.
 */
export async function updateStore(storeData: StoreRecord) {
  if (!supabase) throw new Error("Supabase not configured");

  const dbRecord = {
    id: storeData.id,
    status: storeData.status,
    name: storeData.name,
    country_code: storeData.countryCode,
    country_name: storeData.countryName,
    region: storeData.region,
    city: storeData.city,
    address: storeData.address,
    latitude: storeData.coordinates?.latitude || 0,
    longitude: storeData.coordinates?.longitude || 0,
    opened_on: storeData.openedOn,
    closed_on: storeData.closedOn,
    official_url: storeData.officialUrl,
    architecture: storeData.architecture,
    hours: storeData.hours,
    last_verified_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("stores")
    .update(dbRecord)
    .eq("id", storeData.id);

  if (error) throw error;
  return true;
}

/**
 * Creates a new store manually.
 */
export async function createStore(storeData: StoreRecord) {
  if (!supabase) throw new Error("Supabase not configured");

  const dbRecord = {
    id: storeData.id,
    status: storeData.status,
    name: storeData.name,
    country_code: storeData.countryCode,
    country_name: storeData.countryName,
    region: storeData.region,
    city: storeData.city,
    address: storeData.address,
    latitude: storeData.coordinates?.latitude || 0,
    longitude: storeData.coordinates?.longitude || 0,
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
  return true;
}
