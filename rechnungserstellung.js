/* ============================================================
   BESTAND AUS EXCEL LADEN
   Liest die Buchhaltungs-Excel (bevorzugt "Bestandsübersicht"
   oder "Tabelle1"). Metablock: Labels Spalte H (7), Werte Spalte I (8).
   Wenn mehrere Datenspalten: visuelles Auswahl-Modal.
   Produkte: ab "Produkt"-Zeile in Spalte A, Menge in gewählter Spalte.
   ============================================================ */
document.getElementById("importBestandExcelBtn").onclick = () => {
  document.getElementById("importBestandExcelInput").click();
};

document.getElementById("importBestandExcelInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = "";
  

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const preferredSheets = ["Bestandsübersicht", "Tabelle1"];
      const sheetName = preferredSheets.find(s => wb.SheetNames.includes(s)) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      // "Produkt"-Headerzeile in Spalte A finden
      let headerIndex = -1;
      for (let i = 0; i < raw.length; i++) {
        if ((raw[i][0] || "").toString().trim().toLowerCase() === "produkt") {
          headerIndex = i;
          break;
        }
      }
      if (headerIndex === -1) {
        showStatus("Keine Produktliste gefunden ('Produkt' nicht in Spalte A).", "error");
        return;
      }

      // Produktzeilen: nach Header, Leerzeilen überspringen
      let produktStart = headerIndex + 1;
      while (produktStart < raw.length && (raw[produktStart] || []).every(v => v === "")) {
        produktStart++;
      }
      const produktRows = raw.slice(produktStart);

      // Datenspalten ermitteln: alle Spalten ≥1 die in Produktzeilen Werte haben
      const maxCols = Math.max(...raw.map(r => r.length));
      const dataCols = [];
      for (let col = 1; col < maxCols; col++) {
        if (produktRows.some(r => r[col] !== "" && r[col] !== null && r[col] !== undefined)) {
          dataCols.push(col);
        }
      }
      if (dataCols.length === 0) {
        showStatus("Keine befüllten Datenspalten in der Produktliste gefunden.", "error");
        return;
      }

      if (dataCols.length === 1) {
        continueImport(raw, produktRows, headerIndex, dataCols[0]);
      } else {
        showColumnSelector(dataCols, raw, col => continueImport(raw, produktRows, headerIndex, col));
      }

    } catch (err) {
      console.error(err);
      showStatus("Fehler beim Lesen der Excel-Datei: " + err.message, "error");
    }
  };
  reader.readAsBinaryString(file);
});

