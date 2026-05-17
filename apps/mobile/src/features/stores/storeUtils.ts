import type { ArchitectureAttribute, StoreRecord, StoreStatus } from "./store.types";

const combiningMarksPattern = /[\u0300-\u036f]/g;
const retailSlugPattern = /\/retail\/([^/?#]+)/i;

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
  outdoor: "",
  pickup: "",
  plaza: "",
  trees: "",
  videoWall: ""
};

function compactSearchParts(parts: Array<string | null | undefined>) {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const value = String(part ?? "").trim();
    if (!value) continue;

    const key = normalizeSearchText(value);
    if (!key || seen.has(key)) continue;

    result.push(value);
    seen.add(key);
  }

  return result;
}

function retailSlugFromUrl(value: string | null | undefined) {
  const match = String(value ?? "").match(retailSlugPattern);
  return match?.[1] ?? null;
}

function appleStoreSlugParts(store: StoreRecord) {
  const urlSlug = retailSlugFromUrl(store.officialUrl) ?? retailSlugFromUrl(store.hours.officialUrl);
  const idSlug = store.id.replace(/^apple-/, "");

  return compactSearchParts([
    urlSlug,
    urlSlug?.replace(/-/g, " "),
    idSlug,
    idSlug.replace(/-/g, " "),
    store.storeNumber,
    store.storeNumber?.replace(/^R/i, "")
  ]);
}

export function normalizeSearchText(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(combiningMarksPattern, "")
    .toLocaleLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

export function getStoreSearchText(store: StoreRecord) {
  const positiveAttributes = Object.entries(store.architecture.attributes)
    .filter(([, value]) => value === "yes")
    .map(([key]) => key);

  return normalizeSearchText(
    compactSearchParts([
      store.id,
      store.name.en,
      store.name.fr,
      ...(store.aliases ?? []),
      ...appleStoreSlugParts(store),
      store.city,
      store.region,
      store.countryCode,
      store.countryName,
      store.address,
      store.status,
      store.architecture.era,
      store.architecture.typology,
      ...(store.architecture.notes ?? []),
      ...positiveAttributes
    ]).join(" ")
  );
}

export function matchesStoreSearch(store: StoreRecord, query: string) {
  const tokens = normalizeSearchText(query).split(" ").filter(Boolean);

  if (tokens.length === 0) return true;

  const haystack = getStoreSearchText(store);
  return tokens.every((token) => haystack.includes(token));
}
