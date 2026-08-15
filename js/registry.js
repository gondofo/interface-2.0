// ---------------------------------------------------------------------------
// registry.js — le registre central. Toute la configuration des modules et
// des sources publiques vit ici, et seulement ici. Aucun autre fichier ne
// doit importer un autre fichier que celui-ci pour connaître cette liste.
// ---------------------------------------------------------------------------

export const SOURCES = {
  wikipedia: { label: "Wikipédia", tag: "wp" },
  wikisource: { label: "Wikisource", tag: "ws" },
  wiktionary: { label: "Wiktionnaire", tag: "wt" },
  gutendex: { label: "Gutendex", tag: "gb" },
};

// Tableau mutable : les nouveaux modules créés depuis le formulaire viennent
// s'y ajouter au fil de la session (voir modules-dynamiques.js).
export const MODULES_CONFIG = [
  { id: "maths", nom: "Mathématiques", glyphe: "∑", police: "'Spectral', serif", lang: "fr", sourceType: "wikipedia",
    themes: ["algèbre", "théorème", "géométrie", "probabilités", "analyse mathématique", "topologie"] },
  { id: "francais", nom: "Langue française", glyphe: "Fr", police: "'Spectral', serif", lang: "fr", sourceType: "wikipedia",
    themes: ["grammaire française", "conjugaison", "syntaxe", "linguistique"] },
  { id: "vocabulaire", nom: "Vocabulaire", glyphe: "Abc", police: "'JetBrains Mono', monospace", lang: "fr", sourceType: "wiktionary",
    themes: ["étymologie", "synonyme", "expression idiomatique", "dictionnaire", "néologisme"] },
  { id: "arabe", nom: "اللغة العربية", glyphe: "ع", police: "'Noto Naskh Arabic', serif", lang: "ar", sourceType: "wikipedia", sourceTypeAlt: "wikisource",
    themes: ["نحو عربي", "أدب عربي", "شعر", "بلاغة", "لغة عربية"] },
  { id: "mandarin", nom: "中文", glyphe: "文", police: "'Noto Serif SC', serif", lang: "zh", sourceType: "wikipedia",
    themes: ["汉语语法", "中国文学", "汉字", "诗歌", "语言学"] },
  { id: "code", nom: "Programmation", glyphe: "λ", police: "'JetBrains Mono', monospace", lang: "en", sourceType: "wikipedia",
    themes: ["algorithm", "programming language", "data structure", "software architecture", "compiler"] },
  { id: "litterature", nom: "Littérature", glyphe: "§", police: "'Spectral', serif", lang: "fr", sourceType: "wikisource", sourceTypeAlt: "gutendex",
    themes: ["roman", "poésie", "théâtre", "conte", "nouvelle"] },
  { id: "histoire", nom: "Histoire", glyphe: "Ω", police: "'Spectral', serif", lang: "fr", sourceType: "wikipedia", sourceTypeAlt: "wikisource",
    themes: ["histoire médiévale", "révolution française", "empire romain", "guerre mondiale", "traité historique"] },
  { id: "sciences", nom: "Sciences", glyphe: "⚛", police: "'Spectral', serif", lang: "fr", sourceType: "wikipedia",
    themes: ["physique quantique", "biologie cellulaire", "astronomie", "chimie organique", "évolution"] },
  { id: "philosophie", nom: "Philosophie", glyphe: "Φ", police: "'Spectral', serif", lang: "fr", sourceType: "wikisource", sourceTypeAlt: "wikipedia",
    themes: ["éthique", "métaphysique", "stoïcisme", "existentialisme", "épistémologie"] },
];

export const ETAPES_FOCUS = ["Recherche initiale", "Approfondissement", "Recoupement des sources", "Synthèse finale"];
export const HISTORIQUE_MAX = 200; // entrées conservées en mémoire par module avant export
export const SEUIL_GENERATION = 12; // cycles minimum avant de pouvoir générer une phrase (markov.js)
