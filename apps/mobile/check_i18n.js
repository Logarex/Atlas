const fs = require('fs');
const en = require('./src/i18n/en.json');
const fr = require('./src/i18n/fr.json');
const es = require('./src/i18n/es.json');
const de = require('./src/i18n/de.json');
const it = require('./src/i18n/it.json');

const files = { fr, es, de, it };

function checkKeys(base, compare, path = '') {
  for (let key in base) {
    if (typeof base[key] === 'object' && base[key] !== null) {
      if (!compare[key]) {
        console.log(`Missing key in ${path ? path + '.' : ''}${key}`);
      } else {
        checkKeys(base[key], compare[key], path ? `${path}.${key}` : key);
      }
    } else {
      if (!compare[key]) {
        console.log(`Missing key: ${path ? path + '.' : ''}${key}`);
      }
    }
  }
}

for (let lang in files) {
  console.log(`\n--- Checking ${lang} ---`);
  checkKeys(en, files[lang]);
}
