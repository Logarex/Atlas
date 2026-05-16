import { sampleStores } from "./sampleStores";



export function useStores() {
  const stores = sampleStores;

  return {
    error: null,
    isLoading: false,
    source: "local",
    stores
  };
}