/* Visuelles Spaltenauswahl-Modal */
function showColumnSelector(dataCols, raw, onSelect) {
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
    background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex",
    alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)"
  });

  const box = document.createElement("div");
  Object.assign(box.style, {
    background: "white", padding: "24px", borderRadius: "14px",
    width: "80vw", height: "80vh", overflow: "hidden", display: "flex",
    flexDirection: "column", boxShadow: "0 6px 30px rgba(0,0,0,0.35)"
  });
  overlay.appendChild(box);

  const title = document.createElement("h3");
  title.textContent = "Welchen Datensatz möchtest du laden?";
  title.style.margin = "0 0 12px 0";
  box.appendChild(title);

  const search = document.createElement("input");
  search.type = "text";
  search.placeholder = "Suchen nach Datum, Event, Aktion …";
  Object.assign(search.style, {
    padding: "10px 14px", marginBottom: "16px", border: "1px solid #ccc",
    borderRadius: "8px", fontSize: "16px", width: "100%", boxSizing: "border-box"
  });
  box.appendChild(search);

  const scroll = document.createElement("div");
  Object.assign(scroll.style, {
    flex: "1", overflowY: "auto", display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px"
  });
  box.appendChild(scroll);

  document.body.appendChild(overlay);

  function actionColor(a) {
    a = (a || "").toLowerCase();
    if (a.includes("verbrauch"))   return "#ffe0e0";
    if (a.includes("anfangs"))     return "#e0ffe0";
    if (a.includes("endbestand"))  return "#e0f0ff";
    if (a.includes("lager"))       return "#f0f0f0";
    if (a.includes("liefer"))      return "#fffbe0";
    return "#f7f7f7";
  }

  const cards = [];
  dataCols.forEach(col => {
    // Metablock: Rechnungsnr=Zeile0, Rechnungstyp=1, Datum=2, Veranstalter=3,
    //            Kürzel=4, Event=5, Kommentar=6, Kontakt=7, Von=8, Aktion=9, Zu=10
    const rechNr  = raw[0]?.[col] || "";
    const datum    = raw[2]?.[col] || "";
    const veranst  = raw[3]?.[col] || "";
    const event    = raw[5]?.[col] || "";
    const aktion   = raw[9]?.[col] || "";

    const card = document.createElement("div");
    Object.assign(card.style, {
      padding: "14px", borderRadius: "10px", cursor: "pointer",
      border: "1px solid #ccc", background: actionColor(aktion),
      transition: "transform 0.15s, box-shadow 0.15s"
    });
    card.dataset.search = `${rechNr} ${datum} ${veranst} ${event} ${aktion}`.toLowerCase();

    card.onmouseenter = () => { card.style.transform = "scale(1.03)"; card.style.boxShadow = "0 3px 10px rgba(0,0,0,0.2)"; };
    card.onmouseleave = () => { card.style.transform = ""; card.style.boxShadow = ""; };
    card.innerHTML = `
      <strong>Spalte ${col + 1}</strong><br>
      <small style="color:#888">${rechNr}</small><br>
      <strong>${datum}</strong><br>
      ${veranst}<br>
      <em>${event}</em><br>
      <span style="font-weight:bold;color:#555">${aktion}</span>
    `;
    card.onclick = () => { document.body.removeChild(overlay); onSelect(col); };
    scroll.appendChild(card);
    cards.push(card);
  });

  search.addEventListener("input", () => {
    const q = search.value.toLowerCase();
    cards.forEach(c => { c.style.display = c.dataset.search.includes(q) ? "" : "none"; });
  });

  // Schließen-Button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Abbrechen";
  Object.assign(closeBtn.style, { marginTop: "12px", padding: "8px 16px", cursor: "pointer" });
  closeBtn.onclick = () => document.body.removeChild(overlay);
  box.appendChild(closeBtn);
}

/*-----------------------------------------------
 Haupt-Importlogik nach Spaltenauswahl 
------------------------------------------------ */

// Durchsucht die Spalte A der Excel nach dem Codewort/ Kürzel

function findRowByName(raw, name) {
  for (let i = 0; i < raw.length; i++) {
    const cell = String(raw[i][0] || "").trim();
    if (cell.toLowerCase() === name.toLowerCase()) {
      return i;
    }
  }
  return null;
}


