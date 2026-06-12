# Contribuire ad Atlas

Grazie per voler aiutare. Questo documento copre tutto ciò di cui hai bisogno per aggiungere o aggiornare i dati dei negozi e le foto.

---

## Dati dei negozi

Tutti i negozi si trovano come file JSON individuali in `packages/data/stores/`. Ogni file è chiamato `apple-[store-id].json`.

### Aggiungere o modificare un negozio

1. Trova il file esistente, o creane uno nuovo usando un file esistente come riferimento.
2. Compila i campi. Quelli obbligatori sono `id`, `name`, `status`, `city`, `countryCode`, e `address`.
3. Esegui lo script di validazione dalla radice della repository per individuare eventuali errori:

```bash
npm run data:validate
```

4. Rigenera il pacchetto mobile in modo che l'app rilevi le tue modifiche:

```bash
npm run mobile:generate-stores
```

5. Apri una pull request. Una breve descrizione di ciò che hai cambiato è sufficiente.

---

## Foto

### Dove sono salvate le foto

Le foto pubbliche dei negozi si trovano in `apps/mobile/assets/stores/`. Vengono fornite agli utenti tramite **GitHub Releases** — carica il file come risorsa di rilascio, poi fai riferimento al suo URL nel JSON del negozio. Questo mantiene il pacchetto dell'app leggero pur usando il CDN di GitHub (Fastly) per una consegna rapida.

### Aggiungere una foto

1. Scatta o procurati una foto di tua proprietà o che sia sotto una licenza Creative Commons o equivalente.
2. Esportala in formato **WebP**, ridimensionata a circa 1200 px sul lato più lungo. Mantieni il file sotto i 500 KB ove possibile.
3. Per una miniatura (mostrata nella scheda del negozio prima di toccare il dettaglio), esporta una seconda versione larga circa 400 px e nominala con un suffisso `-thumb`.
4. Carica entrambi i file su [`store-photos` GitHub Release](https://github.com/Logarex/Atlas/releases).
5. Copia l'URL di download per ogni file dalla lista delle risorse di rilascio.
6. Aggiungi un elemento foto al file JSON del negozio:

```json
{
  "id": "apple-store-name-1",
  "url": "https://github.com/Logarex/Atlas/releases/download/store-photos/apple-store-name-1.webp",
  "thumbUrl": "https://github.com/Logarex/Atlas/releases/download/store-photos/apple-store-name-1-thumb.webp",
  "credit": "Il tuo nome",
  "license": "CC-BY-4.0",
  "caption": "Breve descrizione della foto",
  "takenOn": "YYYY-MM-DD"
}
```

7. Esegui `npm run mobile:generate-stores` e apri una pull request.

### Linee guida per le foto

- Invia solo foto che hai scattato tu stesso o che sono chiaramente libere da usare.
- Compila sempre `credit` e `license`.
- Evita foto con persone riconoscibili a meno che tu non abbia il loro consenso — e imposta `"peopleVisible": true` nel modulo di contributo dell'app se invii tramite l'app.

---

## Contributi tramite l'app

L'app ha moduli integrati per suggerire correzioni e inviare foto. Questi creano issue su GitHub che i manutentori esaminano prima di unire qualsiasi cosa al database.

---

## Domande

Apri un'issue su GitHub se qualcosa non è chiaro o se incontri un problema.
