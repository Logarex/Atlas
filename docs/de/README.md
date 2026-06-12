# Atlas Places

Atlas Places ist eine mobile Anwendung zum Entdecken, Verfolgen und Sammeln von Apple Stores auf der ganzen Welt. Sie dient sowohl als weltweite Karte als auch als persönliches Notizbuch für Ihre Besuche in den Stores.

**Atlas Places ist für die Ewigkeit gebaut.** Dies ist ein zu 100 % quelloffenes, von der Community betriebenes Projekt. Es stützt sich auf seine Nutzer, um Store-Details zu bereichern, fehlende Standorte hinzuzufügen und Fotos zu teilen. Da die App nicht von einer zentralen, kostenpflichtigen Datenbank abhängig ist, wird sie so lange weiterleben, wie die Community sie weiterhin nutzt und aktualisiert.

## Funktionen

- **Weltkarte:** Entdecken Sie Hunderte von Apple Stores weltweit.
- **Besuche verfolgen:** Markieren Sie Stores als besucht, fügen Sie das Datum hinzu und speichern Sie persönliche Notizen.
- **Store-Details:** Zeigen Sie historischen Kontext, Architekturdetails und Fotos an.
- **Lokal zuerst (Local First):** Alle Ihre persönlichen Daten (Besuche, private Fotos, Notizen) bleiben auf Ihrem Gerät. Kein Tracking, keine externe Datenbank.
- **Von der Community betrieben:** Schlagen Sie neue Stores vor, reichen Sie Änderungen ein oder laden Sie Fotos direkt aus der App hoch.
- **Export & Import:** Sichern Sie Ihre Besuche und persönlichen Fotos sicher in einer lokalen Datei und stellen Sie sie jederzeit wieder her.

## Daten & Fotos

Die Store-Daten sind quelloffen und werden in diesem Repository unter `packages/data/stores/` verwaltet.
Öffentliche Fotos werden über GitHub Releases gehostet, damit die App leichtgewichtig und schnell bleibt, ohne sich auf kostenpflichtige Drittanbieterdienste verlassen zu müssen.

## Wie man das Projekt ausführt

1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. Die mobile App starten:
   ```bash
   npm run mobile:start
   ```

## Mitwirken

Möchten Sie einen fehlenden Store hinzufügen oder ein Foto teilen? Schauen Sie in den [Mitwirkungsrichtlinien](CONTRIBUTING.md) nach, um zu erfahren, wie Sie beim Aufbau des Datensatzes helfen können.

## Lizenz

Dieses Projekt ist doppelt lizenziert, um sowohl den Code als auch die Daten zu schützen:

- **Code:** Der Quellcode der Anwendung ist unter der [GNU General Public License v3.0 (GPLv3)](../../LICENSE) lizenziert. Jeder kann den Code frei verwenden, ändern und verteilen, vorausgesetzt, dass alle Änderungen ebenfalls Open-Source unter der GPLv3 veröffentlicht werden.
- **Daten:** Der Store-Datensatz (`packages/data`) ist unter der [Open Data Commons Open Database License (ODbL) v1.0](../../packages/data/LICENSE-DATA) lizenziert. Sie können die Datenbank frei kopieren, verteilen und verwenden, vorausgesetzt, Sie nennen die Urheber und teilen alle Änderungen unter derselben Lizenz.
- **Fotos:** Einzelne Fotos, die zum Projekt beigetragen wurden, bleiben unter der in den Daten angegebenen Lizenz (normalerweise CC-BY-4.0).

## Haftungsausschluss

Dies ist ein inoffizielles Studentenprojekt. Es ist nicht mit Apple Inc. verbunden, wird nicht von Apple Inc. gesponsert oder unterstützt. Apple, das Apple-Logo und Apple Store sind Marken von Apple Inc., eingetragen in den USA und anderen Ländern.
