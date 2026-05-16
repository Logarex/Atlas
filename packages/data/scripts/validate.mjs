import Ajv2020 from "ajv/dist/2020.js";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const schemaPath = join(root, "schema", "store.schema.json");
const storesDir = join(root, "stores");

const ajv = new Ajv2020({ allErrors: true, strict: false });
const schema = JSON.parse(await readFile(schemaPath, "utf8"));
const validate = ajv.compile(schema);
const files = (await readdir(storesDir)).filter((file) => file.endsWith(".json"));

let failures = 0;

for (const file of files) {
  const record = JSON.parse(await readFile(join(storesDir, file), "utf8"));
  const valid = validate(record);

  if (!valid) {
    failures += 1;
    console.error(`Invalid store record: ${file}`);
    for (const error of validate.errors ?? []) {
      console.error(`  ${error.instancePath || "/"} ${error.message}`);
    }
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log(`Validated ${files.length} store record(s).`);
