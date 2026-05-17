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
  "apple-retail-supplement-2026-05-17.json"
);
const manifestPath = join(
  dataRoot,
  "imports",
  "user",
  "apple-retail-supplement-2026-05-17.manifest.json"
);
const fallbackSourceUrl =
  "https://github.com/Logarex/Atlas/blob/main/packages/data/imports/user/apple-retail-supplement-2026-05-17.json";

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
    return candidates.find((store) => store.status !== "open") ?? candidates[0] ?? null;
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
    if (supplement[sourceKey] === true && architecture.attributes[targetKey] !== "yes") {
      architecture.attributes[targetKey] = "yes";
      fields.push(`architecture.attributes.${targetKey}`);
    }
  }

  return { architecture, fields };
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
        verifiedAt: "2026-05-17",
        records: rawImportFile,
        notes: [
          "Raw array import. Status fields are treated as non-authoritative; Atlas keeps existing current status and closure dates."
        ]
      }
    : rawImportFile;
  const stores = await readExistingStores();
  const storesById = new Map(stores.map((store) => [store.id, store]));
  const unmatched = [];
  const updated = [];

  for (const supplement of importFile.records ?? []) {
    const normalizedSupplement = normalizeSupplement(supplement);
    const store = matchStore(stores, normalizedSupplement);

    if (!store) {
      unmatched.push(
        normalizedSupplement.id ?? normalizedSupplement.storeNumber ?? supplement.image ?? "unknown"
      );
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

  const nextStores = sortStores([...storesById.values()]);

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
    updatedRecordCount: updated.length,
    unmatched,
    updated,
    notes: importFile.notes
  });

  console.log(`Considered ${importFile.records?.length ?? 0} supplemental record(s).`);
  console.log(`Updated ${updated.length} Atlas store record(s).`);
  if (unmatched.length > 0) {
    console.log(`Unmatched supplemental record(s): ${unmatched.join(", ")}`);
  }
  console.log(`Generated ${nextStores.length} Atlas store record(s).`);
}

await main();
