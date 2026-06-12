import type { ArchitectureAttribute, StoreRecord, StoreStatus } from "./store.types";
import { localPhotosMap } from "./generatedPhotoAssets";

const combiningMarksPattern = /[\u0300-\u036f]/g;
const retailSlugPattern = /\/retail\/([^/?#]+)/i;
const githubBlobAssetPattern =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+?)(?:\?raw=true)?$/i;

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

export const latinStoreNames: Record<string, string> = {
  "apple-101": "Apple Taipei 101",
  "apple-a13": "Apple Xinyi A13",
  "apple-center66wuxi": "Apple Center 66 Wuxi",
  "apple-changsha": "Apple Changsha",
  "apple-chaoyangjoycity": "Apple Chaoyang Joy City",
  "apple-chinacentralmall": "Apple China Central Mall",
  "apple-fukuoka": "Apple Fukuoka",
  "apple-galaxymacau": "Apple Galaxy Macau",
  "apple-gangnam": "Apple Gangnam",
  "apple-garosugil": "Apple Garosugil",
  "apple-ginza": "Apple Ginza",
  "apple-globalharbor": "Apple Global Harbor",
  "apple-hanam": "Apple Hanam",
  "apple-holidayplazashenzhen": "Apple Holiday Plaza Shenzhen",
  "apple-hongdae": "Apple Hongdae",
  "apple-hongkongplaza": "Apple Hong Kong Plaza",
  "apple-iapm": "Apple Shanghai iapm",
  "apple-jamsil": "Apple Jamsil",
  "apple-jiefangbei": "Apple Jiefangbei",
  "apple-jingan": "Apple Jing’an",
  "apple-kawasaki": "Apple Kawasaki",
  "apple-kunming": "Apple Kunming",
  "apple-kyoto": "Apple Kyoto",
  "apple-livatbeijing": "Apple Livat Beijing",
  "apple-marunouchi": "Apple Marunouchi",
  "apple-mixcchengdu": "Apple MixC Chengdu",
  "apple-mixcchongqing": "Apple MixC Chongqing",
  "apple-mixchangzhou": "Apple MixC Hangzhou",
  "apple-mixchefei": "Apple MixC Hefei",
  "apple-mixcnanning": "Apple MixC Nanning",
  "apple-mixcqingdao": "Apple MixC Qingdao",
  "apple-mixcshenyang": "Apple MixC Shenyang",
  "apple-mixcshenzhen": "Apple MixC Shenzhen",
  "apple-mixctianjin": "Apple MixC Tianjin",
  "apple-mixcwenzhou": "Apple MixC Wenzhou",
  "apple-mixczhengzhou": "Apple MixC Zhengzhou",
  "apple-myeongdong": "Apple Myeongdong",
  "apple-nagoyasakae": "Apple Nagoya Sakae",
  "apple-nanjingeast": "Apple Nanjing East",
  "apple-olympia66dalian": "Apple Olympia 66 Dalian",
  "apple-omotesando": "Apple Omotesando",
  "apple-paradisewalkchongqing": "Apple Paradise Walk Chongqing",
  "apple-parc66jinan": "Apple Parc 66 Jinan",
  "apple-parccentral": "Apple Parc Central",
  "apple-pudong": "Apple Pudong",
  "apple-qibao": "Apple Qibao",
  "apple-riverside66tianjin": "Apple Riverside 66 Tianjin",
  "apple-sanlitun": "Apple Sanlitun",
  "apple-shibuya": "Apple Shibuya",
  "apple-shinjuku": "Apple Shinjuku",
  "apple-shinsaibashi": "Apple Shinsaibashi",
  "apple-suzhou": "Apple Suzhou",
  "apple-tahoeplaza": "Apple Tahoe Plaza",
  "apple-taikoolichengdu": "Apple Taikoo Li Chengdu",
  "apple-tianjinjoycity": "Apple Tianjin Joy City",
  "apple-tianyisquare": "Apple Tianyi Square",
  "apple-umeda": "Apple Umeda",
  "apple-uniwalkqianhai": "Apple Uniwalk Qianhai",
  "apple-wangfujing": "Apple Wangfujing",
  "apple-westlake": "Apple Westlake",
  "apple-wondercity": "Apple Wonder City",
  "apple-wuhan": "Apple Wuhan",
  "apple-wujiaochang": "Apple Wujiaochang",
  "apple-xiamenlifestylecenter": "Apple Xiamen Lifestyle Center",
  "apple-xidanjoycity": "Apple Xidan Joy City",
  "apple-xinjiekou": "Apple Xinjiekou",
  "apple-xuanwulake": "Apple Xuanwu Lake",
  "apple-yeouido": "Apple Yeouido",
  "apple-zhongjiejoycity": "Apple Zhongjie Joy City",
  "apple-zhujiangnewtown": "Apple Zhujiang New Town"
};

export function getStoreName(
  store: StoreRecord,
  language: string,
  options?: { noLocal?: boolean }
) {
  const baseName = language.startsWith("fr") ? store.name.fr : store.name.en;
  const isFRorEN = language.startsWith("fr") || language.startsWith("en");

  if (isFRorEN && latinStoreNames[store.id]) {
    const latinName = latinStoreNames[store.id];
    if (options?.noLocal) {
      return latinName;
    } else {
      return `${latinName} (${baseName})`;
    }
  }

  return baseName;
}

export function getPhotoSource(url: string) {
  const normalizedUrl = normalizePhotoUri(url);

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return { cacheKey: normalizedUrl, uri: normalizedUrl };
  }
  if (localPhotosMap[url]) {
    return localPhotosMap[url];
  }
  return { uri: normalizedUrl };
}

export function normalizePhotoUri(url: string) {
  const match = url.match(githubBlobAssetPattern);
  if (!match) return url;

  const [, owner, repo, branch, path] = match;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

export function getPhotoFullUrl(photo?: { url: string; thumbUrl?: string }) {
  if (!photo?.url) return "";
  const url = photo.url;

  if (url.includes("res.cloudinary.com") && !url.includes("q_auto") && !url.includes("t_atlas_hd")) {
    const parts = url.split("/upload/");
    if (parts.length === 2) {
      const cleanPath = parts[1].replace(/^v\d+\//, "");
      return `${parts[0]}/upload/t_atlas_hd/${cleanPath}`;
    }
  }
  return url;
}

export function getPhotoThumbUrl(photo?: { url: string; thumbUrl?: string }) {
  if (!photo?.url) return "";
  if (photo.thumbUrl) return photo.thumbUrl;

  const url = photo.url;
  if (url.includes("res.cloudinary.com") && !url.includes("t_atlas_thumb")) {
    const parts = url.split("/upload/");
    if (parts.length === 2) {
      // Strip the version (e.g., v1781282008/) to bypass CDN cache of previous 400 errors
      const cleanPath = parts[1].replace(/^v\d+\//, "");
      return `${parts[0]}/upload/t_atlas_thumb/${cleanPath}`;
    }
  }
  return url;
}

export function normalizeI18nKey(str: string | undefined): string {
  if (!str) return '';
  return str
    .split(/[^a-zA-Z0-9]+/)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

export function getStorePlace(store: StoreRecord) {
  return compactSearchParts([store.city, store.region, store.countryName ?? store.countryCode])
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
