/*=======================
	Admin Auswertung
========================*/

 document.getElementById('adminExcelUpload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const wb = XLSX.read(evt.target.result, { type: 'binary' });
    const sheetName = "Erfassung";
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      alert("Blatt 'Erfassung' nicht gefunden!");
      return;
    }

    // Backup speichern
    //XLSX.writeFile(wb, "Backup_" + file.name);

    // Kontaktinfo aus Basis- und externen Feldern zusammensetzen
    const contactInfo = [
      "Name: " + (document.getElementById("name").value || ""),
      "Matrikelnummer: " + (document.getElementById("MatNr").value || ""),
      "Studmail: " + (document.getElementById("studmail").value || ""),
      document.getElementById("ext_street").value,
      document.getElementById("ext_number").value,
      document.getElementById("ext_zip").value,
      document.getElementById("ext_city").value,
      document.getElementById("ext_contact").value
    ].filter(v => v && v.trim() !== "").join(", ");

    // Nur Tagesdatum ohne Uhrzeit → Excel-Seriennummer
    const today = new Date();
    today.setHours(0,0,0,0);
    const excelDate = toExcelDate(today);

    // Metadaten aus App
    const newMeta = [
      excelDate, // Zahl für Datum
      document.getElementById("fachschaft").value,
      document.getElementById("purpose").value || "",
      document.getElementById("note").value || "",
      contactInfo,
      document.getElementById("from_location").value,
      document.getElementById("action").value,
      document.getElementById("to_location").value
    ];

    // Spaltenanzahl bestimmen
    const range = XLSX.utils.decode_range(ws['!ref']);
    const newColIndex = range.e.c + 1;
    range.e.c = newColIndex;
    ws['!ref'] = XLSX.utils.encode_range(range);

    // Duplikatprüfung
    let duplicate = false;
    for (let col = 1; col <= range.e.c; col++) {
      let match = true;
      for (let row = 1; row < 9; row++) {
        const addr = XLSX.utils.encode_cell({r: row, c: col});
        const cellValue = ws[addr]?.v;
        const metaValue = newMeta[row-1];
        if (cellValue !== metaValue) {
          match = false;
          break;
        }
      }
      if (match) {
        duplicate = true;
        break;
      }
    }
    if (duplicate) {
      alert("Dieses Event existiert bereits in der Auswertung!");
      return;
    }

    // Metadaten schreiben
    for (let row = 1; row < 9; row++) {
      const addr = XLSX.utils.encode_cell({r: row, c: newColIndex});
      if (row === 1) {
        ws[addr] = { t: 'n', v: newMeta[row-1] }; // Zahl für Datum
      } else {
        ws[addr] = { t: 's', v: newMeta[row-1] };
      }
    }

    // Getränkedaten aus App
    const rows = document.querySelectorAll("#list tbody tr");
    const appData = Array.from(rows).map(r => {
      const cells = r.querySelectorAll("td");
      return {
        produkt: cells[1]?.innerText.trim(),
        gesamt: cells[4]?.innerText.trim()
      };
    });

    // Werte zuordnen
    const debugLines = [];
    for (let r = 9; r <= range.e.r; r++) {
      const produktAddr = XLSX.utils.encode_cell({r, c:0});
      const produktName = String(ws[produktAddr]?.v || "").trim();
      const matches = appData.filter(a => a.produkt === produktName);
      const total = matches.reduce((sum, m) => sum + Number(m.gesamt || 0), 0);

      const addr = XLSX.utils.encode_cell({r, c:newColIndex});

      // Wenn es Treffer gibt, schreibe die Summe, sonst leer
      if (matches.length > 0) {
        ws[addr] = { t: 'n', v: total };
        debugLines.push(produktName + " → " + total);
      } else {
        ws[addr] = { t: 's', v: "" };
        debugLines.push(produktName + " → (kein Eintrag)");
      }}


    // Debug-Ausgabe
    const debugText =
      "Neue Spalte Index: " + newColIndex + " (Excel-Spalte " + (newColIndex+1) + ")\n" +
      "Metadaten:\n" + newMeta.map((m,i)=>"Zeile "+(i+1)+": "+m).join("\n") + "\n\n" +
      "Produkte:\n" + debugLines.slice(0,20).join("\n") +
      (debugLines.length > 20 ? "\n... weitere Produkte ..." : "");
    document.getElementById("debugText").innerText = debugText;

    // Datei speichern
    XLSX.writeFile(wb, file.name);

    alert("Event erfolgreich hinzugefügt – Formeln bleiben erhalten!");
  };

  reader.readAsBinaryString(file);

  // Reset, damit dieselbe Datei erneut gewählt werden kann
  e.target.value = "";
});

