/* ============================

     Grund-Setup
  ============================ */
  

const params = new URLSearchParams(location.search);
const fromLocationSel = document.getElementById('from_location');
const actionSel = document.getElementById('action');
const toLocationSel = document.getElementById('to_location');
  
const vonLocLabel = document.getElementById("von_loc"); 
const zuLocLabel = document.getElementById("zu_loc");

if (params.get('to_location')) toLocationSel.value = params.get('to_location');
if (params.get('action')) actionSel.value = params.get('action');
if (params.get('from_location')) fromLocationSel.value = params.get('from_location');

const tbody = document.querySelector('#list tbody');

const addBtn = document.getElementById('add');
const submitBtn = document.getElementById('submit');
const exportExcelBtn = document.getElementById('exportExcel');
const saveLocalBtn = document.getElementById('saveLocal');
const loadLocalBtn = document.getElementById('loadLocal');
const exportJsonBtn = document.getElementById('exportJson');
const importJsonInput = document.getElementById('importJson');

const fachschaftSel = document.getElementById('fachschaft');
const extFields = document.getElementById('external_fields');

const matNrInput = document.getElementById('MatNr');
const studmailInput = document.getElementById('studmail');

//const data = JSON.parse(document.getElementById("productData").textContent);
const productSearch = document.getElementById('product_search');
const categorySelect = document.getElementById('category');
const productSelect = document.getElementById('product');
const autoList = document.getElementById('autocomplete_list');
const mailBtn = document.getElementById("submit");
mailBtn.disabled = true;

let currentIndex = -1;
  
  /* ============================
  Import der Getränkeliste (offline, ohne fetch)
============================ */

function normalizeKey(str) {
	 return str.replace(/\s+/g, "").toLowerCase();
	}
	
let productList = [];
let bottlesPerCase = {};
let productCategories = {};


function loadProductsIntoApp(products) {

	  // Produktliste
	  productList = products.map(p => p.name);

	  // perCase Mapping
	  bottlesPerCase = {};
	  products.forEach(p => {
	    bottlesPerCase[normalizeKey(p.name)] = p.perCase;
	  });

	  // Kategorien
	  productCategories = {};
	  products.forEach(p => {
	    productCategories[p.name] = p.category;
	  });

	  // Preise
	  window.productVkPrice = {};
	  window.productEkInt   = {};
	  window.productEkExt   = {};
	  products.forEach(p => {
	    window.productVkPrice[p.name] = p.vk_price  ?? null;
	    window.productEkInt[p.name]   = p.ek_int    ?? null;
	    window.productEkExt[p.name]   = p.ek_ext    ?? null;
	  });

	  // 1. Kategorie-Filter aktualisieren
	  updateCategoryFilter(products);

	  // 2. Produkt-Dropdown füllen (erst jetzt!)
	  productSelect.innerHTML = products
	    .map(p => `<option>${p.name}</option>`)
	    .join("");

	  // 3. Jetzt erst filtern
	  filterProducts();

	  console.log("Produkte & Kategorien initialisiert");
	}


function updateCategoryFilter(products) {
	  // Alle Kategorien aus allen Produkten sammeln
	  const categories = [...new Set(
	    products.flatMap(p => Array.isArray(p.category) ? p.category : [p.category])
	  )].sort();

	  // setzt den Standardwert in den Kategorien fest
	  categorySelect.innerHTML = `<option value="">Alle</option>`;

	  categories.forEach(cat => {
	    const opt = document.createElement("option");
	    opt.value = cat;
	    opt.textContent = cat;
	    categorySelect.appendChild(opt);
	    categorySelect.value = "Aktuell auf Lager";

	  });
	}




// Favoriten laden
function loadFavorites() {
  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  favorites.sort((a, b) => a.localeCompare(b));

  const favSelect = document.getElementById("favorites");
  favSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.textContent = "Favorit auswählen…";
  placeholder.disabled = true;
  placeholder.selected = true;
  favSelect.appendChild(placeholder);

  favorites.forEach(prod => {
    const opt = document.createElement("option");
    opt.value = prod;
    opt.textContent = prod;
    favSelect.appendChild(opt);
  });

  updateFavButton();
}

// Stern-Button aktualisieren
function updateFavButton() {
  const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
  const currentProduct = productSelect.value;
  const favBtn = document.getElementById("favAddBtn");

  if (favorites.includes(currentProduct)) {
    favBtn.classList.add("favorited");   // z.B. gelb
    favBtn.classList.remove("not-favorited");
  } else {
    favBtn.classList.remove("favorited");
    favBtn.classList.add("not-favorited"); // z.B. grau
  }
}

// Produkte filtern
function filterProducts() {
  const cat = categorySelect.value;
  const currentSelection = productSelect.value; // merken
  productSelect.innerHTML = "";

  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

  productList.forEach(prod => {
    let catOfProd = productCategories[prod] || "Sonstiges";
    const matches =
      !cat ||
      (Array.isArray(catOfProd) ? catOfProd.includes(cat) : catOfProd === cat);

    if (matches) {
      const opt = document.createElement("option");
      opt.value = prod;
      opt.textContent = favorites.includes(prod) ? "★ " + prod : prod;
      productSelect.appendChild(opt);
    }
  });

  // Auswahl wiederherstellen, falls möglich
  if (currentSelection && [...productSelect.options].some(o => o.value === currentSelection)) {
    productSelect.value = currentSelection;
  } else if (productSelect.options.length > 0) {
    productSelect.value = productSelect.options[0].value;
  }

  updateFavButton();
}

// Kategorie-Filter: bei Änderung Dropdown neu befüllen
categorySelect.addEventListener("change", filterProducts);

// Favoriten-Dropdown Event
document.getElementById("favorites").addEventListener("change", (e) => {
  const selectedFav = e.target.value;
  if (selectedFav && selectedFav !== "Favorit auswählen…") {
    productSelect.value = selectedFav;
    filterProducts();
    productSelect.value = selectedFav; // Wert nach Neuaufbau wieder setzen
    updateFavButton();
  }
});