function continueImport(raw, produktRows, headerIndex, selectedCol) {
  // Metadaten aus gewählter Spalte – neue Zeilenstruktur (0-basiert):
  // 0=Rechnungsnummer, 1=Rechnungstyp, 2=Datum, 3=Veranstalter,
  // 4=Kürzel/Code, 5=Event, 6=Kommentar, 7=Kontakt,
  // 8=Von Bestand, 9=Aktion, 10=Zu Bestand
  
  
  const tbody = document.querySelector("#list tbody");
  tbody.innerHTML = ""
  
  const importMeta = {
    rechnungsnummer: String(raw[0]?.[selectedCol] || ""),
    rechnungstyp:    String(raw[1]?.[selectedCol] || ""),
    event_date:      raw[2]?.[selectedCol] || "",
    fachschaft:      String(raw[3]?.[selectedCol] || ""),
    fachschaftCode:  String(raw[4]?.[selectedCol] || ""),
    purpose:         String(raw[5]?.[selectedCol] || ""),
    note:            String(raw[6]?.[selectedCol] || ""),
    name:            String(raw[7]?.[selectedCol] || ""),
    from_location:   String(raw[8]?.[selectedCol] || ""),
    action:          String(raw[9]?.[selectedCol] || ""),
    to_location:     String(raw[10]?.[selectedCol] || ""),
  };
  window.lastImportMeta = importMeta;

  // Datum konvertieren
  function parseExcelDate(val) {
    if (!val) return "";
    if (val instanceof Date) return val.toISOString().split("T")[0];
    if (typeof val === "number") {
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      return d.toISOString().split("T")[0];
    }
    if (typeof val === "string") {
      const m = val.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    }
    return "";
  }
  importMeta.event_date = parseExcelDate(importMeta.event_date);

  // Formularfelder befüllen (nur belegte Felder)
  const metaForApp = {};
  if (importMeta.fachschaft)    metaForApp.fachschaft    = importMeta.fachschaft;
  if (importMeta.purpose)       metaForApp.purpose       = importMeta.purpose;
  if (importMeta.event_date)    metaForApp.event_date    = importMeta.event_date;
  if (importMeta.from_location) metaForApp.from_location = importMeta.from_location;
  if (importMeta.action)        metaForApp.action        = importMeta.action;
  if (importMeta.to_location)   metaForApp.to_location   = importMeta.to_location;
  if (importMeta.note)          metaForApp.note          = importMeta.note;
  applyMeta(metaForApp);
  
//-------------------------------------------------------------
//Zusatzkosten aus Excel lesen (Zeilen 96–100, 0-basiert)
//-------------------------------------------------------------

const kostenKeys = {
  gema: "GEMA",
  sonstige: "Sonstige Gebühren",
  kommission: "Kommisionskosten",
  glasbruch: "Glasbruch",
  reinigung: "Reinigung",
  gesamtkosten: "Gesamtkosten"
};

	

 function parseKosten(v) {
   return Number(String(v || "0").replace(",", ".")) || 0;
 }
 
 function extractZusatzKosten(raw, selectedCol) {
   const result = {};

   for (const key in kostenKeys) {
     const name = kostenKeys[key];
     const rowIndex = findRowByName(raw, name);

     if (rowIndex !== null) {
       result[key] = parseKosten(raw[rowIndex][selectedCol]);
     } else {
       result[key] = 0; // falls nicht gefunden
     }
   }

   return result;
 }

	
 window.zusatzKosten = extractZusatzKosten(raw, selectedCol);


  // Kommentarspalte prüfen (Spalte C = Index 2 in Produkt-Header)
  const headerRow = raw[headerIndex] || [];
  const hasCommentCol = (headerRow[2] || "").toString().toLowerCase().includes("kommentar");
  let importComments = false;
  if (hasCommentCol) {
    importComments = confirm("Kommentarspalte gefunden – Kommentare aus der Excel importieren?");
  }

  const now = new Date().toLocaleString("de-DE");
  let geladen = 0;

  produktRows.forEach(row => {
    const produkt = String(row[0] || "").trim();
    const menge   = Number(row[selectedCol]) || 0;
    const notiz   = (importComments && hasCommentCol) ? String(row[2] || "").trim() : "";
    
 // Zusatzkosten NICHT als Produkt importieren
    const blacklist = ["kosten", "gema", "reinigung", "glasbruch", "kommisionskosten", "sonstige gebühren", "gesamtkosten"];
    if (blacklist.includes(produkt.toLowerCase())) {
      return; // komplett überspringen
    }


    if (!produkt || produkt === "0" || menge === 0) return;

    const perCase = bottlesPerCase[normalizeKey(produkt)] || 1;
    const absMenge = Math.abs(menge);
    const sign     = Math.sign(menge) || 1;
    const boxes    = perCase > 1 ? Math.floor(absMenge / perCase) * sign : 0;
    const bottles  = perCase > 1 ? (absMenge % perCase) * sign : menge;

    appendRowFromEntry({
      timestamp: now,
      product:   produkt,
      boxes, bottles,
      total:     menge,
      action:    importMeta.action || "Anfangsbestand",
      purpose:   importMeta.purpose || "",
      from:      importMeta.from_location || "",
      to:        importMeta.to_location || "",
      fachschaft:importMeta.fachschaft || "",
      note:      notiz,
      contact:   importMeta.name || ""
    });
    geladen++;
  });

  showStatus(`✅ ${geladen} Produkt(e) geladen (Spalte ${selectedCol + 1}).`, "success");
}

/* ============================================================
   ORGANISATIONS-TABELLE LADEN
   ============================================================ */
document.getElementById("importOrgExcelBtn").onclick = () => {
  document.getElementById("importOrgExcelInput").click();
};
document.getElementById("importOrgExcelInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = "";
  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const wb    = XLSX.read(evt.target.result, { type: "binary" });
      const sName = wb.SheetNames.includes("Orgapositionen") ? "Orgapositionen" : wb.SheetNames[0];
      const org   = XLSX.utils.sheet_to_json(wb.Sheets[sName], { defval: "" });
      window.orgTable = org;
      showStatus(`✅ Organisationstabelle geladen (${org.length} Einträge, Blatt: ${sName}).`, "success");
    } catch (err) {
      showStatus("Fehler Organisationstabelle: " + err.message, "error");
    }
  };
  reader.readAsBinaryString(file);
});

