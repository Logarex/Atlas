import { generatedStores } from "./generatedStores";
import { appleStoreCounts } from "./storeStats";

export function useStores() {
  const stores = generatedStores;

  return {
    error: null,
    isLoading: false,
    source: "local",
    stats: appleStoreCounts,
    stores
  };
}
