import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

import { sampleStores } from "./sampleStores";
import type { StoreHours, StoreRecord, StoreSource, StoreStatus } from "./store.types";

type StoreRow = {
  id: string;
  status: StoreStatus;
  name: StoreRecord["name"];
  country_code: string;
  country_name?: string | null;
  region?: string | null;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  opened_on: string | null;
  closed_on?: string | null;
  official_url: string | null;
  architecture: StoreRecord["architecture"];
  hours: StoreHours;
  last_verified_at: string | null;
  store_sources?: StoreSource[];
};

function fallbackHours(officialUrl: string): StoreHours {
  return {
    policy: "official-link-only",
    officialUrl,
    lastVerifiedAt: null,
    note: "Hours change often. Verify on the official Apple page before visiting."
  };
}

function mapStoreRow(row: StoreRow): StoreRecord {
  const officialUrl = row.official_url ?? row.hours?.officialUrl ?? "";

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    city: row.city,
    region: row.region ?? undefined,
    countryCode: row.country_code,
    countryName: row.country_name ?? undefined,
    address: row.address,
    coordinates: {
      latitude: row.latitude,
      longitude: row.longitude
    },
    openedOn: row.opened_on,
    closedOn: row.closed_on ?? null,
    officialUrl,
    architecture: row.architecture,
    hours: row.hours ?? fallbackHours(officialUrl),
    photos: [],
    sources: row.store_sources ?? [],
    lastVerifiedAt: row.last_verified_at?.slice(0, 10) ?? "unknown"
  };
}

export function useStores() {
  const [remoteStores, setRemoteStores] = useState<StoreRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadStores() {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data, error: requestError } = await supabase
        .from("stores")
        .select("*, store_sources(*)")
        .order("country_code", { ascending: true })
        .order("city", { ascending: true });

      if (!active) return;

      if (requestError) {
        setError(requestError.message);
        setIsLoading(false);
        return;
      }

      setRemoteStores((data ?? []).map((row) => mapStoreRow(row as StoreRow)));
      setIsLoading(false);
    }

    void loadStores();

    return () => {
      active = false;
    };
  }, []);

  const stores = useMemo(() => {
    if (remoteStores && remoteStores.length > 0) return remoteStores;
    return sampleStores;
  }, [remoteStores]);

  return {
    error,
    isLoading,
    source: remoteStores && remoteStores.length > 0 ? "supabase" : "local",
    stores
  };
}