// Stern toggelt Favorit
document.getElementById("favAddBtn").onclick = () => {
  const product = productSelect.value;
  let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");

  if (favorites.includes(product)) {
    favorites = favorites.filter(p => p !== product);
  } else {
    favorites.push(product);
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  loadFavorites();
  filterProducts();
  productSelect.value = product; // Auswahl beibehalten
  updateFavButton();
};



productSelect.addEventListener("change", () => {
	  updateFavButton();
	  updatePerCaseHint();
	  handleSpiritousenFocus();
	});

function updatePerCaseHint() {
  const prod = productSelect.value;
  const pc = bottlesPerCase[normalizeKey(prod)];
  const hint = document.getElementById("perCaseHint");
  if (hint) {
    hint.textContent = pc && pc > 1 ? `(${pc} Fl./Kiste)` : "";
  }
}

function handleSpiritousenFocus() {
  const prod = productSelect.value;
  const cat = productCategories[prod];
  const catStr = Array.isArray(cat) ? cat[0] : (cat || "");
  if (catStr === "Spirituosen") {
    document.getElementById("qty_bottles").focus();
  } else {
    document.getElementById("qty_boxes").focus();
  }
}




  /* ============================
     Studmail automatisch erzeugen
  ============================ */

  matNrInput.addEventListener('input', () => {
    const mat = matNrInput.value.trim();
    if (/^[0-9]+$/.test(mat)) {
      studmailInput.value = `${mat}@studmail.htw-aalen.de`;
    } else {
      studmailInput.value = "@studmail.htw-aalen.de";
    }
  });


  /* ============================
     Extern-Felder ein/ausblenden
  ============================ */

  function updateExternalFields() {
    const fach = fachschaftSel.value.trim();
    const from = fromLocationSel.value.trim();
    const to = toLocationSel.value.trim();

    if (fach === "Extern" || from === "Extern" || to === "Extern") {
      extFields.style.display = "block";
    } else {
      extFields.style.display = "none";
    }
  }

  fachschaftSel.onchange = updateExternalFields;
  fromLocationSel.onchange = updateExternalFields;
  toLocationSel.onchange = updateExternalFields;
  
  function updatePurposeField() {
	  const action = actionSel.value.trim();
	  const to = toLocationSel.value.trim();

	  const show = (
	    action === "Verbrauch" ||
	    action === "Anfangsbestand" ||
	    action === "Endbestand" ||
	    to === "Event/ Verbrauch"
	  );

	  const row   = document.getElementById("purpose_date_row");
	  const input = document.getElementById("purpose");

	  if (show) {
	    row.style.display = "block";
	    row.classList.remove("hidden");
	  } else {
	    row.style.display = "none";
	    row.classList.add("hidden");
	    input.value = "";
	    const ed = document.getElementById("event_date");
	    if (ed) ed.value = "";
	  }
	}


	// Events
	actionSel.onchange = updatePurposeField;
	toLocationSel.onchange = updatePurposeField;

	// Initialisierung
	document.addEventListener("DOMContentLoaded", updatePurposeField);

	/* ============================
    Anfangs- und Endbestand sichere Einstellungen
 ============================ */
	
	 const fromLocation = document.getElementById("from_location");
	 const toLocation = document.getElementById("to_location");
	 const action = document.getElementById("action");
	 const title = document.getElementById("Titel");
	 
	  
	 
	  
	
	 action.addEventListener("change", () => {
	   if (action.value === "Anfangsbestand" || action.value === "Endbestand") {
	     // Zu Lagerort = Von Lagerort, gesperrt
	     toLocation.value = fromLocation.value;
	     toLocation.disabled = true;
	     title.textContent = "Warenbestand – " + action.value;
	     
	   } else if (action.value === "Verbrauch") {
	     // Zu Lagerort = Event / Verbrauch, aber editierbar
	     toLocation.disabled = false;
	     // nur setzen wenn der aktuelle Wert nicht passt
	     const verbrauchOpts = Array.from(toLocation.options).filter(o=>o.style.display!=="none").map(o=>o.value);
	     if (!verbrauchOpts.includes(toLocation.value)) toLocation.value = verbrauchOpts[0] || "";
	     title.textContent = "Warenbestand – " + action.value;
	     
	   } else if (action.value === "Lagerwechsel" || action.value === "Lieferung") {
		     toLocation.disabled = false;
		     title.textContent = "Warenbestand – " + action.value;
		     
	   } else {
	     // Normalfall: frei wählbar
	     toLocation.disabled = false;
	   }
	   updatePurposeField();
	 });
	
	 // Falls Von Lagerort geändert wird, bei Anfangs/Endbestand nachziehen
	 fromLocation.addEventListener("change", () => {
	   if (action.value === "Anfangsbestand" || action.value === "Endbestand") {
	     toLocation.value = fromLocation.value;
	   }
	 });


 // Mit Tabs zur einfacheren Einstellung
 
 const modeTabs = document.querySelectorAll("#modeTabs .tab");

modeTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    // aktive Klasse setzen
    modeTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const mode = tab.dataset.mode;

    if (mode === "ernas") {
      filterOptions(fromLocation, ["Kühlzelle"]);
      filterOptions(toLocation, ["Event / Verbrauch"]);
      filterOptions(action, ["Verbrauch", "Anfangsbestand", "Endbestand"]);
      adminArea.style.display = "none";
      fromLocation.style.display = "none";
      toLocation.style.display = "none";
      vonLocLabel.style.display = "none"; 
      zuLocLabel.style.display = "none";
    } else if (mode === "lieferant") {
    	  filterOptions(fromLocation, ["Anlieferung"]);
	      filterOptions(toLocation, ["Zwischenlager", "Probenraum", "Fahrradwerkstatt", "Kühlzelle"]);
	      filterOptions(action, ["Lieferung"]);
	      adminArea.style.display = "none";
	      fromLocation.style.display = "block";
	      toLocation.style.display = "block";
	      vonLocLabel.style.display = "block"; 
	      zuLocLabel.style.display = "block";
      // evtl. kleine Einschränkungen
    } else if (mode === "lagerwechsel") {
      resetOptions(fromLocation);
      filterOptions(fromLocation, ["Kühlzelle", "Fahrradwerkstatt", "Probenraum", "Zwischenlager", "Kühlschrank FW", "Büro", "Extern"]);
      resetOptions(toLocation);
      filterOptions(toLocation, ["Kühlzelle", "Fahrradwerkstatt", "Probenraum", "Anlieferung", "Zwischenlager", "Kühlschrank FW", "Büro", "Extern"]);
      filterOptions(action, ["Lagerwechsel"]);
      adminArea.style.display = "none";
      fromLocation.style.display = "block";
      toLocation.style.display = "block";
      vonLocLabel.style.display = "block"; 
      zuLocLabel.style.display = "block";
      // volle Auswahl
    }else if (mode === "admin") {
	      resetOptions(fromLocation);
	      resetOptions(toLocation);
	      resetOptions(action);
	      adminArea.style.display = "block";
	      fromLocation.style.display = "block";
	      toLocation.style.display = "block";
	      vonLocLabel.style.display = "block"; 
	      zuLocLabel.style.display = "block";
	      // volle Auswahl
	    }
 // **immer am Ende prüfen** 
 updatePurposeField();
  });
});

 

function filterOptions(select, allowed) {
	  [...select.options].forEach(opt => {
	    opt.style.display = allowed.includes(opt.text) ? "block" : "none";
	  });

	  // Falls aktueller Wert nicht mehr erlaubt ist → zurücksetzen
	  if (!allowed.includes(select.value)) {
	    select.value = allowed[0] || "";
	  }
	}


function resetOptions(select) {
  [...select.options].forEach(opt => opt.style.display = "block");
}


//Damit beim Start und Klick auch alles gefiltert wird

function applyMode(mode) {
  // Immer zuerst disabled zurücksetzen
  toLocation.disabled = false;
  if (mode === "ernas") {
    filterOptions(fromLocation, ["Kühlzelle"]);
    filterOptions(toLocation, ["Kühlzelle", "Event / Verbrauch"]);
    filterOptions(action, ["Verbrauch", "Anfangsbestand", "Endbestand"]);
    adminArea.style.display = "none";
      fromLocation.style.display = "none";
      toLocation.style.display = "none";
      vonLocLabel.style.display = "none"; 
      zuLocLabel.style.display = "none";
      toLocation.value = "Event / Verbrauch";
      fromLocation.value = "Kühlzelle";
      action.value = "Verbrauch";
      title.textContent = "Warenbestand – " + action.value;
  } else if (mode === "lieferant") {
    filterOptions(fromLocation, ["Anlieferung"]);
    filterOptions(toLocation, ["Zwischenlager", "Probenraum", "Fahrradwerkstatt", "Kühlzelle"]);
    filterOptions(action, ["Lieferung"]);
    adminArea.style.display = "block";
      fromLocation.style.display = "block";
      toLocation.style.display = "block";
      vonLocLabel.style.display = "block"; 
      zuLocLabel.style.display = "block";
      title.textContent = "Warenbestand – " + action.value;
  } else if (mode === "lagerwechsel") {
    resetOptions(fromLocation);
    filterOptions(fromLocation, ["Kühlzelle", "Fahrradwerkstatt", "Probenraum", "Zwischenlager", "Kühlschrank FW", "Büro", "Extern"]);
    filterOptions(toLocation, ["Kühlzelle", "Fahrradwerkstatt", "Probenraum", "Anlieferung", "Zwischenlager", "Kühlschrank FW", "Büro", "Extern"]);
    filterOptions(action, ["Lagerwechsel"]);
    adminArea.style.display = "block";
      fromLocation.style.display = "block";
      toLocation.style.display = "block";
      vonLocLabel.style.display = "block"; 
      zuLocLabel.style.display = "block";
      title.textContent = "Warenbestand – " + action.value;
  } else if (mode === "admin") {
    resetOptions(fromLocation);
    resetOptions(toLocation);
    resetOptions(action);
    adminArea.style.display = "block";
      fromLocation.style.display = "block";
      toLocation.style.display = "block";
      vonLocLabel.style.display = "block"; 
      zuLocLabel.style.display = "block";
      title.textContent = "Warenbestand – " + action.value;
  }
}

modeTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    modeTabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    applyMode(tab.dataset.mode);
  });
});

