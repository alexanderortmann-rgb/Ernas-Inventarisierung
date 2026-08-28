  /* ============================
     localStorage Speichern / Laden
  ============================ */

  const STORAGE_KEY = "warenbewegung_entries_v1";

//Speichern
saveLocalBtn.onclick = () => {
 const entries = tableToJSON();
 const meta = collectMeta();
 sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ meta, entries }));
 showStatus("Daten temporär im Browser gespeichert (SessionStorage).", "success");
};

//Laden
loadLocalBtn.onclick = () => {
 const raw = sessionStorage.getItem(STORAGE_KEY);
 if (!raw) {
   showStatus("Keine gespeicherten Daten gefunden.", "error");
   return;
 }
 const { meta, entries } = JSON.parse(raw);
 applyMeta(meta);
 tbody.innerHTML = "";
 entries.forEach(appendRowFromEntry);
 showStatus("Gespeicherte Daten geladen.", "success");
};

//Löschen
deleteLocalBtn.onclick = () => {
 sessionStorage.removeItem(STORAGE_KEY);
 tbody.innerHTML = "";
 showStatus("Gespeicherte Daten gelöscht.", "success");
};



/*==================
CSV-Export
================*/

document.getElementById("exportCsvBtn").onclick = () => {
  const meta = collectMeta();
  const metaRows = Object.entries(meta).map(([k,v]) => [k,v]);
  const header = ["Zeitstempel","Produkt","Kisten","Flaschen","Gesamt","Aktion","Zweck","Von","Nach","Fachschaft","Notiz","Kontakt"];
  const rows = [header];

  document.querySelectorAll("#list tbody tr").forEach(tr => {
    const cols = Array.from(tr.querySelectorAll("td")).map(td => td.textContent);
    rows.push(cols);
  });

  const csvContent =
    metaRows.map(r => r.map(v => `"${v}"`).join(";")).join("\n") + "\n\n" +
    rows.map(r => r.map(v => `"${v}"`).join(";")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const fachschaft = document.getElementById("fachschaft")?.value || "Fachschaft";
  const eventName  = document.getElementById("purpose")?.value || "Event";
  const eventDate  = document.getElementById("event_date")?.value || "";
  const eventDateFmt = eventDate ? eventDate.replace(/-/g,"") : new Date().toLocaleDateString("de-DE").replace(/\./g,"-");
  const eventAction= document.getElementById("action")?.value || "Aktion";

  const filename = `${eventDateFmt}_${eventName}_${fachschaft}_${eventAction}.csv`
    .replace(/\s+/g,"_");

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};




/*===================
  CSV Import
  ===============*/
  
 document.getElementById("csvImport").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const lines = event.target.result.split("\n").map(r => r.split(";").map(v => v.replace(/"/g,"").trim()));
    const tbody = document.querySelector("#list tbody");
    tbody.innerHTML = "";

    // Meta-Infos bis zur Leerzeile
    let i = 0;
    const meta = {};
    for (; i < lines.length; i++) {
      const row = lines[i];
      if (row.length === 1 && row[0] === "") break;
      if (row[0]) meta[row[0].toLowerCase()] = row[1] || "";
    }
    applyMeta(meta);

    // Tabelle ab nächster Zeile
    const rows = lines.slice(i+1);
    rows.slice(1).forEach(cols => {
      if (cols.length < 5) return;
      const entry = {
        timestamp: cols[0],
        product: cols[1],
        boxes: cols[2],
        bottles: cols[3],
        total: cols[4],
        action: cols[5],
        purpose: cols[6],
        from: cols[7],
        to: cols[8],
        org: cols[9],
        note: cols[10],
        contact: cols[11]
      };
      appendRowFromEntry(entry);
    });

    showStatus("CSV-Daten importiert.", "success");
  };
  reader.readAsText(file);
  e.target.value = "";
});




/* ============================
   JSON Export / Import
============================ */

exportJsonBtn.onclick = () => {
  const entries = tableToJSON();
  if (!entries.length) {
    showStatus("Keine Positionen erfasst.","error");
    return;
  }
  const meta = collectMeta();
  const blob = new Blob(
    [JSON.stringify({ version:1, meta, entries }, null, 2)],
    { type: "application/json" }
  );
  const url = URL.createObjectURL(blob);

  // Dateiname zusammensetzen
  const fachschaft = document.getElementById("fachschaft")?.value || "Fachschaft";
  const eventName = document.getElementById("purpose")?.value || "Event";
  const eventDate = new Date().toLocaleDateString("de-DE").replace(/\./g,"-");
  const eventAction = document.getElementById("action")?.value || "Aktion";

  const filename = `${fachschaft}_${eventName}_${eventDate}_${eventAction}.json`
    .replace(/\s+/g,"_");

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};


/* ============================
JSON Import
============================ */

document.getElementById("importJson").addEventListener("change", (e) => {
const file = e.target.files[0];
if (!file) return;

const reader = new FileReader();
reader.onload = (event) => {
 try {
   const data = JSON.parse(event.target.result);

   // Erwartete Struktur:
   // { version: 1, meta: {...}, entries: [...] }

   if (!data.entries || !Array.isArray(data.entries)) {
     showStatus("Ungültiges JSON-Format.", "error");
     return;
   }

   // Meta anwenden
   if (data.meta) applyMeta(data.meta);

   // Tabelle leeren
   const tbody = document.querySelector("#list tbody");
   tbody.innerHTML = "";

   // Einträge einfügen
   data.entries.forEach(entry => appendRowFromEntry(entry));

   showStatus("JSON-Daten importiert.", "success");

 } catch (err) {
   console.error(err);
   showStatus("Fehler beim Lesen der JSON-Datei.", "error");
 }
};

reader.readAsText(file);
e.target.value = "";
});


/* ============================
     Mail-Export
  ============================ */

submitBtn.onclick = () => {
  const entries = tableToJSON();
  if (!entries.length) {
    showStatus("Keine Positionen erfasst.", "error");
    return;
  }

  // Werte aus den Formularfeldern holen
  const name = document.getElementById("name")?.value || "";
  const matrikel = document.getElementById("MatNr")?.value || "";
  const studmail = document.getElementById("studmail")?.value || "";
  const fachschaft = document.getElementById("fachschaft")?.value || "";
  const purpose = document.getElementById("purpose")?.value || "";
  const fromLoc = document.getElementById("from_location")?.value || "";
  const toLoc = document.getElementById("to_location")?.value || "";
  const action = document.getElementById("action")?.value || "";

  // externe Adresse
  const street = document.getElementById("ext_street")?.value || "";
  const number = document.getElementById("ext_number")?.value || "";
  const zip = document.getElementById("ext_zip")?.value || "";
  const city = document.getElementById("ext_city")?.value || "";
  const contact = document.getElementById("ext_contact")?.value || "";

  const subject = encodeURIComponent('Bestandserfassung');
  const body = encodeURIComponent(
    "Hallo,\n\n" +
    `mein Name ist ${name} (Matrikelnummer: ${matrikel}, Mail: ${studmail}).\n` +
    `Ich habe für die Hochschulgruppierung / Fachschaft ${fachschaft} eine Bestandserfassung durchgeführt.\n` +
    `Event / Zweck: ${purpose}\n` +
    `Aktion: ${action}\n` +
    `Von: ${fromLoc} → Nach: ${toLoc}\n\n` +
    "Bitte nimm die angehängte Datei (CSV oder JSON) mit den Details in deine Auswertung auf.\n\n" +
    "Vielen Dank!\n\n" +
    "----\n" +
    "Hinweis: Die Datei ist im Anhang dieser Mail.\n\n" +
    "Mit freundlichen Grüßen\n" +
    `${name}\n` +
    (street || number || zip || city ? `${street} ${number}, ${zip} ${city}\n` : "") +
    (contact ? `Kontakt: ${contact}\n` : "") +
    (studmail ? `E-Mail: ${studmail}\n` : "")
  );

  location.href = `mailto:finanzreferent-vs@hs-aalen.de?subject=${subject}&body=${body}`;
};



 exportExcelBtn.onclick = () => {
  const entries = tableToJSON();
  if (!entries.length) {
    showStatus("Keine Positionen erfasst.", "error");
    return;
  }

  const fachschaft = document.getElementById("fachschaft")?.value || "Fachschaft";
  const eventName  = document.getElementById("purpose")?.value || "Event";
  const eventDate  = document.getElementById("event_date")?.value || "";
  const eventDateFmt = eventDate ? eventDate.replace(/-/g,"") : new Date().toLocaleDateString("de-DE").replace(/\./g,"-");
  const eventAction= document.getElementById("action")?.value || "Aktion";

  const header = [
    "timestamp","product","boxes","bottles","total",
    "action","purpose","from","to","fachschaft","note","contact"
  ];

  const ws = XLSX.utils.json_to_sheet(entries, { header });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Warenbewegung");

  const filename = `${eventDateFmt}_${eventName}_${fachschaft}_${eventAction}.xlsx`
    .replace(/\s+/g,"_");

  XLSX.writeFile(wb, filename);
};

/* CSV-Export für Buchhaltung */
document.getElementById("exportCsvBuchhaltungBtn").onclick = () => {
  const mailBtn = document.getElementById("submit");
  const hint = document.getElementById("mailHint");
  const entries = tableToJSON();
  if (!entries.length) { showStatus("Keine Positionen erfasst.", "error"); return; }
  const fachschaft   = document.getElementById("fachschaft")?.value || "Fachschaft";
  const eventName    = document.getElementById("purpose")?.value || "Event";
  const eventDate    = document.getElementById("event_date")?.value || "";
  const eventDateFmt = eventDate
    ? eventDate.replace(/-/g, "")
    : new Date().toLocaleDateString("de-DE").replace(/\./g, "-");
  const csvContent = buildBuchhaltungsData(entries)
    .map(r => (r || []).map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${eventDateFmt}_${eventName}_${fachschaft}_Buchhaltung.csv`.replace(/\s+/g, "_");
  a.click();
  URL.revokeObjectURL(url);
  showStatus("Buchhaltungs-CSV exportiert.", "success");
  
  mailBtn.disabled = false;     // Button aktivieren
  hint.style.display = "block"; // Hinweis anzeigen
};


/*================================================================
 Verkaufspreise für den Point-of-Sale Modus 
 Listenvorlage Exportieren
 Bearbeitete Liste Importieren
 
 =================================================================*/
 
 document.getElementById("VKListExport").addEventListener("click", () => {
	  // Produktliste aus BESTAND_PRODUKTLISTE, ohne leere "0"-Platzhalter
	  const produkte = BESTAND_PRODUKTLISTE.filter(p => p && p !== "0");

	  // Header + eine Zeile pro Produkt: Produkt | VK-Preis | Kommentar
	  const rows = [
	    ["Produkt", "VK-Preis", "Kommentar"],
	    ...produkte.map(name => {
	      // Optional: schon gespeicherte VK-Preise vorausfüllen
	      const gespeichert = window.vkPrices?.[name];
	      return [name, gespeichert != null ? gespeichert : "", ""];
	    })
	  ];

	  const csvContent = rows
	    .map(r => r.map(v => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(";"))
	    .join("\n");

	  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
	  const url  = URL.createObjectURL(blob);
	  const a    = document.createElement("a");
	  a.href     = url;
	  a.download = "VK-Preisliste.csv";
	  a.click();
	  URL.revokeObjectURL(url);
	  showStatus("VK-Listenvorlage exportiert.", "success");
	});
	
 document.getElementById("VKListImport").addEventListener("click", () => {
	  const input = document.createElement("input");
	  input.type   = "file";
	  input.accept = ".csv";
	  input.onchange = (e) => {
	    const file = e.target.files[0];
	    if (!file) return;

	    const reader = new FileReader();
	    reader.onload = (evt) => {
	      try {
	        const lines = evt.target.result
	          .replace(/^\uFEFF/, "")   // BOM entfernen
	          .split("\n")
	          .map(l => l.trim())
	          .filter(l => l);

	        // Erste Zeile = Header überspringen
	        const dataLines = lines.slice(1);

	        const vkMap = {};
	        let geladen = 0;

	        dataLines.forEach(line => {
	          // CSV-Spalten parsen (Anführungszeichen berücksichtigen)
	          const cols = line.split(";").map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
	          const name  = cols[0] || "";
	          const preis = parseFloat(cols[1]?.replace(",", "."));

	          if (name && !isNaN(preis) && preis >= 0) {
	            vkMap[name] = preis;
	            geladen++;
	          }
	        });

	        window.vkPrices = vkMap;
	        showStatus(`✅ VK-Preise geladen (${geladen} Produkte).`, "success");

	      } catch (err) {
	        showStatus("Fehler beim Laden der VK-Preise: " + err.message, "error");
	      }
	    };
	    reader.readAsText(file, "UTF-8");
	  };
	  input.click();
	});
 