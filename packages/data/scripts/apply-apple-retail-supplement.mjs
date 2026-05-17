import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
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
const defaultInputPath = join(
  dataRoot,
  "imports",
  "user",
  "apple-retail-storelist-2026-05-18.json"
);
const manifestPath = join(
  dataRoot,
  "imports",
  "user",
  "apple-retail-storelist-2026-05-18.manifest.json"
);
const fallbackSourceUrl =
  "https://github.com/Logarex/Atlas/blob/main/packages/data/imports/user/apple-retail-storelist-2026-05-18.json";

const defaultVerifiedAt = "2026-05-18";

const architectureBooleanFields = {
  avenues: "avenue",
  boardroom: "boardroom",
  forum: "forum",
  gp: "geniusBar",
  green: "greenWall",
  outdoor: "outdoor",
  pickup: "pickup",
  plaza: "plaza",
  trees: "trees"
};

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

const countryCodeByName = {
  Australia: "AU",
  Austria: "AT",
  Belgium: "BE",
  Brazil: "BR",
  Canada: "CA",
  "China mainland": "CN",
  France: "FR",
  Germany: "DE",
  "Hong Kong": "HK",
  India: "IN",
  Italy: "IT",
  Japan: "JP",
  Macao: "MO",
  Malaysia: "MY",
  Mexico: "MX",
  Netherlands: "NL",
  Singapore: "SG",
  "South Korea": "KR",
  Spain: "ES",
  Sweden: "SE",
  Switzerland: "CH",
  Taiwan: "TW",
  Thailand: "TH",
  Türkiye: "TR",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US"
};

const supplementalClosureSources = {
  R658: {
    type: "retail_press",
    label: "MacRumors: Apple Watch Pop Up Shop at Galeries Lafayette in Paris Shuts Down",
    url: "https://www.macrumors.com/2017/01/21/apple-watch-galeries-lafayette-shuts-down/",
    license: "reference_only",
    fields: ["status", "closedOn"],
    verifiedAt: defaultVerifiedAt
  },
  R659: {
    type: "retail_press",
    label: "MacRumors: Selfridges Apple Watch Pop Up Shop Shuts Down",
    url: "https://www.macrumors.com/2017/01/03/selfridges-apple-watch-shuts-down/",
    license: "reference_only",
    fields: ["status", "closedOn"],
    verifiedAt: defaultVerifiedAt
  },
  RXXX: {
    type: "retail_press",
    label: "9to5Mac: World's last Apple Watch shop at Isetan Shinjuku closing May 13th",
    url: "https://9to5mac.com/2018/04/21/apple-watch-isetan-shinjuku-closing-may-13/",
    license: "reference_only",
    fields: ["status", "closedOn"],
    verifiedAt: defaultVerifiedAt
  }
};

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

async function readExistingStores() {
  const stores = [];

  if (!existsSync(storesDir)) {
    return stores;
  }

  const files = (await readdir(storesDir)).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    stores.push(JSON.parse(await readFile(join(storesDir, file), "utf8")));
  }

  return stores;
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

function defaultAttributes() {
  return Object.fromEntries(attributeKeys.map((key) => [key, "unknown"]));
}

function mergeAliases(existingAliases = [], importedAliases = []) {
  const merged = [];
  const seen = new Set();

  for (const alias of [...existingAliases, ...importedAliases]) {
    const value = String(alias ?? "").trim();
    const key = value.toLocaleLowerCase();

    if (value && !seen.has(key)) {
      merged.push(value);
      seen.add(key);
    }
  }

  return merged;
}

function isMeaningful(value) {
  const text = String(value ?? "").trim();
  return Boolean(text) && text !== "-";
}

function coordinatePair(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const [latitude, longitude] = value.split(",").map((part) => Number(part.trim()));

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    ) {
      return { latitude, longitude };
    }

    return null;
  }

  const latitude = Number(value.latitude);
  const longitude = Number(value.longitude);

  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  ) {
    return { latitude, longitude };
  }

  return null;
}

function latestDate(left, right) {
  if (!left) return right;
  if (!right) return left;
  return left > right ? left : right;
}