document.getElementById('adminExcelTrigger').addEventListener('click', () => {
  document.getElementById('adminExcelUpload').click();
});


/* ============================
Admin: Kategorien & Produkte
============================ */

const newProdName = document.getElementById("newProdName");
const newProdCase = document.getElementById("newProdCase");
const newProdCategory = document.getElementById("newProdCategory");
const newProdBarcode = document.getElementById("newProdBarcode");
const addProductBtn = document.getElementById("addProductBtn");

const newCategoryName = document.getElementById("newCategoryName");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const categoryList = document.getElementById("categoryList");

const productEditor = document.getElementById("productEditor");
const loadProductsBtn = document.getElementById("loadProductsBtn");
const saveProductsBtn = document.getElementById("saveProductsBtn");

const exportProductsBtn = document.getElementById("exportProductsBtn");
const importProductsInput = document.getElementById("importProductsInput");

// Produkte laden und speichern
async function loadData() {
  return await loadProductData();
}


function saveData(data) {
  //Produktsortierung
  data.products.sort((a, b) => a.name.localeCompare(b.name));
  loadProductsIntoApp(data.products);
  updateCategoryUI(data);
}





//Kategorien aus JSON extrahieren
function updateCategoryUI(data) {
  const categories = [...new Set(data.categories)].sort();

  // Dropdown für neues Produkt
  newProdCategory.innerHTML = categories
    .map(c => `<option>${c}</option>`)
    .join("");

  // Kategorie-Liste
  categoryList.innerHTML = "";
  categories.forEach(cat => {
    const li = document.createElement("li");
    li.textContent = cat;

    const del = document.createElement("button");
    del.textContent = "Löschen";
    del.onclick = () => deleteCategory(cat);

    li.appendChild(del);
    categoryList.appendChild(li);
  });

  updateCategoryFilter(data.products);
}





//Produkte aus Script-Tag laden
async function loadProducts() {
  const data = await loadProductData();
  return data.products;
}



//Produkte zurückschreiben
function saveProducts(products) {
  products.sort((a, b) => a.name.localeCompare(b.name));

  const data = { 
    products,
    categories: extractCategories(products)
  };

  loadProductsIntoApp(data.products);
  updateCategoryUI(data);
}



//Neues Produkt hinzufügen


	addProductBtn.onclick = async () => {
	  const name = newProdName.value.trim();
	  const perCase = parseInt(newProdCase.value.trim(), 10);
	  const category = newProdCategory.value.trim();
	  const barcode = newProdBarcode.value.trim();
	
	  if (!name || !perCase || !category) {
	    alert("Bitte alle Felder ausfüllen.");
	    return;
	  }
	
	  let data = await loadData();
	
	  if (data.products.some(p => p.name === name)) {
	    alert("Dieses Produkt existiert bereits.");
	    return;
	  }
	
	  data.products.push({ name, perCase, category, barcode });
	  saveData(data);
	
	  newProdName.value = "";
	  newProdCase.value = "";
	  newProdBarcode.value = "";
	};




//Neue Kategorie hinzufügen oder löschen
addCategoryBtn.onclick = async () => {
  const cat = newCategoryName.value.trim();
  if (!cat) return;

  let data = await loadData();
  if (!data.categories.includes(cat)) {
    data.categories.push(cat);
    saveData(data);
  }

  newCategoryName.value = "";
};


function deleteCategory(cat) {
  let data = loadData();
  data.categories = data.categories.filter(c => c !== cat);

  // Produkte dieser Kategorie auf "Sonstiges" setzen
  data.products = data.products.map(p => {
    if (p.category === cat) p.category = "Sonstiges";
    return p;
  });

  saveData(data);
}



//JSON-Editor laden
loadProductsBtn.onclick = async () => {
  const data = await loadData();
  productEditor.value = JSON.stringify(data, null, 2);
};



//JSON-Editor speichern
saveProductsBtn.onclick = () => {
try {
 const data = JSON.parse(productEditor.value);
 saveData(data);
 alert("Liste gespeichert.");
} catch {
 alert("Fehlerhafte JSON.");
}
};


//Export
exportProductsBtn.onclick = async () => {
  const data = await loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "products.json";
  a.click();

  URL.revokeObjectURL(url);
};



//Import
importProductsInput.onchange = e => {
const file = e.target.files[0];
if (!file) return;

const reader = new FileReader();
reader.onload = evt => {
 try {
   const list = JSON.parse(evt.target.result);
   saveProducts(list);
   alert("Liste importiert.");
 } catch {
   alert("Fehlerhafte JSON-Datei.");
 }
};
reader.readAsText(file);
};