// Initialisierung beim Laden
document.addEventListener("DOMContentLoaded", () => {
  const activeTab = document.querySelector("#modeTabs .tab.active");
  if (activeTab) applyMode(activeTab.dataset.mode);
});

	 
 


  /* ============================
     Produkt-AutoComplete Deluxe
  ============================ */

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      text.substring(0, idx) +
      "<b>" + text.substring(idx, idx + query.length) + "</b>" +
      text.substring(idx + query.length)
    );
  }

  function updateAutocomplete() {
    const query = productSearch.value.toLowerCase();
    const options = Array.from(productSelect.options);

    autoList.innerHTML = "";
    currentIndex = -1;

    if (!query) {
      autoList.style.display = "none";
      return;
    }

    let matches = options.filter(opt =>
      opt.textContent.toLowerCase().includes(query)
    );

    // Sortierung: Treffer am Anfang zuerst
    matches.sort((a, b) => {
      const aIdx = a.textContent.toLowerCase().indexOf(query);
      const bIdx = b.textContent.toLowerCase().indexOf(query);
      return aIdx - bIdx;
    });

    if (matches.length === 0) {
    	  const li = document.createElement("li");
    	  li.textContent = "Zusatz / nicht gelistet (Bitte dann in Kommentar Getränkbezeichnung, Gebindemenge und Kategorie eintragen!)";
    	  //li.style.fontStyle = "italic";

    	  li.onclick = () => {
    		  productSearch.value = "Zusatz / nicht gelistet (Bitte dann in Kommentar Getränkbezeichnung, Gebindemenge und Kategorie eintragen!)";
    	    productSelect.value = "Zusatz / nicht gelistet (Bitte dann in Kommentar Getränkbezeichnung, Gebindemenge und Kategorie eintragen!)";
    	    
    	    //autoList.style.display = "none";
    	  };

    	  autoList.appendChild(li);
    	  autoList.style.display = "block";
    	  return;
    	}


    matches.forEach((opt, index) => {
      const li = document.createElement('li');
      li.innerHTML = highlightMatch(opt.textContent, query);

      li.onclick = () => {
    	  productSelect.value = opt.value;
    	  productSearch.value = opt.textContent;
    	  autoList.style.display = "none";
    	  updatePerCaseHint();
    	  handleSpiritousenFocus();
    	};


      autoList.appendChild(li);
    });

    autoList.style.display = "block";
  }

  productSearch.addEventListener('input', updateAutocomplete);
  productSearch.addEventListener('focus', updateAutocomplete);

  productSearch.addEventListener('keydown', (e) => {
    const items = autoList.querySelectorAll('li');
    if (items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % items.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      currentIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentIndex >= 0) items[currentIndex].click();
      return;
    } else {
      return;
    }

    items.forEach((item, i) => {
      item.classList.toggle('highlight', i === currentIndex);
    });
  });

  productSelect.addEventListener('change', () => {
    productSearch.value = "";
    autoList.style.display = "none";
  });


  
  /*==========================
	  
  POS-Modus
  ===========================*/

  
  const eventModal = document.getElementById("eventModal");
  const eventTiles = document.getElementById("eventTiles");
  const bookBtn = document.getElementById("bookBtn");
  const closeBtn = document.getElementById("closeEventBtn");
  meccesMode = false;
  let wasSummed = false;

  let productCounts = {}; // { Produktname: Anzahl }

  document.getElementById("eventModeBtn").onclick = () => {
	  meccesMode = true;
    eventModal.style.display = "block";
    buildEventTiles();
    filterOptions(toLocation, ["Event / Verbrauch"]);
    filterOptions(action, ["Verbrauch"]);
    
  };

  closeBtn.onclick = () => {
	  // Prüfen ob noch offene Positionen existieren
	  const hasOpenPositions = Object.values(productCounts).some(count => count > 0);
	  meccesMode = false;
	  
	  filterOptions(toLocation, ["Kühlzelle", "Event / Verbrauch"]);
	  filterOptions(action, ["Verbrauch", "Anfangsbestand", "Endbestand"]);

	  if (hasOpenPositions) {
	    const confirmClose = confirm("Es sind noch nicht gebuchte Positionen vorhanden. Wirklich schließen?");
	    if (!confirmClose) return; // Abbrechen
	  }

	  eventModal.style.display = "none";
	};


	function getCategoryIcon(category) {
		  const cat = Array.isArray(category) ? category[0] : category;
		  switch(cat) {
		    case "Bier": return "🍺";
		    case "Wein & Sekt": return "🍷";
		    case "Wasser": return "💧";
		    case "Softdrinks": return "🥤";
		    default: return "🍹";
		  }
		}


	function buildEventTiles() {
		  eventTiles.innerHTML = "";
		  productCounts = {};
		  const favSelect = document.getElementById("favorites");

		  for (let i = 0; i < favSelect.options.length; i++) {
		    const drink = favSelect.options[i].text;
		    if (!drink || drink.toLowerCase().includes("favorit")) continue;

		    productCounts[drink] = 0;
		    const category = productCategories[drink] || "Sonstiges";
		    const icon = getCategoryIcon(category);

		    // VK-Preis: zuerst window.vkPrices (Import), dann window.productVkPrice (Produkt-JSON)
		    const vk = window.vkPrices?.[drink] ?? window.productVkPrice?.[drink] ?? null;

		    const tile = document.createElement("div");
		    tile.className = "tile";
		    tile.dataset.drink = drink;

		    const priceTag  = vk != null ? `<div class="tile-price">${vk.toFixed(2)} € / Stk.</div>` : "";
		    const summeTag  = vk != null ? `<div class="tile-summe" style="font-size:0.95em; color:#888; min-height:1.2em;"></div>` : "";

		    tile.innerHTML = `
		      <div class="icon">${icon}</div>
		      <h3>${drink}</h3>
		      ${priceTag}
		      <div class="controls">
		        <span class="count">0</span>
		        <button class="minus" style="display:none;">−</button>
		      </div>
		      ${summeTag}`;

		    eventTiles.appendChild(tile);

		    const countSpan  = tile.querySelector(".count");
		    const minusBtn   = tile.querySelector(".minus");
		    const summeDiv   = tile.querySelector(".tile-summe");

		    function updateTile() {
		      const n = productCounts[drink];
		      countSpan.textContent = n;
		      minusBtn.style.display = n > 0 ? "inline-block" : "none";
		      tile.classList.toggle("selected", n > 0);
		      if (summeDiv && vk != null) {
		        summeDiv.textContent = n > 0 ? `= ${(vk * n).toFixed(2)} €` : "";
		      }
		      updatePosGesamtsumme();
		    }

		    tile.onclick = () => {
		      productCounts[drink]++;
		      updateTile();
		    };

		    minusBtn.onclick = (e) => {
		      e.stopPropagation();
		      if (productCounts[drink] > 0) productCounts[drink]--;
		      updateTile();
		    };
		  }

		  updatePosGesamtsumme();
		}

		function updatePosGesamtsumme() {
		  const wert = document.getElementById("posSummeWert");
		  if (!wert) return;
		  let gesamt = 0;
		  Object.entries(productCounts).forEach(([name, n]) => {
		    if (n <= 0) return;
		    const vk = window.vkPrices?.[name] ?? window.productVkPrice?.[name] ?? null;
		    if (vk != null) gesamt += vk * n;
		  });
		  wert.textContent = gesamt > 0 ? gesamt.toFixed(2).replace(".", ",") + " €" : "0,00 €";
		}

	function showEventFeedback(message, type="success") {
		  const fb = document.getElementById("eventFeedback");
		  fb.textContent = message;
		  fb.className = type; // success oder error
		  fb.style.display = "block";
		  setTimeout(() => fb.style.display = "none", 2500); // nach 2,5s ausblenden
		}

	bookBtn.onclick = () => {
		  const purpose = document.getElementById('purpose').value.trim();
		  if (!purpose) {
		    showEventFeedback("Bitte Zweck/Eventname ausfüllen!", "error");
		    return;
		  }
		  const fachschaft = fachschaftSel.value.trim();
		  if (!fachschaft) {
		    showEventFeedback("Bitte Fachschaft auswählen!", "error");
		    return;
		  }

		  let bookedSomething = false;
		  Object.entries(productCounts).forEach(([prod, count]) => {
		    if (count > 0) {
		      const perCase = bottlesPerCase[normalizeKey(prod)] || 1;

		      // nur sinnvoll, wenn perCase > 1
		      let boxes = 0;
		      let bottles = count;
		      if (perCase > 1) {
		        boxes = Math.floor(count / perCase);
		        bottles = count % perCase;
		      }

		      const totalBottles = count; // bleibt immer die Gesamtzahl
		      const timestamp = new Date().toLocaleString("de-DE");
		      const entry = {
		        timestamp,
		        product: prod,
		        boxes,
		        bottles,
		        total: totalBottles,
		        action: "Verbrauch",
		        purpose,
		        from: fromLocationSel.value,
		        to: "Event / Verbrauch",
		        fachschaft,
		        note: "",
		        contact: ""
		      };
		      appendRowFromEntry(entry);
		      bookedSomething = true;
		    }
		  });

		  if (bookedSomething) {
		    buildEventTiles();
		    if (wasSummed) {
		      showEventFeedback("✅ Buchung erfolgreich und zusammengefasst!", "success");
		    } else {
		      showEventFeedback("✅ Buchung erfolgreich!", "success");
		    }
		    wasSummed = false; // zurücksetzen
		  } else {
		    showEventFeedback("Keine Produkte ausgewählt!", "error");
		  }
		};


			
			

  /* ============================
     Tabellenzeile hinzufügen
  ============================ */

  function appendRowFromEntry(e) {
	  
	  // Zusatzkosten NICHT als Produkt importieren
	  const blacklist = ["kosten", "gema", "reinigung", "glasbruch", "kommisionskosten", "sonstige gebühren", "gesamtkosten"];
	  const prod = String(e.product || "").trim().toLowerCase();
	  if (blacklist.includes(prod)) {
	    return; // komplett überspringen
	  }

	  
	  const strichlistenMode = document.getElementById("strichlistenMode").checked;

	  const hasNote = e.note && e.note.trim() !== "";

	  let existingRow = null;

	  // Nur OHNE Kommentar darf zusammengefasst werden
	  if (!hasNote) {
	    existingRow = Array.from(tbody.querySelectorAll("tr")).find(tr =>
	      tr.cells[1].textContent.trim() === e.product &&
	      tr.cells[5].textContent.trim() === e.action &&
	      tr.cells[7].textContent.trim() === e.from &&
	      tr.cells[8].textContent.trim() === e.to &&
	      tr.cells[6].textContent.trim() === e.purpose &&
	      tr.cells[9].textContent.trim() === e.fachschaft &&
	      tr.cells[10].textContent.trim() === ""          // Kommentarspalte leer
	    );
	  }

	  if (existingRow) {
	    if (!(strichlistenMode || meccesMode)) {
	      const confirmAdd = confirm("Dieses Produkt ist in diesem Event/Maßnahme bereits erfasst. Soll es wirklich zusammengezählt werden?");
	      if (!confirmAdd) return;
	    }

	    // Mengen hochzählen
	    existingRow.cells[2].textContent = parseInt(existingRow.cells[2].textContent, 10) + e.boxes;
	    existingRow.cells[3].textContent = parseInt(existingRow.cells[3].textContent, 10) + e.bottles;
	    existingRow.cells[4].textContent = parseInt(existingRow.cells[4].textContent, 10) + e.total;

	    wasSummed = true;

	    // WICHTIG: KEINE Notizen anhängen – diese Zeile ist explizit „ohne Kommentar“
	  } else {
	    // Neue Zeile wie bisher
	    const tr = document.createElement('tr');

	    [
	      e.timestamp,
	      e.product,
	      e.boxes,
	      e.bottles,
	      e.total,
	      e.action,
	      e.purpose,
	      e.from,
	      e.to,
	      e.fachschaft,
	      e.note,
	      e.contact
	    ].forEach(text => {
	      const td = document.createElement('td');
	      td.textContent = text;
	      tr.appendChild(td);
	    });

	    const tdDel = document.createElement('td');
	    const del = document.createElement('button');
	    tr.classList.add("action-" + e.action.toLowerCase());

	    del.textContent = 'Entfernen';
	    del.onclick = () => deleteRowWithUndo(e, tr);
	    tdDel.appendChild(del);
	    tr.appendChild(tdDel);

	    tbody.appendChild(tr);
	  }
	}



  /*=====================================
  Filterlogik für die Tabellenansicht
  ==================================*/
  // Suche und alles andere ausblenden
  
  const searchInput = document.getElementById("tableSearch");

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const rows = document.querySelectorAll("#list tbody tr");

    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      row.style.display = text.includes(query) ? "" : "none";
    });
  });

  //Sortierung der Spalte
  
  document.querySelectorAll("#list th").forEach((th, idx) => {
	  th.style.cursor = "pointer"; // optisch erkennbar
	  th.title = "Klicken zum Sortieren"; // Hover-Hinweis

	  th.addEventListener("click", () => {
	    const tbody = document.querySelector("#list tbody");
	    const rows = Array.from(tbody.querySelectorAll("tr"));

	    const asc = th.classList.toggle("asc"); // Richtung merken
	    rows.sort((a, b) => {
	      const aText = a.cells[idx].textContent.trim().toLowerCase();
	      const bText = b.cells[idx].textContent.trim().toLowerCase();
	      return asc ? aText.localeCompare(bText) : bText.localeCompare(aText);
	    });

	    tbody.innerHTML = "";
	    rows.forEach(r => tbody.appendChild(r));
	  });
	});

  
  
  /* ============================
     Position hinzufügen (mit Validierung)
  ============================ */

  addBtn.onclick = () => {
  let valid = true;
  let missingFields = [];

  function markError(el, condition, fieldName) {
    if (condition) {
      el.classList.add("error");
      valid = false;
      if (fieldName) missingFields.push(fieldName);
    } else {
      el.classList.remove("error");
    }
  }

  // Pflichtfelder prüfen
  const name = document.getElementById('name').value.trim();
  const matNr = matNrInput.value.trim();
  //markError(document.getElementById('name'), !name, "Name");
  //markError(matNrInput, !matNr || !/^[0-9]+$/.test(matNr), "Matrikelnummer");

  const product = productSelect.value;
  let boxes = parseInt(document.getElementById('qty_boxes').value || '0', 10);
  let bottles = parseInt(document.getElementById('qty_bottles').value || '0', 10);
  const perCase = bottlesPerCase[normalizeKey(product)] || 1;
  const totalBottles = boxes * perCase + bottles;
  
	// Automatische Umrechnung nur sinnvoll, wenn perCase > 1
	if (perCase > 1) {
	  boxes += Math.floor(bottles / perCase); // zusätzliche Kisten
	  bottles = bottles % perCase;            // Restflaschen
	}

  
  
  markError(document.getElementById('qty_boxes'), totalBottles <= 0, "Menge");

  // Extern-Felder
  const fachTrim = fachschaftSel.value.trim();
  const fromTrim = fromLocationSel.value.trim();
  const toTrim = toLocationSel.value.trim();
  if (fachTrim === "Extern" || fromTrim === "Extern" || toTrim === "Extern") {
    const addrStreet = document.getElementById('ext_street').value.trim();
    const addrNo = document.getElementById('ext_number').value.trim();
    const addrZip = document.getElementById('ext_zip').value.trim();
    const addrCity = document.getElementById('ext_city').value.trim();
    const extContact = document.getElementById('ext_contact').value.trim();

    markError(document.getElementById('ext_street'), !addrStreet, "Straße");
    markError(document.getElementById('ext_number'), !addrNo, "Hausnummer");
    markError(document.getElementById('ext_zip'), !addrZip, "PLZ");
    markError(document.getElementById('ext_city'), !addrCity, "Ort");
    markError(document.getElementById('ext_contact'), !extContact, "Kontakt");
  }

  // Eventname/Zweck + Datum als Pflichtfelder wenn sichtbar
  const purpose = document.getElementById('purpose').value.trim();
  const eventDate = document.getElementById('event_date').value.trim();
  const purposeDateVisible = document.getElementById('purpose_date_row').style.display !== 'none';
  if (purposeDateVisible || actionSel.value === "Verbrauch" || 
       actionSel.value === "Anfangsbestand" || 
       actionSel.value === "Endbestand" || 
       toLocationSel.value === "Verbrauch") {
    markError(document.getElementById('purpose'), !purpose, "Zweck/Eventname");
    markError(document.getElementById('event_date'), !eventDate, "Datum des Events");
  }
  
  
  const strichlistenMode = document.getElementById("strichlistenMode").checked;

	//Prüfen, ob Produkt schon existiert
	const note = document.getElementById('note').value.trim();

	// Wenn Kommentar vorhanden → niemals als Duplikat behandeln
	let exists = false;

	if (note === "") {
  	// Nur Produkte ohne Kommentar werden zusammengefasst
  	exists = Array.from(document.querySelectorAll("#list tbody tr"))
    .some(tr => tr.cells[1].textContent.trim() === product &&
                tr.cells[10].textContent.trim() === ""); // Kommentarspalte leer
}

	
	//if (exists && !strichlistenMode) {
	 //const confirmAdd = confirm("Dieses Produkt ist bereits erfasst. Soll es wirklich nochmal hinzugefügt werden?");
	 //if (!confirmAdd) return; // Abbrechen
	//}
	
	if (exists && strichlistenMode) {
	 // Optional: kleinen Hinweis anzeigen
	 showStatus("Hinweis: Produkt mehrfach hinzugefügt – wird beim Export summiert.", "info");
	}

	

	
  

  // Falls Fehler vorhanden → Sammelmeldung
  if (!valid) {
    //showStatus("Bitte folgende Felder ausfüllen:\n- " + missingFields.join("\n- "), "error");
    alert("Bitte folgende Felder ausfüllen:\n- " + missingFields.join("\n- "));
    return;
  }
  

  // Wenn alles passt → Eintrag erzeugen
  const timestamp = new Date().toLocaleString("de-DE");
  const fachschaft = fachschaftSel.value;
  //const note = document.getElementById('note').value.trim();
  const studmail = studmailInput.value.trim();
  let contactInfo = `Name: ${name}, Matrikel Nr.: ${matNr}`;

  const entry = {
    timestamp,
    product,
    boxes,
    bottles,
    total: totalBottles,
    action: actionSel.value,
    purpose,
    from: fromLocationSel.value,
    to: toLocationSel.value,
    fachschaft,
    note,
    contact: contactInfo
  };

  appendRowFromEntry(entry);

  document.getElementById('qty_boxes').value = '0';
  document.getElementById('qty_bottles').value = '0';
  document.getElementById('note').value = '';
  productSearch.value = "";
  productSearch.focus();
};