function findOrgEntryByCode(code) {
  if (!window.orgTable || !code) return null;
  const c = code.toString().trim().toLowerCase();

  // Sonderzeilen die keine Fachschaft sind – diese überspringen
  const sonderzeilen = ["vorneun", "nachneun", "stichtag", "buchung", "inventur"];

  // Suche primär in der "Fakultät"-Spalte, Sonderzeilen ausschließen
  let found = window.orgTable.find(row => {
    const fak = (row["Fakultät"] || "").toString().trim().toLowerCase();
    if (sonderzeilen.includes(fak)) return false;
    return fak === c;
  });

  // Fallback: weitere Spalten (Fachschaft, Art, Kürzel, Code)
  if (!found) {
    const fallbackCols = ["Fachschaft", "Art", "Kürzel", "Code"];
    found = window.orgTable.find(row => {
      const fak = (row["Fakultät"] || "").toString().trim().toLowerCase();
      if (sonderzeilen.includes(fak)) return false;
      return fallbackCols.some(col =>
        (row[col] || "").toString().trim().toLowerCase() === c
      );
    });
  }

  // Letzter Fallback: Wert irgendwo in der Zeile (Sonderzeilen weiterhin ausschließen)
  if (!found) {
    found = window.orgTable.find(row => {
      const fak = (row["Fakultät"] || "").toString().trim().toLowerCase();
      if (sonderzeilen.includes(fak)) return false;
      return Object.values(row).some(v =>
        (v || "").toString().trim().toLowerCase() === c
      );
    }) || null;
  }

  return found || null;
}


/* ============================================================
PREIS-TABELLE LADEN (EK intern / EK extern)
============================================================ */
document.getElementById("importPriceExcelBtn").onclick = () => {
document.getElementById("importPriceExcelInput").click();
};

document.getElementById("importPriceExcelInput").addEventListener("change", (e) => {
const file = e.target.files[0];
if (!file) return;
e.target.value = "";

const reader = new FileReader();
reader.onload = (evt) => {
 try {
   const wb = XLSX.read(evt.target.result, { type: "binary" });

   const sName = wb.SheetNames.includes("Finanzkram")
     ? "Finanzkram"
     : wb.SheetNames[0];

   const sheet = wb.Sheets[sName];

   // sheet_to_json mit header:1 → liefert ein Array von Arrays
   const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

   // Ab Zeile 3 (Index 2)
   const dataRows = rows.slice(2);

   const prices = dataRows
     .map(r => {   
       const name = (r[0] || "").toString().trim();   // Spalte A
       if (!name) return null;

       return {
         name,
         ek_int: parseFloat(r[5]) || 0,  // Spalte F
         ek_ext: parseFloat(r[7]) || 0,  // Spalte H
         vk_price: parseFloat(r[8]) || null // Spalte I (optional)
       };
     })
     .filter(x => x !== null);

   window.priceTable = prices;

   showStatus(
     `✅ Preistabelle geladen (${prices.length} Produkte, Blatt: ${sName}).`,
     "success"
   );

 } catch (err) {
   showStatus("Fehler Preistabelle: " + err.message, "error");
 }
};

reader.readAsBinaryString(file);
});


function findPriceEntryByName(name) {
	  if (!window.priceTable || !name) return null;

	  const n = name.toString().trim().toLowerCase();

	  return (
	    window.priceTable.find(p =>
	      p.name.toLowerCase() === n
	    ) || null
	  );
	}

/*===================================
QR-Code Erstellung für Rechnung
====================================0*/

	
function generateSEPAQR(iban, bic, empfaenger, betrag, verwendungszweck, callback) {
  const epc = [
    "BCD",           // 1: Service Tag
    "002",           // 2: Version (002 = aktuell)
    "1",             // 3: Encoding (UTF-8)
    "SCT",           // 4: Funktion
    bic,             // 5: BIC
    empfaenger,      // 6: Name Empfänger
    iban,            // 7: IBAN
    "EUR" + Number(betrag).toFixed(2), // 8: Betrag
    "",              // 9: Purpose Code (leer lassen)
    "",              // 10: Remittance Info strukturiert (leer)
    verwendungszweck // 11: Remittance Info unstrukturiert = Verwendungszweck
  ].join("\n");

  const tempDiv = document.createElement("div");
  const qr = new QRCode(tempDiv, {
    text: epc,
    width: 200,
    height: 200,
    correctLevel: QRCode.CorrectLevel.M
  });

  setTimeout(() => {
    const img = tempDiv.querySelector("img") || tempDiv.querySelector("canvas");
    callback(img.src);
  }, 200);
}

