import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sampleStores } from '../apps/mobile/src/features/stores/sampleStores';

// Pour gérer le __dirname en mode ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.resolve(__dirname, '../packages/data/stores');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

sampleStores.forEach(store => {
  const filePath = path.join(outputDir, `${store.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
  console.log(`✅ Created ${filePath}`);
});