// Enter in Kisten- oder Flaschenfeld = Position hinzufügen
["qty_boxes", "qty_bottles"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // verhindert, dass ein Formular abgeschickt wird
      addBtn.click();     // ruft denselben Code wie der Button auf
    }
  });
});



  /* ============================
     Tabelle → JSON
  ============================ */

  function tableToJSON() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    return rows.map(r => {
      const c = r.querySelectorAll('td');
      return {
        timestamp: c[0].textContent,
        product: c[1].textContent,
        boxes: Number(c[2].textContent),
        bottles: Number(c[3].textContent),
        total: Number(c[4].textContent),
        action: c[5].textContent,
        purpose: c[6].textContent,
        from: c[7].textContent,
        to: c[8].textContent,
        fachschaft: c[9].textContent,
        note: c[10].textContent,
        contact: c[11].textContent
      };
    });
  }





/* ============================
   Metadaten gesondert speichern
============================ */

function collectMeta() {
  return {
    name: document.getElementById("name")?.value || "",
    matrikelnummer: document.getElementById("MatNr")?.value || "", // Key = matrikelnummer
    fachschaft: document.getElementById("fachschaft")?.value || "",
    from_location: document.getElementById("from_location")?.value || "",
    action: document.getElementById("action")?.value || "",
    to_location: document.getElementById("to_location")?.value || "",
    purpose: document.getElementById("purpose")?.value || "",
    event_date: document.getElementById("event_date")?.value || "",
    studmail: document.getElementById("studmail")?.value || "",
    ext_street: document.getElementById("ext_street")?.value || "",
    ext_number: document.getElementById("ext_number")?.value || "",
    ext_zip: document.getElementById("ext_zip")?.value || "",
    ext_city: document.getElementById("ext_city")?.value || "",
    ext_contact: document.getElementById("ext_contact")?.value || "",
    note: document.getElementById("note")?.value || ""
  };
}

