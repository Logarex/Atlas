const fs = require('fs');
const path = require('path');

const files = ['en.json', 'fr.json', 'es.json', 'de.json', 'it.json'];
const dir = './src/i18n';

const titleMap = {
  glassCubeFlagship: { en: "Glass Cube Flagship", fr: "Flagship Cube de Verre", es: "Flagship Cubo de Cristal", de: "Glaskubus-Flagship", it: "Flagship Cubo di Vetro" },
  originalRetail: { en: "Original Retail", fr: "Design Original", es: "Diseño Original", de: "Ursprüngliches Design", it: "Design Originale" },
  townSquare: { en: "Town Square", fr: "Town Square", es: "Town Square", de: "Town Square", it: "Town Square" },
  unknown: { en: "Unknown", fr: "Inconnu", es: "Desconocido", de: "Unbekannt", it: "Sconosciuto" },
  classic: { en: "Classic", fr: "Classique", es: "Clásico", de: "Klassisch", it: "Classico" },
  classicUpgrade: { en: "Classic Upgrade", fr: "Classique Amélioré", es: "Clásico Mejorado", de: "Klassisches Upgrade", it: "Classico Aggiornato" },
  historicUrbanFlagship: { en: "Historic Urban Flagship", fr: "Flagship Urbain Historique", es: "Flagship Urbano Histórico", de: "Historisches Urbanes Flagship", it: "Flagship Urbano Storico" },
  mallStore: { en: "Mall Store", fr: "Boutique en Centre Commercial", es: "Tienda de Centro Comercial", de: "Einkaufszentrum Store", it: "Negozio in Centro Commerciale" },
  nsd: { en: "New Store Design", fr: "Nouveau Design", es: "Nuevo Diseño", de: "Neues Store-Design", it: "Nuovo Design" },
  standalonePavilion: { en: "Standalone Pavilion", fr: "Pavillon Indépendant", es: "Pabellón Independiente", de: "Freistehender Pavillon", it: "Padiglione Indipendente" },
  urbanFlagship: { en: "Urban Flagship", fr: "Flagship Urbain", es: "Flagship Urbano", de: "Urbanes Flagship", it: "Flagship Urbano" },
};

files.forEach(file => {
  const lang = file.split('.')[0];
  const p = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));

  if (data.architectureDetails) {
    if (data.architectureDetails.eras) {
      for (let era in data.architectureDetails.eras) {
        if (!data.architectureDetails.eras[era].title && titleMap[era]) {
          data.architectureDetails.eras[era].title = titleMap[era][lang];
        }
      }
    }
    if (data.architectureDetails.typologies) {
      for (let typo in data.architectureDetails.typologies) {
        if (!data.architectureDetails.typologies[typo].title && titleMap[typo]) {
          data.architectureDetails.typologies[typo].title = titleMap[typo][lang];
        }
      }
    }
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
});

console.log("Translations updated");
