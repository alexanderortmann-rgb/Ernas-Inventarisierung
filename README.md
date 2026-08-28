Ernas Warenbewegungs-Tool – README

====================================
1. Zweck des Tools
====================================
Dieses Tool dient zur Erfassung von Warenbewegungen (Ausgabe, Verbrauch, Bestände)
für Events der Fachschaften an der HTW Aalen (z. B. Ernas-Separee, Fachschaftsstände).
Es funktioniert vollständig offline und kann einfach per WhatsApp, E-Mail,
OneDrive oder USB-Stick weitergegeben werden.

Ziel:
- Überblick über Ein- und Ausgänge von Getränken
- Erfassung von Verbrauch und Beständen je Event / Ort
- Bereitstellung von Daten für spätere Auswertungen (z. B. in Excel)

====================================
2. Aufbau der Datei
====================================
Die Anwendung besteht aus EINER HTML-Datei. Diese enthält:
- Das komplette Layout (Formular, Tabelle, Buttons)
- Die gesamte Logik (JavaScript)
- Die Getränkeliste als JSON im Script-Tag mit der ID "productData"

Es gibt KEINE externen Dateien, die zwingend benötigt werden:
- Kein Server, kein fetch, keine CORS-Probleme
- Vollständig offline nutzbar

====================================
3. Grundbedienung
====================================
Beim Öffnen der HTML-Datei im Browser können folgende Dinge gemacht werden:

- Auswahl von:
  - Fachschaft / Verantwortliche Stelle
  - Von-Standort (from_location)
  - Aktion (z. B. Ausgabe, Verbrauch, Anfangsbestand, Endbestand)
  - Zu-Standort (to_location)

- Eingabe von:
  - Produkt (über Dropdown + Suche)
  - Kisten (Gebinde / Kästen)
  - Flaschen (Einzelflaschen)
  - Zweck / Event (optional, abhängig von Aktion)
  - Kontakt / Kommentar (optional)

- Hinzufügen einer Position:
  - Button „Position hinzufügen“ (o.ä.) erzeugt eine Zeile in der Tabelle.
  - Die Zeile enthält: Zeitstempel, Produkt, Menge, Aktion, Orte, Fachschaft, Kommentar.

- Entfernen einer Position:
  - Jede Zeile hat einen „Entfernen“-Button mit Undo-Mechanik (je nach Version).

====================================
4. Felder im Detail
====================================

Wichtige Eingabefelder:

- Fachschaft:
  - Auswahl z. B. Fachschaft Elektro, WiWi, Extern etc.
  - Bei „Extern“ werden zusätzliche Felder eingeblendet (z. B. externe Kontakte).

- Von / Nach (from_location / to_location):
  - Beschreibt die Warenbewegung (z. B. Lager -> Erna, Erna -> Event, Event -> Lager).
  - Bei „Extern“ werden ebenfalls Zusatzfelder eingeblendet.

- Aktion:
  - Typische Aktionen können sein:
    - Ausgabe
    - Rücknahme
    - Verbrauch
    - Anfangsbestand
    - Endbestand
  - Bei „Verbrauch“, „Anfangsbestand“ oder „Endbestand“ wird das Feld „Zweck / Event“
    eingeblendet, um den Anlass zu dokumentieren.

- Produkt:
  - Auswahl über ein Dropdown mit allen Produkten.
  - Zusätzlich gibt es ein Suchfeld mit Autocomplete:
    - Eingabe eines Namens-Teils → Vorschlagsliste
    - Auswahl per Klick oder mit Pfeiltasten + Enter.

- Kategorie-Filter:
  - Dropdown, um die Produktliste nach Kategorie zu filtern (z. B. Bier, Softdrinks, Spirituosen).
  - „Alle“ zeigt alle Produkte.

- Kisten / Flaschen:
  - Eingabe von Kisten (perCase) und Einzelflaschen.
  - Die App berechnet automatisch die Gesamtflaschen.

====================================
5. Getränkeliste bearbeiten
====================================
Die Getränkeliste ist als JSON direkt in der HTML-Datei eingebettet:

<script id="productData" type="application/json">
[
  { "name": "Absolut Vodka (0,7L)", "perCase": 6, "category": "Spirituosen" },
  { "name": "Afri Cola (0,33L)", "perCase": 24, "category": "Softdrinks" },
  ...
]
<\/script>

Wichtige Felder:
- "name": Anzeigename des Produkts (erscheint im Dropdown).
- "perCase": Anzahl Flaschen pro Kiste / Gebinde.
- "category": Freier Text zur Einteilung (z. B. "Bier", "Softdrinks", "Spirituosen", "Wein", "Sekt", "Sonstiges").