function applyMeta(meta) {
  if (!meta) return;

  const idMap = {
    matrikelnummer: "MatNr", // Mapping von Key → HTML-ID
    name: "name",
    fachschaft: "fachschaft",
    from_location: "from_location",
    action: "action",
    to_location: "to_location",
    purpose: "purpose",
    event_date: "event_date",
    studmail: "studmail",
    ext_street: "ext_street",
    ext_number: "ext_number",
    ext_zip: "ext_zip",
    ext_city: "ext_city",
    ext_contact: "ext_contact"
  };

  Object.entries(meta).forEach(([key, val]) => {
    const el = document.getElementById(idMap[key] || key);
    if (el) {
      el.value = val || "";
      if (val && el.classList.contains("hidden")) {
        el.classList.remove("hidden");
      }
    }
  });

  const purposeDateRow = document.getElementById("purpose_date_row");
  if (meta.purpose || meta.event_date) {
    if (purposeDateRow) { purposeDateRow.style.display = "block"; purposeDateRow.classList.remove("hidden"); }
  }

  const extContainer = document.getElementById("external_fields");
  if (extContainer) {
    const hasExt = meta.ext_street || meta.ext_number || meta.ext_zip || meta.ext_city || meta.ext_contact;
    if (hasExt) {
      extContainer.classList.remove("hidden");
    }
  }
}

  

 
 /* ============================
    Verbrauch berechnen (Anfangsbestand CSV - Endbestand CSV)
 ============================ */

