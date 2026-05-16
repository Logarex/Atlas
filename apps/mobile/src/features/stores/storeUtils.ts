import type { ArchitectureAttribute, StoreRecord, StoreStatus } from "./store.types";

export const statusEmojis: Record<StoreStatus, string> = {
  announced: "",
  closed: "",
  open: "",
  relocated: "",
  temporary: ""
};

export const attributeEmojis: Record<ArchitectureAttribute, string> = {
  avenue: "",
  boardroom: "",
  forum: "",
  geniusBar: "",
  glassCube: "",
  greenWall: "",
  historicFacade: "",
  plaza: "",
  videoWall: ""
};

export function getStoreName(store: StoreRecord, language: string) {
  return language.startsWith("fr") ? store.name.fr : store.name.en;
}

export function getStorePlace(store: StoreRecord) {
  return [store.city, store.region, store.countryName ?? store.countryCode]
    .filter(Boolean)
    .join(", ");
}

export function getPositiveAttributeKeys(store: StoreRecord) {
  return Object.entries(store.architecture.attributes)
    .filter(([, value]) => value === "yes")
    .map(([key]) => key as ArchitectureAttribute);
}

export function getMarkerEmoji(store: StoreRecord) {
  if (store.architecture.attributes.glassCube === "yes") return "◻️";
  if (store.architecture.attributes.greenWall === "yes") return "🌿";
  if (store.architecture.attributes.historicFacade === "yes") return "🏛️";
  return statusEmojis[store.status];
}
