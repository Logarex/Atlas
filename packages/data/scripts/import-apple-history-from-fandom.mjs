import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const dataRoot = join(here, "..");
const repoRoot = join(dataRoot, "..", "..");
const storesDir = join(dataRoot, "stores");
const bundlePath = join(dataRoot, "stores.json");
const mobileGeneratedPath = join(
  repoRoot,
  "apps",
  "mobile",
  "src",
  "features",
  "stores",
  "generatedStores.ts"
);
const importsDir = join(dataRoot, "imports", "fandom");

const listPageUrl = "https://apple.fandom.com/wiki/List_of_Apple_Stores_by_opening_date";
const listApiUrl =
  "https://apple.fandom.com/api.php?action=parse&page=List_of_Apple_Stores_by_opening_date&prop=wikitext&format=json";
const licenseUrl = "https://www.fandom.com/licensing";
const verifiedAt = "2026-05-17";
const generatedAt = "2026-05-17";

const attributeKeys = [
  "avenue",
  "boardroom",
  "forum",
  "geniusBar",
  "glassCube",
  "greenWall",
  "historicFacade",
  "outdoor",
  "pickup",
  "plaza",
  "trees",
  "videoWall"
];

const regionNames = {
  AU: {
    ACT: "Australian Capital Territory",
    NSW: "New South Wales",
    NT: "Northern Territory",
    QLD: "Queensland",
    SA: "South Australia",
    TAS: "Tasmania",
    VIC: "Victoria",
    WA: "Western Australia"
  },
  CA: {
    AB: "Alberta",
    BC: "British Columbia",
    MB: "Manitoba",
    NB: "New Brunswick",
    NL: "Newfoundland and Labrador",
    NS: "Nova Scotia",
    NT: "Northwest Territories",
    NU: "Nunavut",
    ON: "Ontario",
    PE: "Prince Edward Island",
    QC: "Quebec",
    SK: "Saskatchewan",
    YT: "Yukon"
  },
  CN: {
    LN: "Liaoning"
  },
  FR: {
    IDF: "Ile-de-France"
  },
  GB: {
    ENG: "England",
    NIR: "Northern Ireland",
    SCT: "Scotland",
    WLS: "Wales"
  },
  US: {
    AK: "Alaska",
    AL: "Alabama",
    AR: "Arkansas",
    AZ: "Arizona",
    CA: "California",
    CO: "Colorado",
    CT: "Connecticut",
    DC: "District of Columbia",
    DE: "Delaware",
    FL: "Florida",
    GA: "Georgia",
    HI: "Hawaii",
    IA: "Iowa",
    ID: "Idaho",
    IL: "Illinois",
    IN: "Indiana",
    KS: "Kansas",
    KY: "Kentucky",
    LA: "Louisiana",
    MA: "Massachusetts",
    MD: "Maryland",
    ME: "Maine",
    MI: "Michigan",
    MN: "Minnesota",
    MO: "Missouri",
    MS: "Mississippi",
    NC: "North Carolina",
    NE: "Nebraska",
    NH: "New Hampshire",
    NJ: "New Jersey",
    NM: "New Mexico",
    NV: "Nevada",
    NY: "New York",
    OH: "Ohio",
    OK: "Oklahoma",
    OR: "Oregon",
    PA: "Pennsylvania",
    RI: "Rhode Island",
    SC: "South Carolina",
    TN: "Tennessee",
    TX: "Texas",
    UT: "Utah",
    VA: "Virginia",
    WA: "Washington",
    WI: "Wisconsin",
    WV: "West Virginia"
  }
};

const countryTargets = {
  Australia: "AU",
  Canada: "CA",
  China: "CN",
  France: "FR",
  Italy: "IT",
  Japan: "JP",
  Sweden: "SE",
  UK: "GB",
  "United Kingdom": "GB",
  "United States": "US",
  USA: "US"
};

const countryAliases = {
  AU: "AU",
  CA: "CA",
  CN: "CN",
  FR: "FR",
  GB: "GB",
  IT: "IT",
  JP: "JP",
  SE: "SE",
  UK: "GB",
  USA: "US",
  US: "US"
};

const liveRetailPattern =
  /^https:\/\/www\.apple\.(?:com|com\.cn)\/(?:(?:[a-z]{2}(?:-[a-z]{2})?|[a-z]{4})\/)?retail\//;