So wird ein neues Produkt hinzugefügt:
- Innerhalb der eckigen Klammern ein neues Objekt ergänzen:
  {
    "name": "Neues Getränk (0,5L)",
    "perCase": 20,
    "category": "Softdrinks"
  }

Hinweis:
- JSON-Syntax beachten:
  - Einträge mit Komma trennen
  - Keine abschließenden Kommata nach dem letzten Eintrag
- Kategorien sind beliebig, sollten aber einigermaßen konsistent bleiben.

====================================
6. Kategorien
====================================
Die Kategorien steuern:
- Den Kategorie-Filter im Produktbereich
- Die Gruppierung der Produkte in der UI

Empfohlene Kategorien (Beispiele):
- Bier
- Softdrinks
- Spirituosen
- Wein
- Sekt
- Sonstiges

Es ist möglich, weitere Kategorien zu verwenden (z. B. „Wein & Sekt“, „Perlwein“),
aber für die Bedienung ist eine übersichtliche, einfache Struktur hilfreich.

====================================
7. Export-Funktionen
====================================
Je nach Version der Datei gibt es folgende Exportmöglichkeiten:

- Excel-Export:
  - Schreibt alle aktuellen Tabelleneinträge in eine Excel-Datei.
  - Typischerweise eine Datei mit Datum/Uhrzeit im Namen.
  - Eignet sich zur späteren Auswertung, Archivierung oder Weitergabe.

- JSON-Export (falls vorhanden):
  - Exportiert die Getränkeliste als JSON-Datei (z. B. products.json).
  - Praktisch, um die Liste separat zu sichern oder in andere Tools zu übernehmen.

- Lokale Speicherung (falls vorhanden):
  - Die App kann ggf. Daten in localStorage des Browsers ablegen.
  - Das betrifft nur den lokalen Browser und wird beim Weitergeben der HTML-Datei nicht mit übertragen.

====================================
8. Import-Funktionen (falls vorhanden)
====================================
Falls ein JSON-Import implementiert ist:

- JSON-Import:
  - Ermöglicht das Einlesen einer JSON-Datei mit Produktdaten.
  - Ersetzt oder aktualisiert die aktuelle Getränkeliste in der App.
  - Achtung: Nur gültige JSON-Dateien verwenden, die dem erwarteten Schema entsprechen:
    [
      { "name": "...", "perCase": 24, "category": "..." },
      ...
    ]

====================================
9. Technische Hinweise
====================================
- Die Datei sollte möglichst immer mit einem normalen Browser geöffnet werden
  (z. B. Chrome, Edge, Firefox).
- Kein Webserver notwendig, Öffnen per Doppelklick reicht.
- Änderungen an der Getränkeliste werden direkt in der HTML-Datei vorgenommen
  (im Script-Tag "productData").
- JavaScript-Code befindet sich in einem <script>-Block innerhalb der HTML-Datei.

Wichtige Funktionen im Code (nur grob):
- loadProductsIntoApp(data.products):
  - Lädt die Produkte in Dropdown, Autocomplete und Kategorien.
- filterProducts():
  - Filtert die Produktanzeige nach Kategorie.
- appendRowFromEntry(e):
  - Fügt eine Zeile in die Tabelle ein.
- Event-Handler für Buttons:
  - "Position hinzufügen" → neue Zeile erzeugen
  - "Export" → Exportfunktion ausführen

====================================
10. Weitergabe und Übergabe an Nachfolger
====================================
Bei Übergabe des Tools an eine andere Person (z. B. neue Verantwortliche):

Empfohlen ist, Folgendes weiterzugeben:
- Die aktuelle HTML-Datei des Tools
- Diese README (ist in der Datei integriert, über den Button „README öffnen“)
- Optional:
  - Beispiel-Excel-Export als Referenz
  - Kurze Erklärung, wie:
    - Produkte ergänzt werden
    - Kategorien verwaltet werden
    - Exporte erstellt werden

Nachfolger:innen sollten vor allem wissen:
- Wo die Getränkeliste steht (Script-Tag "productData")
- Wie man neue Produkte hinzufügt
- Wie Exporte erstellt werden
- Dass die Datei offline funktioniert und leicht weitergegeben werden kann

====================================
11. Kontakt / Notizen für die Zukunft
====================================
Wenn Anpassungen gewünscht sind (z. B. neue Felder, weitere Exportformate, andere Kategorien),
sollten diese direkt im JavaScript-Bereich der HTML-Datei erfolgen.

Die Struktur ist so gehalten, dass sie mit grundlegenden JavaScript-/HTML-Kenntnissen
relativ leicht erweiterbar ist.
