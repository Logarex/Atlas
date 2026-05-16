const fs = require('fs');
const path = require('path');

const storesDir = './packages/data/stores';
const files = fs.readdirSync(storesDir);
const stores = files.filter(f => f.endsWith('.json')).map(f => {
  return JSON.parse(fs.readFileSync(path.join(storesDir, f), 'utf8'));
});

fs.writeFileSync('./packages/data/stores.json', JSON.stringify(stores, null, 2));
console.log('Created packages/data/stores.json');