const archivedRetailPattern =
  /^https:\/\/web\.archive\.org\/web\/[0-9]+\/https?:\/\/(?:www\.)?apple\.(?:com|com\.cn)\/(?:(?:[a-z]{2}(?:-[a-z]{2})?|[a-z]{4})\/)?retail\//;

const supplementalOpenDates = [
  {
    name: "Apple Borivali",
    openedOn: "2026-02-26",
    source: {
      type: "apple_newsroom",
      label: "Apple Newsroom: Apple Borivali opens in Mumbai this Thursday, February 26",
      url: "https://www.apple.com/in/newsroom/2026/02/apple-borivali-opens-in-mumbai-this-thursday-february-26/",
      license: "reference_only",
      fields: ["openedOn"],
      verifiedAt
    }
  },
  {
    name: "Apple Irvine Spectrum Center",
    openedOn: "2006-02-11",
    source: {
      type: "retail_press",
      label: "9to5Mac: Apple stores in Orland Park, Irvine expanding to new locations",
      url: "https://9to5mac.com/2018/08/13/apple-store-orland-park-irvine-moving-august-18/",
      license: "reference_only",
      fields: ["openedOn"],
      verifiedAt
    }
  }
];

function parseArgs(argv) {
  const args = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg.startsWith("--")) {
      args.set(arg.slice(2), argv[index + 1]);
      index += 1;
    }
  }

  return args;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function defaultAttributes() {
  return Object.fromEntries(attributeKeys.map((key) => [key, "unknown"]));
}

function countryNameForCode(countryCode) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}

function normalizeTitle(value) {
  return value.replace(/_/g, " ").trim();
}

function pageUrlForTitle(title) {
  const encodedTitle = normalizeTitle(title)
    .replace(/\s+/g, "_")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://apple.fandom.com/wiki/${encodedTitle}`;
}

function pageApiUrlForTitle(title) {
  const url = new URL("https://apple.fandom.com/api.php");
  url.searchParams.set("action", "parse");
  url.searchParams.set("page", normalizeTitle(title).replace(/\s+/g, "_"));
  url.searchParams.set("prop", "wikitext");
  url.searchParams.set("format", "json");
  return url.toString();
}

function compactParts(parts) {
  const result = [];
  const seen = new Set();

  for (const part of parts) {
    const value = String(part ?? "").trim();

    if (!value || value === "—") continue;

    const key = value.toLocaleLowerCase();
    if (!seen.has(key)) {
      result.push(value);
      seen.add(key);
    }
  }

  return result;
}

function cleanWikiText(value) {
  let text = String(value ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<ref[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

  for (let pass = 0; pass < 4; pass += 1) {
    text = text.replace(/\{\{w\|([^{}]+)\}\}/g, (_, body) => {
      const parts = body.split("|").map((part) => part.trim()).filter(Boolean);
      return parts.at(-1) ?? "";
    });
    text = text.replace(/\{\{[^{}|]+\|([^{}]+)\}\}/g, (_, body) => {
      const parts = body.split("|").map((part) => part.trim()).filter(Boolean);
      return parts.at(-1) ?? "";
    });
  }

  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/(?:,\s*){2,}/g, ", ")
    .replace(/^,\s*|\s*,$/g, "")
    .trim();
}

function wikiLinks(value) {
  const links = [];
  const text = String(value ?? "");

  for (const match of text.matchAll(/\{\{w\|([^{}]+)\}\}/g)) {
    const parts = match[1].split("|").map((part) => part.trim()).filter(Boolean);
    const target = parts[0];
    const label = parts.at(-1) ?? target;
    links.push({ target, label });
  }

  for (const match of text.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
    links.push({
      target: match[1].trim(),
      label: (match[2] ?? match[1]).trim()
    });
  }

  return links;
}

function countryCodeFromLocation(rawLocation) {
  const candidates = [];

  for (const link of wikiLinks(rawLocation)) {
    const target = link.target.replace(/\s*\([^)]*\)\s*/g, "").trim();
    const label = link.label.trim();
    const code = countryTargets[target] ?? countryTargets[label] ?? countryAliases[label];

    if (code) {
      candidates.push(code);
    }
  }

  if (candidates.includes("JP") && candidates.includes("US") && /Japan/i.test(rawLocation)) {
    return "JP";
  }

  return candidates.at(-1) ?? null;
}

