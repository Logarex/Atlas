import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

import { todayISO } from "@/lib/date";

import type { LocalVisit, VisitVisibility } from "./visit.types";

const STORAGE_KEY = "@atlas/local-visits/v1";

function createVisit(storeId: string, visitedOn: string, visibility: VisitVisibility): LocalVisit {
  const now = new Date().toISOString();

  return {
    id: `${storeId}:${visitedOn}:${now}`,
    storeId,
    visitedOn,
    visibility,
    createdAt: now,
    updatedAt: now
  };
}

export async function readLocalVisits() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalVisit[]) : [];
  } catch {
    return [];
  }
}

async function writeLocalVisits(visits: LocalVisit[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
}

export function useLocalVisits(storeId?: string) {
  const [visits, setVisits] = useState<LocalVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setVisits(await readLocalVisits());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const storeVisits = useMemo(() => {
    if (!storeId) return [];
    return visits
      .filter((visit) => visit.storeId === storeId)
      .sort((a, b) => b.visitedOn.localeCompare(a.visitedOn));
  }, [storeId, visits]);

  const addVisit = useCallback(
    async (nextStoreId: string, visitedOn = todayISO(), visibility: VisitVisibility = "private") => {
      const nextVisits = [
        createVisit(nextStoreId, visitedOn, visibility),
        ...visits.filter(
          (visit) => !(visit.storeId === nextStoreId && visit.visitedOn === visitedOn)
        )
      ];
      setVisits(nextVisits);
      await writeLocalVisits(nextVisits);
    },
    [visits]
  );

  const removeVisit = useCallback(
    async (visitId: string) => {
      const nextVisits = visits.filter((visit) => visit.id !== visitId);
      setVisits(nextVisits);
      await writeLocalVisits(nextVisits);
    },
    [visits]
  );

  const updateVisitVisibility = useCallback(
    async (visitId: string, visibility: VisitVisibility) => {
      const now = new Date().toISOString();
      const nextVisits = visits.map((visit) =>
        visit.id === visitId ? { ...visit, visibility, updatedAt: now } : visit
      );
      setVisits(nextVisits);
      await writeLocalVisits(nextVisits);
    },
    [visits]
  );

  const clearAllVisits = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setVisits([]); // Direct state update to trigger UI re-render
    } catch (e) {
      console.error("Failed to clear visits", e);
    }
  }, []);

  return {
    addVisit,
    clearAllVisits,
    isLoading,
    refresh,
    removeVisit,
    storeVisits,
    updateVisitVisibility,
    visits
  };
}
