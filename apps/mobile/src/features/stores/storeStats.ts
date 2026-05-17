import { generatedStores } from "./generatedStores";
import type { StoreStatus } from "./store.types";

function countByStatus(status: StoreStatus) {
  return generatedStores.filter((store) => store.status === status).length;
}

export const appleStoreCounts = {
  open: countByStatus("open"),
  closed: countByStatus("closed"),
  relocated: countByStatus("relocated")
} as const;

export const OPEN_APPLE_STORE_COUNT = appleStoreCounts.open;
export const CLOSED_APPLE_STORE_COUNT = appleStoreCounts.closed;
export const RELOCATED_APPLE_STORE_COUNT = appleStoreCounts.relocated;
