import { generatedStores } from "./generatedStores";

export function useStores() {
  const stores = generatedStores;

  return {
    error: null,
    isLoading: false,
    source: "local",
    stores
  };
}