function isIsoDate(value) {
  const text = String(value ?? "").trim();
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(text)) return false;

  const date = new Date(`${text}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

function normalizedDate(value) {
  const text = String(value ?? "").trim();
  return isIsoDate(text) ? text : null;
}

function normalizedUrl(value) {
  if (!isMeaningful(value)) return null;

  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";

    if (!url.pathname.endsWith("/")) {
      url.pathname = `${url.pathname}/`;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function countryNameForCode(countryCode) {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
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

function compactParts(parts) {
  const result = [];
  const seen = new Set();

  for (const part of parts) {
    const value = String(part ?? "").trim();

    if (!value || value === "-") continue;

    const key = value.toLocaleLowerCase();
    if (!seen.has(key)) {
      result.push(value);
      seen.add(key);
    }
  }

  return result;
}

function supplementalSource(importFile, fields, verifiedAt) {
  return {
    type: "user_provided_retail_metadata",
    label: "User-provided Apple retail metadata supplement",
    url: importFile.sourceUrl ?? fallbackSourceUrl,
    license: "user-provided factual metadata",
    fields,
    verifiedAt
  };
}

function supplementalSourceForStore(store, importFile) {
  const sourceUrl = importFile.sourceUrl ?? fallbackSourceUrl;
  return store.sources?.find(
    (source) => source.type === "user_provided_retail_metadata" && source.url === sourceUrl
  );
}

function storeNumberForSupplement(supplement) {
  for (const key of ["storeNumber", "image", "ref"]) {
    const value = String(supplement[key] ?? "").trim();
    if (/^R[0-9A-Z]+$/i.test(value)) return value.toUpperCase();
  }

  return null;
}

function aliasesFromSupplement(supplement) {
  const aliases = [...(supplement.aliases ?? [])];

  for (const key of ["usname", "formername"]) {
    if (isMeaningful(supplement[key])) {
      aliases.push(String(supplement[key]).trim());
    }
  }

  if (isMeaningful(supplement.name) && /[^\u0000-\u007f]/.test(String(supplement.name))) {
    aliases.push(String(supplement.name).trim());
  }

  return aliases;
}

function normalizeSupplement(supplement) {
  return {
    ...supplement,
    aliases: aliasesFromSupplement(supplement),
    coordinates: supplement.coordinates ?? supplement.coords,
    closedOn: supplement.closedOn ?? supplement.closed,
    openedOn: supplement.openedOn ?? supplement.dateopened,
    officialUrl: supplement.officialUrl ?? supplement.url ?? null,
    storeNumber: storeNumberForSupplement(supplement) ?? supplement.storeNumber ?? null
  };
}

function matchStore(stores, supplement) {
  if (supplement.id) {
    const byId = stores.find((store) => store.id === supplement.id);
    if (byId) return byId;
  }

  if (supplement.storeNumber) {
    const candidates = stores.filter((store) => store.storeNumber === supplement.storeNumber);
    const officialUrl = normalizedUrl(supplement.officialUrl);
    const byUrl = candidates.find(
      (store) =>
        normalizedUrl(store.officialUrl) === officialUrl ||
        normalizedUrl(store.hours?.officialUrl) === officialUrl
    );

    if (byUrl) return byUrl;

    const supplementName = slugify(supplement.name ?? "");
    const byName = candidates.find(
      (store) => slugify(store.name.en.replace(/^Apple\s+/i, "")) === supplementName
    );

    if (byName) return byName;

    if (supplement.isclosed) {
      return candidates.find((store) => store.status !== "open") ?? candidates[0] ?? null;
    }

    return candidates.find((store) => store.status === "open") ?? candidates[0] ?? null;
  }

  return null;
}

function architecturePatch(store, supplement) {
  const fields = [];
  let architecture = {
    ...store.architecture,
    attributes: {
      ...(store.architecture?.attributes ?? {})
    }
  };

  if (
    isMeaningful(supplement.type) &&
    (!architecture.typology || architecture.typology === "Unknown")
  ) {
    architecture = {
      ...architecture,
      typology: String(supplement.type).trim()
    };
    fields.push("architecture.typology");
  }

  for (const [sourceKey, targetKey] of Object.entries(architectureBooleanFields)) {
    const importedValue =
      supplement[sourceKey] === true ? "yes" : supplement[sourceKey] === false ? "no" : null;

    if (!importedValue) continue;

    const currentValue = architecture.attributes[targetKey];
    if (!currentValue || currentValue === "unknown") {
      architecture.attributes[targetKey] = importedValue;
      fields.push(`architecture.attributes.${targetKey}`);
    }
  }

  return { architecture, fields };
}

function buildSupplementalRecord(supplement, importFile) {
  const storeNumber = supplement.storeNumber;
  if (!storeNumber || !supplement.isclosed) return null;

  const countryCode = countryCodeByName[supplement.country] ?? supplement.countryCode;
  if (!countryCode) return null;

  const name = String(supplement.name ?? "").trim();
  if (!name) return null;

  const coordinates = coordinatePair(supplement.coordinates);
  const openedOn = normalizedDate(supplement.openedOn);
  const closedOn = normalizedDate(supplement.closedOn);
  const officialUrl = isMeaningful(supplement.officialUrl) ? supplement.officialUrl : null;
  const fields = [
    "storeNumber",
    "name",
    "status",
    "city",
    "region",
    "countryCode",
    "countryName",
    "address",
    "coordinates",
    "openedOn",
    "closedOn",
    "officialUrl",
    "architecture.typology",
    ...Object.values(architectureBooleanFields).map((key) => `architecture.attributes.${key}`)
  ];
  const source = supplementalSource(importFile, fields, importFile.verifiedAt);
  const extraSource = supplementalClosureSources[storeNumber];
  const architecture = architecturePatch(
    {
      architecture: {
        era: "Unknown",
        typology: "Unknown",
        attributes: defaultAttributes()
      }
    },
    supplement
  ).architecture;

  return {
    id: `apple-${slugify(name)}`,
    storeNumber,
    aliases: mergeAliases([], supplement.aliases),
    name: {
      en: `Apple ${name}`,
      fr: `Apple ${name}`
    },
    status: "closed",
    city: String(supplement.city ?? "").trim(),
    region: isMeaningful(supplement.state) ? String(supplement.state).trim() : undefined,
    countryCode,
    countryName: countryNameForCode(countryCode),
    address: compactParts([
      supplement.address,
      supplement.city,
      supplement.state,
      supplement.country
    ]).join(", "),
    coordinates,
    openedOn,
    closedOn,
    officialUrl,
    architecture: {
      ...architecture,
      notes: [
        "Closed Apple Watch shop imported from the user-provided Apple retail storelist."
      ]
    },
    hours: {
      policy: "official-link-only",
      officialUrl,
      lastVerifiedAt: null,
      note: "This store is closed. No current hours are available; use the linked sources for archival details."
    },
    photos: [],
    sources: mergeSources([source], extraSource ? [extraSource] : []),
    lastVerifiedAt: importFile.verifiedAt
  };
}

function applySupplement(store, supplement, importFile) {
  const updatedFields = [];
  let nextStore = { ...store };

  const aliases = mergeAliases(store.aliases, supplement.aliases);
  if (aliases.length > (store.aliases?.length ?? 0)) {
    nextStore = { ...nextStore, aliases };
    updatedFields.push("aliases");
  }

  const coordinates = coordinatePair(supplement.coordinates);
  if (!store.coordinates && coordinates) {
    nextStore = { ...nextStore, coordinates };
    updatedFields.push("coordinates");
  }

  const openedOn = normalizedDate(supplement.openedOn);
  if (openedOn && nextStore.openedOn !== openedOn) {
    nextStore = { ...nextStore, openedOn };
    updatedFields.push("openedOn");
  }

  const closedOn = normalizedDate(supplement.closedOn);
  if (!nextStore.closedOn && closedOn && nextStore.status === "closed") {
    nextStore = { ...nextStore, closedOn };
    updatedFields.push("closedOn");
  }

  if (
    supplement.replaceAddress &&
    isMeaningful(supplement.address) &&
    supplement.address !== store.address
  ) {
    nextStore = { ...nextStore, address: supplement.address };
    updatedFields.push("address");
  }

  if (
    !store.officialUrl &&
    isMeaningful(supplement.officialUrl) &&
    String(supplement.officialUrl).startsWith("https://")
  ) {
    nextStore = { ...nextStore, officialUrl: supplement.officialUrl };
    updatedFields.push("officialUrl");
  }

  const hoursOfficialUrl = nextStore.hours?.officialUrl ?? null;
  if (!hoursOfficialUrl && nextStore.officialUrl) {
    nextStore = {
      ...nextStore,
      hours: {
        ...nextStore.hours,
        officialUrl: nextStore.officialUrl
      }
    };
    updatedFields.push("hours.officialUrl");
  }

  const { architecture, fields: architectureFields } = architecturePatch(nextStore, supplement);
  if (architectureFields.length > 0) {
    nextStore = { ...nextStore, architecture };
    updatedFields.push(...architectureFields);
  }

  if (updatedFields.length === 0) {
    return { store, updatedFields };
  }

  nextStore = {
    ...nextStore,
    sources: mergeSources(nextStore.sources, [
      supplementalSource(importFile, updatedFields, importFile.verifiedAt)
    ]),
    lastVerifiedAt: latestDate(nextStore.lastVerifiedAt, importFile.verifiedAt)
  };

  return { store: nextStore, updatedFields };
}

function normalizeStore(store) {
  return {
    ...store,
    architecture: {
      ...store.architecture,
      attributes: {
        ...defaultAttributes(),
        ...(store.architecture?.attributes ?? {})
      }
    }
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
  const inputPath = resolve(args.get("input") ?? defaultInputPath);
  const rawImportFile = JSON.parse(await readFile(inputPath, "utf8"));
  const importFile = Array.isArray(rawImportFile)
    ? {
        source: "User-provided Apple retail metadata list",
        sourceUrl: fallbackSourceUrl,
        verifiedAt: defaultVerifiedAt,
        records: rawImportFile,
        notes: [
          "Raw array import. Status fields are treated as non-authoritative; Atlas keeps existing current status and closure dates."
        ]
      }
    : rawImportFile;
  importFile.verifiedAt = importFile.verifiedAt ?? defaultVerifiedAt;
  const stores = await readExistingStores();
  const storesById = new Map(stores.map((store) => [store.id, store]));
  const unmatched = [];
  const imported = [];
  const updated = [];

  for (const supplement of importFile.records ?? []) {
    const normalizedSupplement = normalizeSupplement(supplement);
    const store = matchStore(stores, normalizedSupplement);

    if (!store) {
      const importedRecord = buildSupplementalRecord(normalizedSupplement, importFile);

      if (importedRecord) {
        storesById.set(importedRecord.id, importedRecord);
        imported.push({
          id: importedRecord.id,
          storeNumber: importedRecord.storeNumber
        });
      } else {
        unmatched.push(
          normalizedSupplement.id ?? normalizedSupplement.storeNumber ?? supplement.image ?? "unknown"
        );
      }
      continue;
    }

    const { store: nextStore, updatedFields } = applySupplement(
      store,
      normalizedSupplement,
      importFile
    );
    storesById.set(nextStore.id, nextStore);

    if (updatedFields.length > 0) {
      updated.push({
        id: nextStore.id,
        storeNumber: nextStore.storeNumber,
        fields: updatedFields
      });
    }
  }

  const nextStores = sortStores([...storesById.values()].map(normalizeStore));
  const sourceCoverage = nextStores.flatMap((store) => {
    const source = supplementalSourceForStore(store, importFile);

    if (!source) return [];

    return [
      {
        id: store.id,
        storeNumber: store.storeNumber,
        fields: source.fields
      }
    ];
  });
  const importedCoverage = sourceCoverage.filter(
    (store) => supplementalClosureSources[store.storeNumber]
  );
  const updatedCoverage = sourceCoverage.filter(
    (store) => !supplementalClosureSources[store.storeNumber]
  );
  const manifestImported = imported.length > 0 ? imported : importedCoverage;
  const manifestUpdated = updated.length > 0 ? updated : updatedCoverage;

  await mkdir(storesDir, { recursive: true });
  await mkdir(dirname(manifestPath), { recursive: true });

  for (const store of nextStores) {
    await writeJson(join(storesDir, `${store.id}.json`), store);
  }

  await writeJson(bundlePath, nextStores);
  await writeMobileStores(nextStores);
  await writeJson(manifestPath, {
    source: importFile.source,
    sourceUrl: importFile.sourceUrl,
    license: "user-provided factual metadata",
    verifiedAt: importFile.verifiedAt,
    generatedAt: importFile.verifiedAt,
    inputPath: relative(repoRoot, inputPath),
    consideredRecordCount: importFile.records?.length ?? 0,
    sourcedRecordCount: sourceCoverage.length,
    importedRecordCount: manifestImported.length,
    updatedRecordCount: manifestUpdated.length,
    imported: manifestImported,
    unmatched,
    updated: manifestUpdated,
    notes: importFile.notes
  });

  console.log(`Considered ${importFile.records?.length ?? 0} supplemental record(s).`);
  console.log(`Imported ${imported.length} supplemental store record(s).`);
  console.log(`Updated ${updated.length} Atlas store record(s).`);
  if (unmatched.length > 0) {
    console.log(`Unmatched supplemental record(s): ${unmatched.join(", ")}`);
  }
  console.log(`Generated ${nextStores.length} Atlas store record(s).`);
}

await main();
