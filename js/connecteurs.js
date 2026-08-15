// ---------------------------------------------------------------------------
// connecteurs.js — tous les appels réseau vers les sources publiques.
// N'importe rien du projet : uniquement des paramètres passés par l'appelant.
// C'est le fichier à modifier si tu ajoutes un jour une nouvelle source
// (Wikiquote, une API météo, etc.) — le reste du projet n'a pas besoin de
// savoir comment chaque source répond, seulement ce qu'obtenirConnaissance()
// renvoie.
// ---------------------------------------------------------------------------

// Route unique valable sur tous les projets Wikimedia (wikipedia, wikisource,
// wiktionary) et toutes les langues : recherche puis extrait en texte brut.
async function viaProjetWikimedia(projet, lang, motCle) {
  const urlRecherche = `https://${lang}.${projet}.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(motCle)}&srlimit=8&format=json&origin=*`;
  const res = await fetch(urlRecherche);
  if (!res.ok) throw new Error("recherche indisponible");
  const data = await res.json();
  const resultats = ((data && data.query && data.query.search) || []).filter((r) => !r.title.includes(":"));
  if (resultats.length === 0) throw new Error("aucun résultat");
  const titre = resultats[Math.floor(Math.random() * resultats.length)].title;

  const urlExtrait = `https://${lang}.${projet}.org/w/api.php?action=query&titles=${encodeURIComponent(titre)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
  const res2 = await fetch(urlExtrait);
  if (!res2.ok) throw new Error("extrait indisponible");
  const data2 = await res2.json();
  const pages = (data2 && data2.query && data2.query.pages) || {};
  const page = Object.values(pages)[0];
  const extrait = page && page.extract ? page.extract.trim() : "";
  return { titre, extrait: extrait || "(page trouvée, mais sans extrait exploitable)" };
}

async function viaGutendex(lang, motCle) {
  const url = `https://gutendex.com/books?search=${encodeURIComponent(motCle)}&languages=${lang}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("catalogue indisponible");
  const data = await res.json();
  const resultats = data.results || [];
  if (resultats.length === 0) throw new Error("aucun résultat");
  const livre = resultats[Math.floor(Math.random() * resultats.length)];
  const auteurs = (livre.authors || []).map((a) => a.name).join(", ") || "auteur inconnu";
  const sujets = (livre.subjects || []).slice(0, 2).join(" · ");
  return { titre: livre.title, extrait: `${auteurs}${sujets ? " — " + sujets : ""} (catalogue, texte non rapatrié)` };
}

// Point d'entrée unique utilisé par le reste du projet — bascule vers le bon
// connecteur selon cfg.sourceType (avec alternance aléatoire si sourceTypeAlt
// est défini).
export async function obtenirConnaissance(cfg, motCleForce) {
  const type = cfg.sourceTypeAlt && Math.random() < 0.5 ? cfg.sourceTypeAlt : cfg.sourceType;
  const motCle = motCleForce || cfg.themes[Math.floor(Math.random() * cfg.themes.length)];
  let resultat;
  if (type === "wikipedia") resultat = await viaProjetWikimedia("wikipedia", cfg.lang, motCle);
  else if (type === "wikisource") resultat = await viaProjetWikimedia("wikisource", cfg.lang, motCle);
  else if (type === "wiktionary") resultat = await viaProjetWikimedia("wiktionary", cfg.lang, motCle);
  else if (type === "gutendex") resultat = await viaGutendex(cfg.lang, motCle);
  else throw new Error("source inconnue");
  return Object.assign({}, resultat, { source: type });
}
