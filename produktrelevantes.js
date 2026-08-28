//Standardliste definieren
const standardFavorites = [
  "Bayreuther Hell Maisel (0,5L)",
  "Paulaner Spezi (0,5L)",
  "Mineralwasser medium (0,5L)",
  "Mineralwasser naturell (0,5L)",
  "Afri Cola (0,33L)",
  "Afri Cola Zero (0,33L)",
  "Dietz Weinschorle Winzerspritz Weiss/sauer (0,5L)",
  "Dietz Weinschorle Winzerspritz Weiss/süß (0,5L)",
  "ESSE - Sonnenradler (0,5L)",
  "Schorle Joh-Holunder (0,5L)",
  "Maisels Weisse Original (0,5L)",
  "Maisels Weisse *AF (0,5L)",
  "Bluna Orange (0,33L)"
];

/* ============================================================
   FESTE PRODUKTLISTE für Bestandsübersicht / Buchhaltung
   → Neue Produkte hier ergänzen (Reihenfolge wird 1:1 übernommen)
   Wichtig für den Buchhaltungs-CSV Export und vereinfacht den übertrag in die Excel
   ============================================================ */
   
const BESTAND_PRODUKTLISTE = [
  "Absolut Vodka (0,7L)",
  "Absolut Vodka (1L)",
  "Afri Cola (0,33L)",
  "Afri Cola (0,5L) PET",
  "Afri Cola (1L)",
  "Afri Cola Zero (0,33L)",
  "Ananassaft (1L)",
  "Aperol Aperitivo Bitter (1L)",
  "Apfelsaftschorle (0,5L)",
  "Berliner Luft (0,7L)",
  "Berliner Luft (1L)",
  "Bluna (0,5L) PET",
  "Bluna Orange (0,33L)",
  "Burghardt Glühwein Rot (1L)",
  "Coca Cola (1L)",
  "Cranberry Saft",
  "Dietz Weinschorle Winzerspritz Weiss/sauer (0,5L)",
  "Dietz Weinschorle Winzerspritz Weiss/süß (0,5L)",
  "Energy (1,5L)",
  "ESSE - Sonnenradler (0,5L)",
  "Ficken (0,7L)",
  "Frangelico (0,7L)",
  "Früchtepunsch (1 L)",
  "Fürstengold Sekt halbtr. (0,75L)",
  "Gletscherwasser (0,7L)",
  "Glühwein Omegasorg (10L)",
  "Glühwein Winzer v.WB rot",
  "Glühwein Winzer v.WB weiß",
  "Gold Ochsen Keller Radler (0,5L)",
  "Gordons Dry Gin (0,7L)",
  "Gordons Dry Gin (1L)",
  "Havanna 3y (0,7L)",
  "Havanna 3y (1L)",
  "Jägermeister (0,7L)",
  "Jägermeister (1L)",
  "Kinderpunsch (10L)",
  "Limettensaft (1L)",
  "Lillet Blanc (0,75L)",
  "Bayreuther Hell Maisel (0,5L)",
  "Maisels Weisse *AF (0,5L)",
  "Maisels Weisse Original (0,5L)",
  "Mangosaft (1L)",
  "Maracujasaft (1L)",
  "Mineralwasser medium (0,5L)",
  "Mineralwasser naturell (0,5L)",
  "Monin Holunderblütensirup (1L)",
  "Monin Mandelsirup (1L)",
  "Mönchshof Natur-Radler (0,0%) (0,5L)",
  "Orangensaft (1L)",
  "Paulaner Spezi (0,5L)",
  "Pitú (1L)",
  "Rosé, Duo des Plages Cinsault (F) (0,75L)",
  "Rot, Pleno Tempranillo Navarra tr. (Es) (0,75L)",
  "Perlwein, Soligo Al Lungo Bianco Vino Frizzante (0,75L)",
  "Prosecco Doc Treviso, Soligo Vino Frizzante (0,75L)",
  "Rothaus Tannenzäpfle Pils *AF (0,33L)",
  "Saurer Joster (0,7L)",
  "Schorle Joh-Holunder (0,5L)",
  "Schweppes Bitter Lemon (1L)",
  "Schweppes Ginger Ale (1L)",
  "Schweppes Tonic Water (1L)",
  "Schweppes Wild Berry (1L)",
  "Sprite (1L)",
  "Tequila Gold (0,7L)",
  "Tequila Silber (0,7L)",
  "Weiß, Duo des Mers Sauvignon tr. (F) (0,75L)",
  "White Rum Captain Sparrow (0,7L)",
  "Wodka Achmatov (0,7L)",
  "Pfirsich Apéritif - Pêche De Bonheur (0,5L)",
  "Orangenliqeur - Le Favori (0,7L)",
  "Blue Curacao Liqeur - Bols Amsterdam (0,7L)",
  "Stuttgarter Hofbräu Käpsele Helles (0,33L)",
  "Stuttgarter Hofbräu Pilsener (0,5L)",
  "Monin Weißer Rohrzucker (1L)",
  "Monin Lavendelsirup (1L)",
  "Bacardi Carta Blanca (0,7L)",
  "Monin Cocos (1L)",
  "Hacker-Pschorr Naturtrübes Radler Alkoholfrei (0,5L)",
  "Heubacher ISO SCHBORDSFRAIND (0,5L)",
  "Bayreuther Hell Maisel (0,33L)",
  "Bacardi Carta Blanca (1,0L)",
  "Holunderblüten Sambucco",
  "Sirup Grenadine Bols (0,75L)",
  "Sirup Holunderblüte Menz & Gasser (0,75L)",
  "Sirup Grenadine Granatapfel Rigr (0,7L)",
  "Wodka Gorbatchow 37,5% (1L)",
  "Brandy Le Brun 36% (0,7L)",
  "Crushed Ice (2kg)",
  "Monin Genadinesirup (1L)",
  "TK Eiswürfel Servisa (2kg)",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "0",
  "Zusatz / nicht gelistet (Bitte dann in Kommentar Getränkbezeichnung, Gebindemenge und Kategorie eintragen!)"
];

async function loadProductData() {
  const response = await fetch("./produktliste.json");
  return await response.json();
}


(async function initProducts() {
  try {
    const data = await loadProductData();
    console.log("Produktliste geladen:", data);
    loadProductsIntoApp(data.products);
  } catch (err) {
    console.error("Fehler beim Laden der Produktliste:", err);
  }
})();




