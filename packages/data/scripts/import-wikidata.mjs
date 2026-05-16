import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(root, "imports");
const outPath = join(outDir, "wikidata-apple-stores.json");
const endpoint = "https://query.wikidata.org/sparql";

const query = `
SELECT ?item ?itemLabel (SAMPLE(?coord) AS ?coord) (SAMPLE(?countryCode) AS ?countryCode)
       (SAMPLE(?countryLabel) AS ?countryLabel) (SAMPLE(?adminLabel) AS ?adminLabel)
       (SAMPLE(?official) AS ?official)
WHERE {
  ?item wdt:P31/wdt:P279* wd:Q421253.
  OPTIONAL { ?item wdt:P625 ?coord. }
  OPTIONAL {
    ?item wdt:P17 ?country.
    ?country wdt:P297 ?countryCode.
    ?country rdfs:label ?countryLabel.
    FILTER(LANG(?countryLabel) = "en")
  }
  OPTIONAL {
    ?item wdt:P131 ?admin.
    ?admin rdfs:label ?adminLabel.
    FILTER(LANG(?adminLabel) = "en")
  }
  OPTIONAL { ?item wdt:P856 ?official. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr". }
}
GROUP BY ?item ?itemLabel
ORDER BY ?itemLabel
`;

function bindingValue(binding, key) {
  return binding[key]?.value ?? null;
}

function parsePoint(value) {
  if (!value) return null;
  const match = value.match(/^Point\(([-0-9.]+) ([-0-9.]+)\)$/);
  if (!match) return null;
  return {
    latitude: Number(match[2]),
    longitude: Number(match[1])
  };
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function storeSlug(label, officialUrl) {
  const officialSlug = officialUrl?.match(/\/retail\/([^/?#]+)\/?/)?.[1];
  return officialSlug ? `apple-${slugify(officialSlug)}` : slugify(label);
}

const url = new URL(endpoint);
url.searchParams.set("format", "json");
url.searchParams.set("query", query);

const response = await fetch(url, {
  headers: {
    "accept": "application/sparql-results+json",
    "user-agent": "AtlasOpenDataImporter/0.1 (https://github.com/)"
  }
});

if (!response.ok) {
  throw new Error(`Wikidata request failed: ${response.status} ${await response.text()}`);
}

const json = await response.json();
const importedAt = new Date().toISOString();
const records = json.results.bindings.map((binding) => {
  const label = bindingValue(binding, "itemLabel");
  const item = bindingValue(binding, "item");
  const officialUrl = bindingValue(binding, "official");
  const coordinates = parsePoint(bindingValue(binding, "coord"));
  const countryCode = bindingValue(binding, "countryCode");
  const countryName = bindingValue(binding, "countryLabel");
  const region = bindingValue(binding, "adminLabel");

  return {
    id: storeSlug(label, officialUrl),
    status: "open",
    name: {
      en: label,
      fr: label
    },
    countryCode,
    countryName,
    region,
    city: region ?? "Needs review",
    address: "Needs review",
    coordinates,
    openedOn: null,
    closedOn: null,
    officialUrl,
    architecture: {
      era: "Needs review",
      typology: "Needs review",
      attributes: {}
    },
    hours: {
      policy: "official-link-only",
      officialUrl,
      lastVerifiedAt: null,
      note: "Hours are volatile. Verify on the official Apple page."
    },
    sources: [
      {
        type: "wikidata_item",
        label: `Wikidata item ${item.split("/").pop()}`,
        url: `https://www.wikidata.org/wiki/${item.split("/").pop()}`,
        license: "CC0-1.0",
        fields: ["name", "coordinates", "countryCode", "officialUrl"],
        verifiedAt: importedAt.slice(0, 10)
      }
    ],
    reviewState: "imported_needs_human_review",
    importedAt
  };
});

await mkdir(outDir, { recursive: true });
await writeFile(
  outPath,
  `${JSON.stringify(
    {
      source: "Wikidata SPARQL",
      sourceUrl: "https://www.wikidata.org/wiki/Q421253",
      license: "CC0-1.0",
      importedAt,
      count: records.length,
      records
    },
    null,
    2
  )}\n`
);

console.log(`Imported ${records.length} Wikidata candidate store record(s) to ${outPath}.`);
console.log("Review each record before promoting it to packages/data/stores.");