function addLogoToQR(qrDataUrl, logoUrl, callback) {
	  const qrImg = new Image();
	  const logoImg = new Image();

	  // DEBUG: Fehler beim Laden des Logos anzeigen
	  logoImg.onerror = () => console.error("Logo konnte NICHT geladen werden:", logoUrl);

	  // DEBUG: Fehler beim Laden des QR-Codes anzeigen
	  qrImg.onerror = () => console.error("QR konnte NICHT geladen werden:", qrDataUrl);

	qrImg.onload = () => {
	 logoImg.onload = () => {
		  const size = qrImg.width;
		  const canvas = document.createElement("canvas");
		  canvas.width = size;
		  canvas.height = size;
		  const ctx = canvas.getContext("2d");
		
		  ctx.drawImage(qrImg, 0, 0);
		
		  // Originalproportionen beibehalten
		  const ratio = logoImg.width / logoImg.height;
		  const logoHeight = size * 0.32;
		  const logoWidth = logoHeight * ratio;
		
		  const x = (size - logoWidth) / 2;
		  const y = (size - logoHeight) / 2;
		
		  // Weißer Hintergrund minimal
		  ctx.fillStyle = "white";
		  ctx.fillRect(x - 0, y - 0, logoWidth + 0, logoHeight + 0);
		
		  ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
		
		  callback(canvas.toDataURL("image/png"));
		};


	    // Logo erst hier laden!
	    logoImg.src = logoUrl;
	  };

	  // QR erst hier laden!
	  qrImg.src = qrDataUrl;
	}





/* ============================================================
RECHNUNGSERSTELLUNG mit HTML-Templates 
============================================================ */

/** Datum einheitlich als TT.MM.JJJJ */
function formatDateDE(val) {
  if (!val) return "";
  let d;

  if (val instanceof Date) {
    d = val;
  } else if (typeof val === "number") {
    // Excel-Seriennummer
    d = new Date(Math.round((val - 25569) * 86400 * 1000));
  } else if (typeof val === "string") {
    const s = val.trim();
    // ISO JJJJ-MM-TT
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, day] = s.split("-");
      return `${day.padStart(2,"0")}.${m.padStart(2,"0")}.${y}`;
    }
    // Bereits TT.MM.JJJJ
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) return s;
    d = new Date(s);
  } else {
    return String(val);
  }

  if (isNaN(d.getTime())) return String(val);
  const day = String(d.getDate()).padStart(2,"0");
  const mon  = String(d.getMonth()+1).padStart(2,"0");
  return `${day}.${mon}.${d.getFullYear()}`;
}

 
/**
 * Personen mit Posten aus Orgatabelle ermitteln.
 * Liest die Zeile mit Schlüssel in der Fachschafts-Spalte (Groß/Klein egal).
 * Stichtag ist über Amtszeit definiert
 * eventDateISO: ISO-String JJJJ-MM-TT oder leer (→ heutiges Datum).
 */
function getPersonByRole(role, eventDateISO) {
  const org = window.orgTable;
  if (!org || !org.length) return "";

  const eventDate = eventDateISO ? new Date(eventDateISO) : new Date();
  if (isNaN(eventDate.getTime())) return "";

  // Rolle normalisieren
  const r = role.toString().trim().toLowerCase();

  // passende Zeilen filtern
  const candidates = org.filter(row => {
    const fachschaft = (row["Fachschaft"] || "").toString().trim().toLowerCase();
    if (fachschaft !== r) return false;

    const start = new Date(row["Amtsantritt"]);
    const end   = new Date(row["Amtsabgabe"]);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

    return eventDate >= start && eventDate <= end;
  });

  if (!candidates.length) return "";

  // Falls mehrere passen → nimm die erste
  const person = candidates[0];

  const vorname  = String(person["Vorname"]  || "").trim();
  const nachname = String(person["Nachname"] || "").trim();

  return `${vorname} ${nachname}`.trim();
}

	
document.getElementById("generateRechnungBtn").onclick = () => {
	  const entries = tableToJSON();
	  if (!entries.length) {
	    showStatus("Keine Positionen erfasst.", "error");
	    return;
	  }
	  if (!window.lastImportMeta) {
	    showStatus("Bitte zuerst eine Buchhaltungs-Excel laden.", "error");
	    return;
	  }
	  generateRechnungDoc(entries, window.lastImportMeta);
	};


