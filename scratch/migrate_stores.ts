import fs from 'fs';
import path from 'path';
import { sampleStores } from './apps/mobile/src/features/stores/sampleStores';

const outputDir = './packages/data/stores';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

sampleStores.forEach(store => {
  const filePath = path.join(outputDir, `${store.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
  console.log(`Created ${filePath}`);
});
