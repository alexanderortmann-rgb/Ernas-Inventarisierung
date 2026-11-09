/* ============================================================
   Produktdaten laden – Single Source of Truth ist produktliste.json
   ============================================================ */

   async function loadProductData() {
     const r = await fetch("./produktliste.json");
     if (!r.ok) throw new Error("produktliste.json nicht gefunden");
     return await r.json();
   }

let PRODUCT_DATA = null;

/* ============================================================
   Standardfavoriten – abgeleitet aus favorite:true
   (früher: handgepflegte standardFavorites-Liste)
   ============================================================ */

let standardFavorites = [];

/* ============================================================
   BESTAND_PRODUKTLISTE – feste Reihenfolge für Buchhaltungs-CSV
   Wird beim Laden aus produktliste.json generiert.
   Reihenfolge: nach Hauptkategorie (in der Reihenfolge von
   `categories`), innerhalb der Kategorie alphabetisch.
   ============================================================ */

let BESTAND_PRODUKTLISTE = [];

/* ============================================================
   Zentrale Init: lädt JSON, füllt alle abgeleiteten Listen
   ============================================================ */

   (async function initProducts() {
     try {
       PRODUCT_DATA = await loadProductData();
       console.log("Produktliste geladen:", PRODUCT_DATA);

       // Favoriten: favorite:true
       standardFavorites = PRODUCT_DATA.products
         .filter(p => p.favorite === true)
         .map(p => p.name);

       // Buchhaltung: buchhaltung:true, in JSON-Reihenfolge
       // → das ist die feste, stabile Zeilenreihenfolge für die Excel
       BESTAND_PRODUKTLISTE = PRODUCT_DATA.products
         .filter(p => p.buchhaltung === true)
         .map(p => p.name);

       console.log(`Buchhaltungsliste: ${BESTAND_PRODUKTLISTE.length} Produkte`);

       // In die App laden
       loadProductsIntoApp(PRODUCT_DATA.products);

     } catch (err) {
       console.error("Fehler beim Laden der Produktliste:", err);
       loadProductsIntoApp([]);
     }
   })();

/* ============================================================
   Hilfsfunktion: erzeugt die flache, kategorisierte Produktliste
   für den Buchhaltungs-CSV-Export.
   ============================================================ */
/*
function buildBestandsliste(data) {
  const catOrder = data.categories || [];
  const products  = data.products   || [];

  // Hauptkategorie = erster Eintrag in category
  const mainCat = p => Array.isArray(p.category) ? p.category[0] : p.category;

  // Gruppieren
  const groups = {};
  products.forEach(p => {
    const cat = mainCat(p) || "Sonstiges";
    (groups[cat] ??= []).push(p.name);
  });

  // Reihenfolge: erst Kategorien in catOrder, dann Rest alphabetisch
  const orderedCats = [
    ...catOrder.filter(c => groups[c]),
    ...Object.keys(groups).filter(c => !catOrder.includes(c)).sort()
  ];

  // Flach machen, innerhalb der Kategorie alphabetisch
  return orderedCats.flatMap(cat => groups[cat].sort((a, b) => a.localeCompare(b, "de")));
}

*/