/* Neuer Button: vorhandene HTML-Rechnung laden, bearbeiten, drucken */
document.getElementById("openRechnungPreviewBtn").addEventListener("click", () => {
  document.getElementById("rechnungHtmlInput").click();
});
 
document.getElementById("rechnungHtmlInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  e.target.value = "";
 
  const reader = new FileReader();
  reader.onload = (evt) => {
    const html = evt.target.result;
    zeigeRechnungPreview(html, file.name.replace(/\.html$/i, ""));
    showStatus(`"${file.name}" geladen – bearbeitbar und druckbar.`, "success");
  };
  reader.readAsText(file, "UTF-8");
});

function buildGetraenkeHTMLTable(rows) {
  if (!rows || !rows.length) {
    return "<p>Keine Getränkedaten vorhanden.</p>";
  }

  const body = rows.map(item => `
    <tr>
      <td>${item["Getränk"]}</td>
      <td style="text-align:right;">${item.Menge}</td>
      <td style="text-align:right;">${item.Einzelpreis} €</td>
      <td style="text-align:right;">${item.Gesamtpreis} €</td>
    </tr>
  `).join("");

  return `
    <table border="1" style="border-collapse: collapse; width: 100%;">
      <tr>
        <th style="background:#eee;">Getränk</th>
        <th style="background:#eee; text-align:right;">Menge</th>
        <th style="background:#eee; text-align:right;">Einzelpreis</th>
        <th style="background:#eee; text-align:right;">Gesamtpreis</th>
      </tr>
      ${body}
    </table>
  `;
}


function buildAdresseBlock(meta, org) {
  // Hilfsfunktion: erst in org-Zeile schauen, dann in importMeta
  const v = (key) => (org?.[key] ?? "") || (meta[key] ?? "");

  const vorname  = v("Vorname");
  const nachname = v("Nachname");
  const fachschaft = v("Fachschaft");
  const strasse  = v("Straße");
  const hausnr   = v("Hausnummer");
  const zweite   = v("2. Adresszeile");
  const plz      = v("PLZ");
  const ort      = v("Ort");

  const lines = [
    fachschaft,
    `${vorname} ${nachname}`.trim(),
    zweite,
    `${strasse} ${hausnr}`.trim(),
    `${plz} ${ort}`.trim()
  ];

  return lines.filter(x => x && x.trim()).join("<br>");
}

function getProductByName(name) {
try { return loadData().products.find(p => p.name === name) || null; }
catch { return null; }
}

function buildVerbrauchstabelle(entries, isIntern) {
	  const zusammen = {};

	  entries.forEach(e => {
	    if (!e.product) return;

	    // Zusatzkosten NICHT als Getränk behandeln
	    const name = String(e.product).trim().toLowerCase();
	    if (["Kosten", "gema", "reinigung", "glasbruch", "Kommisionskosten", "Sonstige Gebühren","Gesamtkosten"].includes(name)) {
	      return;
	    }

	    zusammen[e.product] = (zusammen[e.product] || 0) + (Number(e.total) || 0);
	  });

	  const rows = [];
	  let sum = 0;

	  Object.entries(zusammen).forEach(([name, total]) => {
	    if (total === 0) return;

	    // Preise primär aus geladener Preistabelle (Excel), Fallback auf Produkt-JSON
	    const priceEntry = findPriceEntryByName(name);
	    const p = getProductByName(name);
	    if (!priceEntry && !p) return;

	    const preis = isIntern
	      ? (priceEntry?.ek_int ?? p?.ek_int ?? 0)
	      : (priceEntry?.ek_ext ?? p?.ek_ext ?? 0);
	    const gesamt = preis * total;

	    rows.push({
	      "Getränk": name,
	      "Menge": total,
	      "Einzelpreis": preis.toFixed(2),
	      "Gesamtpreis": gesamt.toFixed(2)
	    });

	    sum += gesamt;
	  });

	  return { rows, sum };
	}