function regionFromParts(parts, countryCode) {
  const aliases = regionNames[countryCode] ?? {};
  const countryValues = new Set([
    countryCode,
    ...Object.entries(countryAliases)
      .filter(([, code]) => code === countryCode)
      .map(([alias]) => alias)
  ]);

  for (const part of parts.slice(1).reverse()) {
    if (countryValues.has(part)) continue;
    if (aliases[part]) return aliases[part];
    if (Object.values(aliases).includes(part)) return part;
  }

  return null;
}

function parsePlace(rawLocation) {
  const address = cleanWikiText(rawLocation);
  const parts = compactParts(address.split(","));
  const countryCode = countryCodeFromLocation(rawLocation) ?? countryAliases[parts.at(-1)] ?? "US";
  const region = regionFromParts(parts, countryCode);
  const city = parts[0] ?? "Unknown";

  return {
    address,
    city,
    countryCode,
    countryName: countryNameForCode(countryCode),
    region
  };
}

function cleanDateCell(value) {
  const cleaned = cleanWikiText(value);
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(cleaned) ? cleaned : null;
}

function cleanStatusCell(value) {
  return cleanWikiText(value.replace(/^style="[^"]*"\|/, ""));
}

function extractLinkedTitle(value) {
  const match = String(value ?? "").match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  return match ? normalizeTitle(match[1]) : null;
}

function extractStruckTitle(value) {
  const match = String(value ?? "").match(/<s>\s*\[\[([^\]|]+)(?:\|[^\]]+)?\]\]\s*<\/s>/i);
  return match ? normalizeTitle(match[1]) : null;
}

function extractStruckLocation(value) {
  const match = String(value ?? "").match(/<s>([\s\S]*?)<\/s>/i);
  return match ? match[1] : null;
}

function primaryLocation(value) {
  return String(value ?? "").split(/<br\s*\/?>/i)[0];
}

function parseHistoryRows(wikitext) {
  return wikitext
    .split(/\n\|-\n/)
    .slice(1)
    .map((row) => {
      const line = row.split("\n").find((item) => item.startsWith("|")) ?? "";
      const cells = line.replace(/^\|/, "").split("||");

      return {
        displayNumber: cleanWikiText(cells[0]),
        originalNumber: cleanWikiText(cells[1]),
        storeCell: cells[2] ?? "",
        storeNumber: cleanWikiText(cells[3]),
        locationCell: cells[4] ?? "",
        openedOn: cleanDateCell(cells[5]),
        closedOn: cleanDateCell(cells[6]),
        statusText: cleanStatusCell(cells[7] ?? "")
      };
    });
}

function historicalEntriesFromRows(rows) {
  const entries = [];

  for (const row of rows) {
    const isClosed = row.statusText === "Closed";

    if (isClosed) {
      const title = extractStruckTitle(row.storeCell) ?? extractLinkedTitle(row.storeCell);
      if (!title) continue;

      entries.push({
        kind: "closed",
        title,
        storeNumber: row.storeNumber,
        rawLocation: primaryLocation(row.locationCell),
        openedOn: row.openedOn,
        closedOn: row.closedOn,
        originalNumber: row.originalNumber
      });
      continue;
    }

    const struckTitle = extractStruckTitle(row.storeCell);
    if (!struckTitle) continue;

    entries.push({
      kind: "relocated",
      title: struckTitle,
      storeNumber: row.storeNumber,
      rawLocation: extractStruckLocation(row.locationCell) ?? primaryLocation(row.locationCell),
      openedOn: row.openedOn,
      closedOn: null,
      originalNumber: row.originalNumber
    });
  }

  return entries;
}

function openRowsFromRows(rows) {
  return rows.filter((row) => row.statusText === "Open" && row.storeNumber && row.openedOn);
}

