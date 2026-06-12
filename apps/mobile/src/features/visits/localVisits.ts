import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";

import { todayISO } from "@/lib/date";

import type { LocalVisit } from "./visit.types";

const STORAGE_KEY = "@atlas/local-visits/v1";

// Simple pub-sub mechanism to keep local screens in sync.
type LocalVisitsListener = (visits: LocalVisit[]) => void;
const listeners = new Set<LocalVisitsListener>();

function notifyListeners(nextVisits: LocalVisit[]) {
  for (const listener of listeners) {
    listener(nextVisits);
  }
}

function createVisit(storeId: string, visitedOn: string, note?: string, audioUri?: string): LocalVisit {
  const now = new Date().toISOString();

  return {
    id: `${storeId}:${visitedOn}:${now}`,
    storeId,
    visitedOn,
    ...(note ? { note } : {}),
    ...(audioUri ? { audioUri } : {}),
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

export async function replaceLocalVisits(visits: LocalVisit[]) {
  await writeLocalVisits(visits);
  notifyListeners(visits);
}

export async function clearStoredLocalVisits() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  notifyListeners([]);
}

export function useLocalVisits(storeId?: string) {
  const [visits, setVisits] = useState<LocalVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const loadedVisits = await readLocalVisits();
    // Sort visits by visitedOn descending, then createdAt descending
    const sorted = [...loadedVisits].sort((a, b) => {
      const dateCompare = b.visitedOn.localeCompare(a.visitedOn);
      if (dateCompare !== 0) return dateCompare;
      return b.createdAt.localeCompare(a.createdAt);
    });
    setVisits(sorted);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const listener: LocalVisitsListener = (updatedVisits) => {
      // Keep it sorted
      const sorted = [...updatedVisits].sort((a, b) => {
        const dateCompare = b.visitedOn.localeCompare(a.visitedOn);
        if (dateCompare !== 0) return dateCompare;
        return b.createdAt.localeCompare(a.createdAt);
      });
      setVisits(sorted);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const storeVisits = useMemo(() => {
    if (!storeId) return [];
    return visits.filter((visit) => visit.storeId === storeId);
  }, [storeId, visits]);

  const addVisit = useCallback(
    async (nextStoreId: string, visitedOn = todayISO(), note?: string, audioUri?: string) => {
      const trimmedNote = note?.trim();
      const nextVisits = [
        createVisit(nextStoreId, visitedOn, trimmedNote, audioUri),
        ...visits.filter(
          (visit) => !(visit.storeId === nextStoreId && visit.visitedOn === visitedOn)
        )
      ];
      setVisits(nextVisits);
      await writeLocalVisits(nextVisits);
      notifyListeners(nextVisits);
    },
    [visits]
  );

  const removeVisit = useCallback(
    async (visitId: string) => {
      const nextVisits = visits.filter((visit) => visit.id !== visitId);
      setVisits(nextVisits);
      await writeLocalVisits(nextVisits);
      notifyListeners(nextVisits);
    },
    [visits]
  );

  const clearAllVisits = useCallback(async () => {
    try {
      await clearStoredLocalVisits();
      setVisits([]);
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
    visits
  };
}
