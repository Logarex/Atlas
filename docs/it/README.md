# Atlas Places

Atlas Places è un'applicazione mobile per scoprire, tracciare e collezionare gli Apple Store in tutto il mondo. Funziona sia come mappa mondiale che come taccuino personale per le tue visite nei negozi.

**Atlas Places è costruito per durare.** Questo è un progetto guidato dalla community e open source al 100%. Si affida ai suoi utenti per arricchire i dettagli dei negozi, aggiungere le posizioni mancanti e condividere foto. Poiché l'app non dipende da un database centrale a pagamento, vivrà finché la community continuerà a usarla e aggiornarla.

## Funzionalità

- **Mappa Mondiale:** Esplora centinaia di Apple Store in tutto il mondo.
- **Traccia Visite:** Segna i negozi come visitati, aggiungi la data e salva note personali.
- **Dettagli Store:** Visualizza il contesto storico, i dettagli architettonici e le foto.
- **Prima Locale (Local First):** Tutti i tuoi dati personali (visite, foto private, note) rimangono sul tuo dispositivo. Nessun tracciamento, nessun database esterno.
- **Guidato dalla Community:** Proponi nuovi negozi, suggerisci modifiche o invia foto direttamente dall'app.
- **Esporta & Importa:** Fai un backup sicuro delle tue visite e delle tue foto personali in un file locale, e ripristinale quando vuoi.

## Dati & Foto

I dati dei negozi sono open source e gestiti in questa repository sotto `packages/data/stores/`.
Le foto pubbliche sono ospitate tramite GitHub Releases per mantenere l'app leggera e veloce, senza dipendere da servizi a pagamento di terze parti.

## Come eseguire il progetto

1. Installa le dipendenze:
   ```bash
   npm install
   ```

2. Avvia l'app mobile:
   ```bash
   npm run mobile:start
   ```

## Contribuire

Vuoi aggiungere un negozio mancante o condividere una foto? Dai un'occhiata alla [Guida ai Contributi](CONTRIBUTING.md) per scoprire come aiutare a costruire il database.

## Licenza

Questo progetto ha una doppia licenza per proteggere sia il codice che i dati:

- **Codice:** Il codice sorgente dell'applicazione è sotto licenza [GNU General Public License v3.0 (GPLv3)](../../LICENSE). Chiunque è libero di usare, modificare e distribuire il codice, a condizione che tutte le modifiche siano rilasciate come open-source sotto GPLv3.
- **Dati:** Il dataset dei negozi (`packages/data`) è sotto licenza [Open Data Commons Open Database License (ODbL) v1.0](../../packages/data/LICENSE-DATA). Sei libero di copiare, distribuire e usare il database, a condizione di attribuire i creatori e condividere eventuali modifiche sotto la stessa licenza.
- **Foto:** Le foto individuali con cui si contribuisce al progetto rimangono sotto la licenza specificata nei dati (di solito CC-BY-4.0).

## Disclaimer

Questo è un progetto studentesco non ufficiale. Non è affiliato, sponsorizzato o supportato da Apple Inc. Apple, il logo Apple e Apple Store sono marchi registrati di Apple Inc., registrati negli Stati Uniti e in altri paesi.