async function loadHTMLTemplate(path) {
const response = await fetch(path);
if (!response.ok) throw new Error("Template konnte nicht geladen werden: " + path);
return await response.text();
}

function fillTemplate(html, data) {
return html.replace(/{{(\w+)}}/g, (_, key) => data[key] ?? "");
}

async function generateRechnungDoc(entries, importMeta) {
const isIntern = (importMeta.rechnungstyp || "").toLowerCase().includes("intern");
const org = importMeta.fachschaftCode ? findOrgEntryByCode(importMeta.fachschaftCode) : null;

// Warnung wenn keine Preistabelle geladen
if (!window.priceTable || window.priceTable.length === 0) {
  const weiter = confirm(
    `⚠️ Keine Preistabelle geladen!\n\n` +
    `Ohne Preistabelle werden Preise aus der eingebetteten Produktliste verwendet.\n` +
    `Für aktuelle Preise bitte zuerst die Preistabelle (Excel) im Admin-Bereich laden.\n\n` +
    `Trotzdem fortfahren?`
  );
  if (!weiter) return;
}

// Warnung wenn kein Org-Eintrag gefunden – bei intern UND extern
if (!org && importMeta.fachschaftCode) {
  const weiter = confirm(
    `⚠️ Kein Org-Eintrag gefunden für Code: "${importMeta.fachschaftCode}"\n\n` +
    `Mögliche Ursachen:\n` +
    `• Kürzel in der Excel stimmt nicht exakt mit der Fakultät-Spalte überein\n` +
    `• Organisationstabelle noch nicht geladen\n\n` +
    `Trotzdem fortfahren? (Adress- und Namensdaten werden leer bleiben)`
  );
  if (!weiter) return;
}

const { rows: verbrauchRows, sum: sumGetr } = buildVerbrauchstabelle(entries, isIntern);
const zusatz = window.zusatzKosten || {
	  gema: 0, reinigung: 0, glasbruch: 0, kommission: 0, sonstige: 0
	};

const gesamt =
	  sumGetr +
	  zusatz.gema +
	  zusatz.reinigung +
	  zusatz.glasbruch +
	  zusatz.kommission +
	  zusatz.sonstige;


const templatePath = isIntern
 ? "https://raw.githubusercontent.com/alexanderortmann-rgb/Ernas-Inventarisierung/main/Dokumentenvorlagen/rechnung_intern.html"
 : "https://raw.githubusercontent.com/alexanderortmann-rgb/Ernas-Inventarisierung/main/Dokumentenvorlagen/rechnung_extern.html";

let html = await loadHTMLTemplate(templatePath);

const data = {
 AdresseBlock: buildAdresseBlock(importMeta, org),
 Rechnungsnummer: importMeta.rechnungsnummer || "",
 Kostenstelle: org?.["Kostenstelle"] || "",
 Anrede: org?.["Geschlecht"] || "geehrte Damen und Herren",
 Nachname: org?.["Nachname"] || "",
 Mail: org?.["Mail"] || "",
 MatrikelNr: org?.["Matrikel Nr."] || "",
 DatumRech: formatDateDE(new Date()),
 Datum: formatDateDE(importMeta.event_date),
 Event: importMeta.purpose || "",
 Finanzvorstand: getPersonByRole("Finanzen", importMeta.event_date) || "",
 Vorstand: getPersonByRole("Vorstand", importMeta.event_date) || "",
 Getr: sumGetr.toFixed(2),
 Reig: zusatz.reinigung?.toFixed(2) || "0.00",
 GBr: zusatz.glasbruch?.toFixed(2) || "0.00",
 Kom: zusatz.kommission?.toFixed(2) || "0.00",
 Gema: zusatz.gema?.toFixed(2) || "0.00",
 Sonst: zusatz.sonstige?.toFixed(2) || "0.00",

 Rechnungsbetrag: gesamt.toFixed(2),
 GetraenkeTabelle: buildGetraenkeHTMLTable(verbrauchRows)
};

/* Erzeugt den QR-Code -> braucht Platzhalter in der Rechnungs Html */

const verwendungszweck = ("Rechnung " + (importMeta.rechnungsnummer || ""))
  .replace(/[^a-zA-Z0-9\/\-\s]/g, "")
  .trim()
  .slice(0, 140); // EPC erlaubt bis zu 140 Zeichen im unstrukturierten Feld

await new Promise(resolve => {
  generateSEPAQR(
    "DE51614500501001461599",
    "OASPDE6AXXX",
    "Studierendenschaft der Hochschule Aalen",
    gesamt,
    verwendungszweck,  // ← jetzt die bereinigte Variable, nicht nochmal der Raw-String
    (qrData) => {
      addLogoToQR(qrData, "Logos/AStA_Logo_Endversion_2026.png", (qrWithLogo) => {
        data.QRCodeData = qrWithLogo;
        resolve();
      });
    }
  );
});



html = fillTemplate(html, data);

zeigeRechnungPreview(html, `${data.Rechnungsnummer}_${data.Event}`.replace(/\s+/g, "_"));
}
 
