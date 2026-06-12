# Mitwirken bei Atlas

Danke, dass Sie helfen möchten. Dieses Dokument behandelt alles, was Sie wissen müssen, um Store-Daten und Fotos hinzuzufügen oder zu aktualisieren.

---

## Store-Daten

Alle Stores befinden sich als einzelne JSON-Dateien in `packages/data/stores/`. Jede Datei heißt `apple-[store-id].json`.

### Hinzufügen oder Bearbeiten eines Stores

1. Finden Sie die vorhandene Datei oder erstellen Sie eine neue, indem Sie eine vorhandene Datei als Referenz verwenden.
2. Füllen Sie die Felder aus. Erforderlich sind `id`, `name`, `status`, `city`, `countryCode` und `address`.
3. Führen Sie das Validierungsskript aus dem Stammverzeichnis des Repositories aus, um Fehler abzufangen:

```bash
npm run data:validate
```

4. Generieren Sie das mobile Bundle neu, damit die App Ihre Änderungen übernimmt:

```bash
npm run mobile:generate-stores
```

5. Eröffnen Sie einen Pull Request. Eine kurze Beschreibung dessen, was Sie geändert haben, ist ausreichend.

---

## Fotos

### Wo Fotos gespeichert werden

Öffentliche Store-Fotos befinden sich in `apps/mobile/assets/stores/`. Sie werden den Benutzern über **GitHub Releases** bereitgestellt — laden Sie die Datei als Release-Asset hoch und verweisen Sie dann in der Store-JSON auf ihre URL. Dies hält das App-Bundle klein, während gleichzeitig das CDN von GitHub (Fastly) für eine schnelle Bereitstellung genutzt wird.

### Hinzufügen eines Fotos

1. Nehmen Sie ein Foto auf oder besorgen Sie eines, das Ihnen gehört oder unter einer Creative Commons- oder einer gleichwertigen Lizenz steht.
2. Exportieren Sie es als **WebP**, mit einer Größe von etwa 1200 px auf der längsten Seite. Halten Sie die Datei nach Möglichkeit unter 500 KB.
3. Für ein Thumbnail (das in der Store-Karte angezeigt wird, bevor Sie auf die Details tippen), exportieren Sie eine zweite Version mit einer Breite von etwa 400 px und benennen Sie sie mit dem Suffix `-thumb`.
4. Laden Sie beide Dateien zum [`store-photos` GitHub Release](https://github.com/Logarex/Atlas/releases) hoch.
5. Kopieren Sie die Download-URL für jede Datei aus der Liste der Release-Assets.
6. Fügen Sie der JSON-Datei des Stores einen Foto-Eintrag hinzu:

```json
{
  "id": "apple-store-name-1",
  "url": "https://github.com/Logarex/Atlas/releases/download/store-photos/apple-store-name-1.webp",
  "thumbUrl": "https://github.com/Logarex/Atlas/releases/download/store-photos/apple-store-name-1-thumb.webp",
  "credit": "Ihr Name",
  "license": "CC-BY-4.0",
  "caption": "Kurze Beschreibung des Fotos",
  "takenOn": "YYYY-MM-DD"
}
```

7. Führen Sie `npm run mobile:generate-stores` aus und eröffnen Sie einen Pull Request.

### Richtlinien für Fotos

- Reichen Sie nur Fotos ein, die Sie selbst aufgenommen haben oder die eindeutig frei verwendbar sind.
- Füllen Sie immer `credit` und `license` aus.
- Vermeiden Sie Fotos mit erkennbaren Personen, es sei denn, Sie haben deren Zustimmung — und setzen Sie `"peopleVisible": true` im Beitragsformular der App, wenn Sie über die App einreichen.

---

## Beiträge über die App

Die App verfügt über integrierte Formulare zum Vorschlagen von Korrekturen und zum Einreichen von Fotos. Diese erstellen GitHub-Issues, die von Maintainern überprüft werden, bevor etwas in den Datensatz zusammengeführt wird.

---

## Fragen

Eröffnen Sie ein GitHub-Issue, wenn etwas unklar ist oder Sie auf ein Problem stoßen.