document.getElementById("VerbrauchCalc").onclick = () => {

 function parseBestandCSV(file) {
   return new Promise((resolve) => {
     const reader = new FileReader();
     reader.onload = (ev) => {
       const lines = ev.target.result.split("\n").map(r =>
         r.split(";").map(v => v.replace(/"/g, "").trim())
       );
       // Meta-Block überspringen (bis zur Leerzeile)
       let i = 0;
       for (; i < lines.length; i++) {
         if (lines[i].length === 1 && lines[i][0] === "") break;
       }
       // Datenzeilen (Header überspringen)
       const rows = lines.slice(i + 2);
       const totals = {};
       rows.forEach(cols => {
         if (cols.length < 5) return;
         const product = cols[1];
         const total   = parseInt(cols[4], 10) || 0;
         const action  = (cols[5] || "").toLowerCase();
         if (!product) return;
         // Nur Anfangs- bzw. Endbestand-Zeilen berücksichtigen
         if (!action.includes("bestand")) return;
         totals[product] = (totals[product] || 0) + total;
       });
       resolve(totals);
     };
     reader.readAsText(file);
   });
 }

 function pickFile(labelText) {
   return new Promise((resolve) => {
     const input = document.createElement("input");
     input.type = "file";
     input.accept = ".csv";
     alert(labelText);
     input.onchange = () => resolve(input.files[0] || null);
     input.click();
   });
 }

 (async () => {
   // Schritt 1: Anfangsbestand
   const fileA = await pickFile("Schritt 1 von 2: Bitte die CSV mit dem ANFANGSBESTAND auswählen.");
   if (!fileA) return;
   const anfang = await parseBestandCSV(fileA);

   // Schritt 2: Endbestand
   const fileE = await pickFile("Schritt 2 von 2: Bitte die CSV mit dem ENDBESTAND auswählen.");
   if (!fileE) return;
   const ende = await parseBestandCSV(fileE);

   // Alle Produkte aus beiden CSVs zusammenführen
   const alleProdukte = new Set([...Object.keys(anfang), ...Object.keys(ende)]);

   let zeilen = 0;
   const now = new Date().toLocaleString("de-DE");

   alleProdukte.forEach(product => {
     const a  = anfang[product] || 0;
     const en = ende[product]   || 0;
     const diff = a - en;
     if (diff === 0) return; // kein Verbrauch → weglassen

     const perCase = bottlesPerCase[normalizeKey(product)] || 1;
     const absDiff = Math.abs(diff);
     const boxes   = perCase > 1 ? Math.floor(absDiff / perCase) : 0;
     const bottles = perCase > 1 ? absDiff % perCase             : absDiff;
     const label   = diff > 0 ? "Verbrauch" : "Zuwachs";

     const entry = {
       timestamp:  now,
       product,
       boxes:      diff > 0 ?  boxes   : -boxes,
       bottles:    diff > 0 ?  bottles : -bottles,
       total:      diff > 0 ?  absDiff : -absDiff,
       action:     label,
       purpose:    `Differenz: Anfang ${a} → Ende ${en}`,
       from:       "Berechnung",
       to:         "Berechnung",
       fachschaft: "",
       note:       `Anfang: ${a} Fl. | Ende: ${en} Fl.`,
       contact:    ""
     };
     appendRowFromEntry(entry);
     zeilen++;
   });

   if (zeilen === 0) {
     showStatus("Kein Verbrauch festgestellt – alle Bestände identisch.", "info");
   } else {
     showStatus(`Verbrauchsberechnung: ${zeilen} Produkt(e) eingetragen.`, "success");
   }
 })();
};


  
  /* ============================
   Automatisches Backup (alle 60s)
============================ */

let lastSavedJSON = "";
function autoBackup() {
  const entries = tableToJSON();
  if (entries.length === 0) return;

  const json = JSON.stringify(entries);
  if (json !== lastSavedJSON) {
    localStorage.setItem("warenbewegung_autobackup", json);
    lastSavedJSON = json;
  }
}
setInterval(autoBackup, 60000); // 60 Sekunden


/* ============================
   Warnung beim Verlassen der Seite
============================ */

window.addEventListener("beforeunload", (e) => {
  const entries = tableToJSON();
  const saved = localStorage.getItem("warenbewegung_entries_v1");

  if (entries.length === 0) return; // nichts erfasst → kein Popup

  if (JSON.stringify(entries) !== saved) {
    e.preventDefault();
    e.returnValue = "";
  }
});


/* ============================
   Undo-Funktion für gelöschte Zeilen
============================ */

let undoStack = [];

function deleteRowWithUndo(entry, rowElement) {
  undoStack.push(entry);
  rowElement.remove();
  updateUndoButton();
}

function updateUndoButton() {
  const btn = document.getElementById("undoBtn");
  btn.style.display = undoStack.length > 0 ? "block" : "none";
}

document.getElementById("undoBtn").onclick = () => {
  if (undoStack.length === 0) return;
  const entry = undoStack.pop();
  appendRowFromEntry(entry);
  updateUndoButton();
};


/* ============================
   Druckansicht – sauberer Print-Bereich
============================ */

document.getElementById("printBtn").onclick = () => {
  const purpose   = (document.getElementById("purpose")?.value || "").trim();
  const eventDate = (document.getElementById("event_date")?.value || "").trim();
  const fachschaft= (document.getElementById("fachschaft")?.value || "").trim();
  const action    = (document.getElementById("action")?.value || "").trim();
  const fromLoc   = (document.getElementById("from_location")?.value || "").trim();
  const toLoc     = (document.getElementById("to_location")?.value || "").trim();
  const name      = (document.getElementById("name")?.value || "").trim();
 
  function fmtDate(iso) {
    if (!iso) return "–";
    const [y, m, d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }
 
  const titleParts = ["Zählliste"];
  if (purpose)   titleParts.push(purpose);
  if (eventDate) titleParts.push(fmtDate(eventDate));
  const titleStr = titleParts.join(" – ");
 
  const rows = Array.from(document.querySelectorAll("#list tbody tr"))
    .filter(r => r.style.display !== "none");
 
  const colIdx = [1, 2, 3, 4, 10];
  const tableRows = rows.map(r => {
    const tds = Array.from(r.querySelectorAll("td"));
    return colIdx.map(i => (tds[i]?.textContent || "").trim());
  });
 
  const sigDate = eventDate ? fmtDate(eventDate) : "___________";
 
  // Meta-Felder als HTML-Schnipsel
  const metaItems = [
    fachschaft ? `<span><b>Fachschaft:</b> ${fachschaft}</span>` : "",
    action     ? `<span><b>Aktion:</b> ${action}</span>`         : "",
    fromLoc    ? `<span><b>Von:</b> ${fromLoc}</span>`           : "",
    toLoc      ? `<span><b>Nach:</b> ${toLoc}</span>`            : "",
    purpose    ? `<span><b>Event / Zweck:</b> ${purpose}</span>` : "",
    eventDate  ? `<span><b>Datum:</b> ${fmtDate(eventDate)}</span>` : "",
    name       ? `<span><b>Verantwortlich:</b> ${name}</span>`   : "",
    `<span><b>Druckdatum:</b> ${new Date().toLocaleString("de-DE")}</span>`
  ].filter(Boolean).join("\n");
 
  // Tabellenzeilen
  const tabellenZeilen = tableRows.length
    ? tableRows.map(row =>
        `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
      ).join("\n")
    : `<tr><td colspan="5" style="text-align:center;padding:8px;">Keine Einträge vorhanden</td></tr>`;
 
  // Template laden (oder inline wenn kein fetch möglich)
  const templatePath = "Dokumentenvorlagen/zaehlliste.html"; // Pfad anpassen falls nötig
  // Fallback: Template inline bauen wenn fetch nicht verfügbar
  const templateURL = typeof window._zaehlistenTemplatePath !== "undefined"
    ? window._zaehlistenTemplatePath
    : templatePath;
 
  fetch(templateURL)
    .then(r => {
      if (!r.ok) throw new Error("Template nicht gefunden");
      return r.text();
    })
    .then(tmpl => {
      const filled = tmpl
        .replace(/{{Titel}}/g,               titleStr)
        .replace(/{{DruckDatum}}/g,           new Date().toLocaleString("de-DE"))
        .replace(/{{MetaFelder}}/g,           metaItems)
        .replace(/{{TabellenZeilen}}/g,       tabellenZeilen)
        .replace(/{{VerantwortlichePerson}}/g, name || "_______________________")
        .replace(/{{EventDatum}}/g,           sigDate);
 
      //TML(filled);
      zeigeZaehllistePreview(filled);

    })
    .catch(() => {
      // Fallback: direkt inline drucken (alter Weg mit printArea)
      const html = doPrintFallback(titleStr, metaItems, tabellenZeilen, name, sigDate, fachschaft, action, fromLoc, toLoc, purpose, eventDate, fmtDate, true);
      zeigeZaehllistePreview(html);
    });
};
 
// Hilfsfunktion: HTML in Iframe drucken
function druckeHTML(html) {
  const win = window.open("", "_blank");

  if (!win) {
    alert("Popup blockiert. Bitte Popups erlauben.");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  // Optional: Automatisch fokussieren, damit STRG+P sofort geht
  win.onload = () => {
    win.focus();
  };
}

function zeigeZaehllistePreview(html) {
	  const preview = document.getElementById("rechnungPreview"); 

	  preview.innerHTML = html;
	  // Startet im Ansichtsmodus – Bearbeiten-Button bleibt funktionsfähig
	  preview.setAttribute("contenteditable", "false");
	  preview.style.outline = "";

	  // Titelzeile anpassen
	  const titleEl = document.querySelector("#rechnungModalTitle span:nth-child(2)");
	  if (titleEl) titleEl.textContent = "Zähllisten-Vorschau";

	  // Merken, dass dies eine Zählliste ist (kein Rechnungs-HTML)
	  window.currentRechnungHTML = html;
	  window.currentRechnungFilename = "zaehlliste";

	  // Bearbeiten-Button zurücksetzen (falls vorher im Speichern-Modus)
	  const editBtn = document.getElementById("editRechnungBtn");
	  if (editBtn) {
	    editBtn.textContent = "✏️ Bearbeiten";
	    editBtn.title = "Zählliste bearbeiten";
	    // onclick bleibt enableEditor() aus dem HTML – das funktioniert korrekt
	  }

	  const badge = document.getElementById("rechnungEditBadge");
	  if (badge) badge.style.display = "none";

	  document.getElementById("rechnungPreviewContainer").style.display = "block";
	}



 
// Fallback falls Template-Datei nicht erreichbar
function doPrintFallback(titleStr, metaItems, tabellenZeilen, name, sigDate, fachschaft, action, fromLoc, toLoc, purpose, eventDate, fmtDate) {
  const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"><title>${titleStr}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:Arial,sans-serif; font-size:9pt; color:#000; }
  .page { width:210mm; padding:12mm 14mm 0 14mm; min-height:297mm; display:flex; flex-direction:column; }
  h1 { font-size:13pt; margin-bottom:3mm; }
  .meta { display:grid; grid-template-columns:1fr 1fr; gap:1px 12mm; font-size:8pt; margin-bottom:4mm; padding-bottom:2mm; border-bottom:1px solid #000; }
  .meta b { min-width:90px; display:inline-block; }
  table { width:100%; border-collapse:collapse; font-size:7.5pt; margin-top:3mm; }
  th { background:#e8e8e8; border:1px solid #000; padding:2px 4px; text-align:left; }
  td { border:1px solid #000; padding:2px 4px; vertical-align:top; }
  th:nth-child(1),td:nth-child(1){width:42%} th:nth-child(2),td:nth-child(2){width:10%;text-align:center}
  th:nth-child(3),td:nth-child(3){width:10%;text-align:center} th:nth-child(4),td:nth-child(4){width:10%;text-align:center}
  .sigs { margin-top:12mm; display:grid; grid-template-columns:1fr 1fr; gap:0 20mm; }
  .sig-line { border-bottom:1px solid #000; height:12mm; margin-bottom:2px; }
  .footer { margin-top:auto; padding:2mm 0 3mm; border-top:1px solid #888; font-size:7pt; color:#555; display:flex; justify-content:space-between; }
  .content { flex:1; }
  @page { size:A4 portrait; margin:0; }
</style></head><body>
<div class="page">
  <div class="content">
    <h1>${titleStr}</h1>
    <div class="meta">${metaItems}</div>
    <table>
      <thead><tr><th>Produkt</th><th>Kisten</th><th>Fl.</th><th>Ges.</th><th>Kommentar</th></tr></thead>
      <tbody>${tabellenZeilen}</tbody>
    </table>
    <div class="sigs">
      <div><div class="sig-line"></div><b>Übergabe durch:</b> ${name||"_______________________"}<br><small>Datum: ${sigDate} &nbsp; Unterschrift</small></div>
      <div><div class="sig-line"></div><b>Übernahme durch:</b> _______________________<br><small>Datum: ${sigDate} &nbsp; Unterschrift</small></div>
    </div>
  </div>
  <div class="footer">
    <span>Verfasste Studierendenschaft · Beethovenstraße 1 · 73430 Aalen · Finanzen-VS@hs-aalen.de</span>
    <span>www.vs-hs-aalen.de</span>
  </div>
</div>
</body></html>`;
	return html; // statt druckeHTML(html)
}



document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "s") {
    e.preventDefault();
    saveLocalBtn.click();
  }
  if (e.ctrlKey && e.key.toLowerCase() === "e") {
    e.preventDefault();
    exportExcelBtn.click();
  }
  if (e.ctrlKey && e.key.toLowerCase() === "p") {
    e.preventDefault();
    printBtn.click();
  }
  if (e.ctrlKey && e.key.toLowerCase() === "z") {
	    e.preventDefault();
	    undoBtn.click();
	  }
  if (e.ctrlKey && e.key.toLowerCase() === "m") {
	    e.preventDefault();
	    submitBtn.click();
	  }
  if (e.ctrlKey && e.key.toLowerCase() === ",") {
	    e.preventDefault();
	    exportCsvBtn.click();
	  }
  if (e.ctrlKey && e.key.toLowerCase() === "b") {
	    e.preventDefault();
	    scanBtn.click();
	  }
});








helpBtn.onclick = () => {
  if (helpBox.style.display === "block") {
    helpBox.style.display = "none";   // schließen
  } else {
    helpBox.style.display = "block";  // öffnen
  }
};

helpClose.onclick = () => {
  helpBox.style.display = "none";
};


  // Statusmeldungen
  function showStatus(message, type="success") {
  const box = document.getElementById("statusBox");
  box.textContent = message;
  box.style.display = "block";
  box.style.background = type === "success" ? "#e0ffe0" : "#ffe0e0";

  setTimeout(() => {
    box.style.display = "none";
  }, 5000); // nach 5 Sekunden ausblenden
}
  
  
  
//Initial laden
  loadFavorites();
  filterProducts();
  updateFavButton();
  
	


/* ============================================================
   buildBuchhaltungsData – 3 Spalten: Label | Menge | Kommentar
   ============================================================ */
/* ============================================================
   buildBuchhaltungsData – erzeugt 3-spaltige Struktur passend
   zur Buchhaltungs-Excel (Spalte H=Label, I=Wert):
   Zeilen 1-11: Metablock, Zeile 12-13: leer, Zeile 14+: Produkte
   ============================================================ */
   function buildBuchhaltungsData(entries) {
	   const meta = collectMeta();
	   const heute = new Date().toLocaleDateString("de-DE");

	   // Event-Datum aus dem Formular nutzen, Fallback auf heutiges Datum
	   const eventDateRaw = document.getElementById("event_date")?.value || "";
	   const datumFuerCSV = eventDateRaw
	     ? new Date(eventDateRaw).toLocaleDateString("de-DE")
	     : heute;

	   const contactParts = [
	     meta.name,
	     meta.matrikelnummer ? "Matrikel Nr.: " + meta.matrikelnummer : "",
	     meta.studmail && meta.studmail !== "@studmail.htw-aalen.de" ? meta.studmail : "",
	     meta.ext_contact
	   ].filter(v => v && v.trim() !== "");
	   const contactInfo = contactParts.join(", ");

	   const mengen = {}, notizen = {};
	   entries.forEach(e => {
	     if (!e.product) return;
	     mengen[e.product] = (mengen[e.product] || 0) + (Number(e.total) || 0);
	     if (e.note && e.note.trim()) {
	       if (!notizen[e.product]) notizen[e.product] = new Set();
	       notizen[e.product].add(e.note.trim());
	     }
	   });

	   const rows = [
	     ["Rechnungsnummer", "",                       ""],  // Zeile 1
	     ["Rechnungstyp",    "",                       ""],  // Zeile 2
	     ["Datum",           datumFuerCSV,             ""],  // Zeile 3  
	     ["Veranstalter",    meta.fachschaft || "",    ""],  // Zeile 4
	     ["Kürzel/Code",     "",                       ""],  // Zeile 5
	     ["Event",           meta.purpose || "",       ""],  // Zeile 6
	     ["Kommentar",       meta.note || "",          ""],  // Zeile 7
	     ["Kontakt",         contactInfo,              ""],  // Zeile 8
	     ["Von Bestand",     meta.from_location || "", ""],  // Zeile 9
	     ["Aktion",          meta.action || "",        ""],  // Zeile 10
	     ["Zu Bestand",      meta.to_location || "",   ""],  // Zeile 11
	     [],                                                  // Zeile 12 – leer
	     ["Produkt",         "",        "Kommentar"] // Zeile 13 = Header
	   ];

	   const listeSet = new Set(BESTAND_PRODUKTLISTE);
	   BESTAND_PRODUKTLISTE.forEach(produkt => {
	     const menge = mengen[produkt] || 0;
	     const notiz = notizen[produkt] ? [...notizen[produkt]].join(", ") : "";
	     rows.push([produkt, menge !== 0 ? menge : "", notiz]);
	   });
	   [...new Set(entries.map(e => e.product).filter(p => p && !listeSet.has(p)))].sort()
	     .forEach(produkt => {
	       const menge = mengen[produkt] || 0;
	       rows.push([produkt, menge !== 0 ? menge : "",
	         notizen[produkt] ? [...notizen[produkt]].join(", ") : ""]);
	     });
	   return rows;
	 }





 





  
/*=========================
	Optionsmenü Kram
	======================*/
  
	// Tabs nur für Modi
	document.querySelectorAll("#modeTabs .tab").forEach(btn => {
	  btn.addEventListener("click", () => {
	    const mode = btn.dataset.mode;

	    // Alle Panels schließen
	    document.querySelectorAll(".panel").forEach(p => p.style.display = "none");

	    // normale Logik für Modi
	    applyMode(mode);
	    updatePurposeField();
	  });
	});

	// Options-Button öffnet Modal
	const optionsModal = document.getElementById("optionsModal");
	const optionsOverlay = document.getElementById("optionsOverlay");

	function openOptionsModal() {
	  optionsModal.style.display = "flex";
	  optionsOverlay.style.display = "block";
	}
	function closeOptionsModal() {
	  optionsModal.style.display = "none";
	  optionsOverlay.style.display = "none";
	}

	document.getElementById("optionsBtn").onclick = openOptionsModal;
	document.getElementById("closeOptions").onclick = closeOptionsModal;
	optionsOverlay.addEventListener("click", closeOptionsModal);





	const darkToggle = document.getElementById("darkModeToggle");

	// beim Laden prüfen
	if (localStorage.getItem("theme") === "dark") {
	  document.body.classList.add("darkmode");
	  darkToggle.checked = true;
	}

	darkToggle.addEventListener("change", () => {
	  if (darkToggle.checked) {
	    document.body.classList.add("darkmode");
	    localStorage.setItem("theme", "dark");
	  } else {
	    document.body.classList.remove("darkmode");
	    localStorage.setItem("theme", "light");
	  }
	});


	
		// LocalStorage komplett löschen
		document.getElementById("clearStorageBtn").onclick = () => {
		  localStorage.clear();
		  alert("LocalStorage wurde zurückgesetzt!");
		  loadFavorites();
		  showStatus("LocalStorage des Browsers gelöscht! ", "success");
		};

		// Reset-Button: Favoriten leeren
		document.getElementById("resetFavs").onclick = () => {
		  localStorage.setItem("favorites", JSON.stringify([]));
		  loadFavorites();
		  filterProducts();       // Produktliste neu rendern
		  updateFavButton();      // Stern-Button aktualisieren
		  showStatus("Aktuelle Favoriten entfernt!", "success");
		};

		
		// Standardfavoriten laden
		document.getElementById("loadStandardFavs").onclick = () => {
		  localStorage.setItem("favorites", JSON.stringify(standardFavorites));
		  loadFavorites();
		  filterProducts();
		  updateFavButton();
		  showStatus("Standardliste in Favoriten geladen!", "success");
		};
		
		/* =========================
		   Barcode-Scanner
		========================= */

		const scanBtn = document.getElementById("scanBarcode");
		const video = document.getElementById("camera");
		let scanning = false;

		// Kamera-Erlaubnis
		document.getElementById("requestCameraBtn").onclick = async () => {
		  const statusEl = document.getElementById("cameraPermStatus");
		  try {
		    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
		    stream.getTracks().forEach(t => t.stop());
		    statusEl.style.color = "#2a7";
		    statusEl.textContent = "Kamera-Zugriff erlaubt.";
		  } catch (err) {
		    statusEl.style.color = "#c33";
		    statusEl.textContent = "Zugriff verweigert oder keine Kamera gefunden.";
		  }
		};

		// Barcode normalisieren (führt führende Nullen zusammen)
		function normalizeBarcode(b) {
		  if (!b) return [];
		  if (Array.isArray(b)) return b.map(x => x.replace(/^0+/, ""));
		  return [b.replace(/^0+/, "")];
		}

		// Stabilitäts-Tracking
		let lastCode = null;
		let stableCount = 0;

		scanBtn.onclick = async () => {
		  if (!scanning) {
		    try {
		      const stream = await navigator.mediaDevices.getUserMedia({
		        video: {
		          facingMode: "environment",
		          width: { ideal: 1280 },
		          height: { ideal: 720 }
		        }
		      });

		      video.srcObject = stream;
		      document.getElementById("cameraWrapper").style.display = "block";

		      Quagga.init({
		        inputStream: {
		          type: "LiveStream",
		          target: video,
		          constraints: {
		            facingMode: "environment",
		            width: { ideal: 1280 },
		            height: { ideal: 720 }
		          }
		        },
		        locate: true,
		        numOfWorkers: 2,
		        frequency: 10,
		        decoder: {
		          readers: [
		            "ean_reader",
		            "ean_8_reader",
		            "upc_reader",
		            "upc_e_reader"
		          ],
		          debug: {
		            drawBoundingBox: false,
		            showFrequency: false,
		            drawScanline: false,
		            showPattern: false
		          }
		        }
		      }, err => {
		        if (err) {
		          console.error(err);
		          return;
		        }
		        Quagga.start();
		      });

		      Quagga.onDetected(result => {
		        const raw = result.codeResult.code;
		        const code = raw.replace(/^0+/, "");

		        if (code === lastCode) {
		          stableCount++;
		        } else {
		          lastCode = code;
		          stableCount = 1;
		        }

		        if (stableCount >= 3) {
		          handleBarcode(code);
		        }
		      });

		      scanning = true;
		      scanBtn.textContent = "Scanner stoppen";

		    } catch (err) {
		      alert("Kamera konnte nicht gestartet werden: " + err.message);
		    }

		  } else {
		    stopScanner();
		  }
		};

		// Barcode-Verarbeitung
		function handleBarcode(code) {
		  const data = loadData();
		  const match = data.products.find(p =>
		    normalizeBarcode(p.barcode).includes(code)
		  );

		  if (match) {
		    productSelect.value = match.name;
		    productSearch.value = match.name;
		    showStatus("Produkt erkannt: " + match.name, "success");
		    stopScanner(match.name);
		  } else {
		    showStatus("Unbekannter Barcode: " + code, "error");
		    stopScanner();
		  }
		}

		// Scanner stoppen
		function stopScanner(matchName) {
		  Quagga.stop();
		  const stream = video.srcObject;
		  if (stream) stream.getTracks().forEach(t => t.stop());
		  video.srcObject = null;

		  document.getElementById("cameraWrapper").style.display = "none";
		  scanning = false;
		  scanBtn.textContent = "Barcode scannen";

		  if (matchName) {
		    const oldHint = document.getElementById("scanHint");
		    if (oldHint) oldHint.remove();

		    const hint = document.createElement("div");
		    hint.id = "scanHint";
		    hint.textContent = "✔ Produkt erkannt: " + matchName;
		    hint.style.cssText = `
		      text-align:center;
		      margin:0.5em 0;
		      font-weight:bold;
		      color:#2a7;
		      opacity:1;
		      transition:opacity 0.8s ease;
		    `;
		    video.parentNode.insertAdjacentElement("afterend", hint);

		    const qtyBoxes = document.getElementById("qty_boxes");
		    if (qtyBoxes) qtyBoxes.focus();

		    setTimeout(() => {
		      hint.style.opacity = "0";
		      setTimeout(() => hint.remove(), 800);
		    }, 2000);
		  }

		  lastCode = null;
		  stableCount = 0;
		}

  
  





	
	
const readmeBtn = document.getElementById("ReadMe");

if (readmeBtn) {
  readmeBtn.onclick = async () => {

    // README laden
    const readme = await fetch("./README.md").then(r => r.text());

    // Neues Fenster öffnen
    const newWindow = window.open("", "_blank");

    newWindow.document.write(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>README – Ernas Warenbewegung</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #f5f5f5;
              padding: 20px;
              line-height: 1.5;
              color: #222;
            }
            h1 {
              font-size: 22px;
              margin-bottom: 10px;
            }
            pre {
              white-space: pre-wrap;
              font-family: "Consolas", "Courier New", monospace;
              background: #ffffff;
              padding: 16px;
              border-radius: 8px;
              border: 1px solid #ddd;
              font-size: 14px;
              max-width: 900px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
          </style>
        </head>
        <body>
          <h1>README – Ernas Warenbewegung</h1>
          <pre>${readme.replace(/</g, "&lt;")}</pre>
        </body>
      </html>
    `);

    newWindow.document.close();
  };
}