function storeNameFromRow(row) {
  return extractLinkedTitle(primaryLocation(row.storeCell)) ?? extractLinkedTitle(row.storeCell);
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to download ${url}: ${response.status}`);
  }

  return response.json();
}

async function loadHistoryWikitext(inputPath) {
  if (inputPath) {
    const json = JSON.parse(await readFile(resolve(inputPath), "utf8"));
    return json.parse.wikitext["*"];
  }

  const json = await fetchJson(listApiUrl);
  return json.parse.wikitext["*"];
}

function parseStoreTemplate(wikitext) {
  const fields = {};
  let inTemplate = false;

  for (const line of wikitext.split("\n")) {
    if (line.startsWith("{{Store")) {
      inTemplate = true;
      continue;
    }

    if (!inTemplate) continue;
    if (line.startsWith("}}")) break;

    const match = line.match(/^\|([^=]+?)\s*=\s*(.*)$/);
    if (match) {
      fields[match[1].trim()] = match[2].trim();
    }
  }

  return fields;
}

function normalizeExternalUrl(value) {
  return String(value ?? "")
    .replace(/&amp;/g, "&")
    .replace(/[)\],.;]+$/g, "")
    .replace(/^http:\/\/www\.apple\./, "https://www.apple.");
}

function allUrls(value) {
  return [...String(value ?? "").matchAll(/https?:\/\/[^\s\]<>"']+/g)].map((match) =>
    normalizeExternalUrl(match[0])
  );
}

function isOfficialRetailUrl(value) {
  return liveRetailPattern.test(value) || archivedRetailPattern.test(value);
}

function normalizeOfficialRetailUrl(value) {
  if (!value) return null;
  const normalized = normalizeExternalUrl(value);

  if (!isOfficialRetailUrl(normalized)) {
    return null;
  }

  if (liveRetailPattern.test(normalized) && !normalized.endsWith("/")) {
    return `${normalized}/`;
  }

  return normalized;
}

function findOfficialRetailUrl(...values) {
  const urls = values.flatMap(allUrls);
  const archived = urls.find((url) => archivedRetailPattern.test(url));
  const live = urls.find((url) => liveRetailPattern.test(url));

  return normalizeOfficialRetailUrl(archived ?? live ?? null);
}

async function fetchPageDetails(title) {
  const pageUrl = pageUrlForTitle(title);

  try {
    const json = await fetchJson(pageApiUrlForTitle(title));
    const wikitext = json.parse?.wikitext?.["*"] ?? "";

    if (!wikitext || wikitext.startsWith("#REDIRECT")) {
      return { pageUrl, fields: {}, address: null, officialUrl: null, redirected: true };
    }

    const fields = parseStoreTemplate(wikitext);

    return {
      pageUrl,
      fields,
      address: fields.location ? cleanWikiText(fields.location) : null,
      officialUrl: findOfficialRetailUrl(fields.url, wikitext),
      redirected: false
    };
  } catch (error) {
    console.warn(`Could not fetch ${pageUrl}: ${error instanceof Error ? error.message : error}`);
    return { pageUrl, fields: {}, address: null, officialUrl: null, redirected: false };
  }
}

function sourceKey(source) {
  return `${source.type ?? ""}|${source.url}|${source.license}`;
}

function mergeSources(existingSources = [], importedSources = []) {
  const merged = [];
  const seen = new Set();

  for (const source of [...existingSources, ...importedSources]) {
    const key = sourceKey(source);

    if (!seen.has(key)) {
      merged.push(source);
      seen.add(key);
    }
  }

  return merged;
}

function isCuratedArchitecture(architecture) {
  if (!architecture) return false;
  if (architecture.era && architecture.era !== "Unknown") return true;
  if (architecture.typology && architecture.typology !== "Unknown") return true;
  if (architecture.notes?.length) return true;
  return Object.values(architecture.attributes ?? {}).some((value) => value !== "unknown");
}

function normalizeArchitecture(architecture) {
  return {
    ...architecture,
    attributes: {
      ...defaultAttributes(),
      ...(architecture.attributes ?? {})
    }
  };
}

function latestDate(left, right) {
  if (!left) return right;
  if (!right) return left;
  return left > right ? left : right;
}

function historyTableSource(fields) {
  return {
    type: "apple_wiki_history_table",
    label: "Apple Wiki opening-date table",
    url: listPageUrl,
    license: "CC-BY-SA-3.0",
    fields,
    verifiedAt
  };
}

function sourceList(entry, pageDetails, officialUrl) {
  const sources = [
    historyTableSource([
      "storeNumber",
      "name",
      "status",
      "city",
      "region",
      "countryCode",
      "openedOn",
      "closedOn"
    ])
  ];

  if (pageDetails.address || pageDetails.officialUrl) {
    sources.push({
      type: "apple_wiki_store_page",
      label: `Apple Wiki page: ${entry.title}`,
      url: pageDetails.pageUrl,
      license: "CC-BY-SA-3.0",
      fields: compactParts([
        pageDetails.address ? "address" : null,
        pageDetails.officialUrl ? "officialUrl" : null
      ]),
      verifiedAt
    });
  }

  if (officialUrl) {
    sources.push({
      type: officialUrl.includes("web.archive.org")
        ? "apple_archived_official_page"
        : "apple_official_page",
      label: officialUrl.includes("web.archive.org")
        ? "Archived Apple official store page"
        : "Apple official store page",
      url: officialUrl,
      license: "reference_only",
      fields: ["officialUrl", "hours.officialUrl"],
      verifiedAt
    });
  }

  sources.push({
    type: "fandom_license",
    label: "Fandom licensing terms",
    url: licenseUrl,
    license: "reference_only",
    fields: ["sources.license"],
    verifiedAt
  });

  return sources;
}

function buildImportedRecord(entry, pageDetails) {
  const place = parsePlace(entry.rawLocation);
  const name = normalizeTitle(entry.title);
  const officialUrl = pageDetails.officialUrl;
  const isClosed = entry.kind === "closed";
  const address = pageDetails.address ?? place.address;

  return {
    id: slugify(name),
    storeNumber: entry.storeNumber || undefined,
    name: {
      en: name,
      fr: name
    },
    status: isClosed ? "closed" : "relocated",
    city: place.city,
    region: place.region ?? undefined,
    countryCode: place.countryCode,
    countryName: place.countryName,
    address,
    coordinates: null,
    openedOn: entry.openedOn,
    closedOn: entry.closedOn,
    officialUrl,
    architecture: {
      era: "Unknown",
      typology: "Unknown",
      attributes: defaultAttributes(),
      notes: [
        isClosed
          ? "Closed Apple Store imported from the Apple Wiki historical opening-date table."
          : "Former Apple Store location imported from the Apple Wiki historical relocation markers."
      ]
    },
    hours: {
      policy: "official-link-only",
      officialUrl,
      lastVerifiedAt: null,
      note: isClosed
        ? "This store is closed. No current hours are available; use the linked sources for archival details."
        : "This is a former Apple Store location. Hours are not available for the historical address."
    },
    photos: [],
    sources: sourceList(entry, pageDetails, officialUrl),
    lastVerifiedAt: verifiedAt
  };
}

async function readExistingStores() {
  const stores = new Map();

  if (!existsSync(storesDir)) {
    return stores;
  }

  const files = (await readdir(storesDir)).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const record = JSON.parse(await readFile(join(storesDir, file), "utf8"));
    stores.set(record.id, record);
  }

  return stores;
}

function applyOpenHistoryRows(existingStores, rows) {
  const stores = new Map(existingStores);
  const openRows = openRowsFromRows(rows);
  const rowsByStoreNumber = new Map(openRows.map((row) => [row.storeNumber, row]));
  const rowsByName = new Map(
    openRows
      .map((row) => [slugify(storeNameFromRow(row) ?? ""), row])
      .filter(([nameKey]) => nameKey)
  );
  const supplementalDatesByName = new Map(
    supplementalOpenDates.map((item) => [slugify(item.name), item])
  );
  let updatedCount = 0;

  for (const [id, store] of stores) {
    if (store.status !== "open" || !store.storeNumber) continue;

    const row = rowsByStoreNumber.get(store.storeNumber) ?? rowsByName.get(slugify(store.name.en));
    const supplemental = supplementalDatesByName.get(slugify(store.name.en));
    if (!row && !supplemental) continue;

    const openedOn = store.openedOn ?? row?.openedOn ?? supplemental?.openedOn ?? null;
    const sources = [...store.sources];

    if (row) {
      sources.push(historyTableSource(["openedOn"]));
    }

    if (supplemental) {
      sources.push(supplemental.source);
    }

    const nextStore = {
      ...store,
      openedOn,
      sources: mergeSources([], sources),
      lastVerifiedAt: latestDate(store.lastVerifiedAt, verifiedAt)
    };

    stores.set(id, nextStore);
    updatedCount += 1;
  }

  return { stores, updatedCount };
}

function mergeRecord(importedRecord, existingRecord) {
  if (!existingRecord) {
    return importedRecord;
  }

  const officialUrl = importedRecord.officialUrl ?? existingRecord.officialUrl ?? null;
  const hoursOfficialUrl =
    importedRecord.hours.officialUrl ?? existingRecord.hours?.officialUrl ?? officialUrl;

  return {
    ...importedRecord,
    id: existingRecord.id,
    coordinates: existingRecord.coordinates ?? importedRecord.coordinates,
    openedOn: importedRecord.openedOn ?? existingRecord.openedOn,
    closedOn: importedRecord.closedOn ?? existingRecord.closedOn,
    officialUrl,
    architecture: isCuratedArchitecture(existingRecord.architecture)
      ? normalizeArchitecture(existingRecord.architecture)
      : importedRecord.architecture,
    hours: {
      ...importedRecord.hours,
      officialUrl: hoursOfficialUrl
    },
    photos: existingRecord.photos ?? importedRecord.photos,
    sources: mergeSources(importedRecord.sources, existingRecord.sources),
    lastVerifiedAt: latestDate(existingRecord.lastVerifiedAt, importedRecord.lastVerifiedAt)
  };
}

function sortStores(stores) {
  return stores.sort((left, right) => {
    const leftKey = [
      left.countryName ?? left.countryCode,
      left.region ?? "",
      left.city,
      left.name.en
    ].join("\u0000");
    const rightKey = [
      right.countryName ?? right.countryCode,
      right.region ?? "",
      right.city,
      right.name.en
    ].join("\u0000");

    return leftKey.localeCompare(rightKey, "en");
  });
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeMobileStores(stores) {
  const body = JSON.stringify(stores, null, 2);
  const content = `/* This file is generated by the Apple data import scripts. */\nimport type { StoreRecord } from "./store.types";\n\nexport const generatedStores: StoreRecord[] = ${body};\n`;
  await writeFile(mobileGeneratedPath, content);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const wikitext = await loadHistoryWikitext(args.get("input"));
  const rows = parseHistoryRows(wikitext);
  const historyEntries = historicalEntriesFromRows(rows);
  const existingStores = await readExistingStores();
  const { stores: existingStoresWithOpenHistory, updatedCount: updatedOpenRecordCount } =
    applyOpenHistoryRows(existingStores, rows);
  const importedStores = [];

  for (const entry of historyEntries) {
    const pageDetails = await fetchPageDetails(entry.title);
    const importedRecord = buildImportedRecord(entry, pageDetails);
    importedStores.push(mergeRecord(importedRecord, existingStoresWithOpenHistory.get(importedRecord.id)));
  }

  const importedIds = new Set(importedStores.map((store) => store.id));
  const preservedStores = [...existingStoresWithOpenHistory.values()].filter(
    (store) => !importedIds.has(store.id)
  );
  const stores = sortStores([...preservedStores, ...importedStores]);
  const statusCounts = importedStores.reduce((counts, store) => {
    counts[store.status] = (counts[store.status] ?? 0) + 1;
    return counts;
  }, {});

  await mkdir(storesDir, { recursive: true });
  await mkdir(importsDir, { recursive: true });

  for (const store of stores) {
    await writeJson(join(storesDir, `${store.id}.json`), store);
  }

  await writeJson(bundlePath, stores);
  await writeMobileStores(stores);
  await writeJson(join(importsDir, `apple-history-${generatedAt}.manifest.json`), {
    source: "Apple Wiki / Fandom",
    sourceUrl: listPageUrl,
    apiUrl: listApiUrl,
    license: "CC-BY-SA-3.0",
    licenseUrl,
    verifiedAt,
    generatedAt,
    parsedTableRowCount: rows.length,
    updatedOpenRecordCount,
    importedHistoricalRecordCount: importedStores.length,
    importedStatusCounts: statusCounts,
    generatedStoreCount: stores.length,
    notes: [
      "This import adds closed stores and former relocated store names present in the Apple Wiki opening-date table.",
      "Coordinates remain null unless a future source verifies an exact former storefront location.",
      "Fandom-derived fields retain CC BY-SA source attribution and are not treated as CC0 curated metadata."
    ]
  });

  console.log(`Imported ${importedStores.length} Apple historical store record(s).`);
  console.log(`Updated ${updatedOpenRecordCount} open Apple store record(s) with opening dates.`);
  console.log(`Status counts: ${JSON.stringify(statusCounts)}`);
  console.log(`Generated ${stores.length} Atlas store record(s).`);
}

await main();