/** Zentrales Öffnen des Preview-Modals – wird von generateRechnungDoc UND dem HTML-Laden genutzt */
function zeigeRechnungPreview(html, filename) {
  const preview = document.getElementById("rechnungPreview");
  preview.setAttribute("contenteditable", "false");
  preview.style.outline = "";
  preview.innerHTML = html;
 
  const editBtn = document.getElementById("editRechnungBtn");
  if (editBtn) { editBtn.textContent = "✏️ Bearbeiten"; editBtn.title = "Rechnung bearbeiten"; }
  const badge = document.getElementById("rechnungEditBadge");
  if (badge) badge.style.display = "none";
 
  document.getElementById("rechnungPreviewContainer").style.display = "block";
  window.currentRechnungHTML     = html;
  window.currentRechnungFilename = filename || "rechnung";
}

/* ==========================
EXPORT-FUNKTIONEN
========================== */

function downloadHTML() {
const html = window.currentRechnungHTML;
const blob = new Blob([html], { type: "text/html" });
saveAs(blob, window.currentRechnungFilename + ".html");
}

function downloadPDF() {
  const html = window.currentRechnungHTML;
  if (!html) {
    alert("Keine Rechnung vorhanden.");
    return;
  }

  // Neues Fenster öffnen
  const win = window.open("", "_blank");

  if (!win) {
    alert("Popup blockiert. Bitte Popups erlauben.");
    return;
  }

  // Rechnung in das neue Fenster schreiben
  win.document.open();
  win.document.write(html);
  win.document.close();

  // Optional: Fenster fokussieren, damit STRG+P sofort geht
  win.onload = () => {
    win.focus();
    // Wenn du willst, dass der Druckdialog automatisch aufgeht:
    // win.print();
  };
}



/* ==========================
EDITOR (QUILL)
========================== */

function enableEditor() {
  const preview = document.getElementById("rechnungPreview");
  const badge   = document.getElementById("rechnungEditBadge");
  const editBtn = document.getElementById("editRechnungBtn");
 
  if (preview.getAttribute("contenteditable") === "true") {
    // Bearbeitungsmodus beenden und HTML speichern
    preview.setAttribute("contenteditable", "false");
    preview.style.outline = "";
    preview.style.cursor  = "";
    badge.style.display   = "none";
    editBtn.textContent   = "✏️ Bearbeiten";
    editBtn.title         = "Rechnung bearbeiten";
 
    // Aktuellen Inhalt sichern (inkl. Bearbeitungen)
    window.currentRechnungHTML = preview.innerHTML;
    showStatus("Änderungen gespeichert.", "success");
  } else {
    // Bearbeitungsmodus starten
    preview.setAttribute("contenteditable", "true");
    preview.style.outline = "2px dashed #f59e0b";
    preview.style.cursor  = "text";
    badge.style.display   = "";
    editBtn.textContent   = "💾 Speichern";
    editBtn.title         = "Änderungen speichern";
    preview.focus();
  }
}
 
function closePreview() {
  const preview = document.getElementById("rechnungPreview");
  // Bearbeitungsmodus sicher beenden
  if (preview.getAttribute("contenteditable") === "true") {
    window.currentRechnungHTML = preview.innerHTML;
    preview.setAttribute("contenteditable", "false");
    preview.style.outline = "";
  }
  document.getElementById("rechnungPreviewContainer").style.display = "none";
  document.getElementById("rechnungEditBadge").style.display = "none";
}