// ---------------------------------------------------------------------------
// modules-dynamiques.js — création de modules à la volée depuis le
// formulaire "+ Ajouter un module". Rien n'importe ce fichier en retour
// (seul hub.js l'utilise), donc il peut librement importer chat.js et
// router.js sans créer de cycle.
// ---------------------------------------------------------------------------
import { MODULES_CONFIG } from './registry.js';
import { etat, creerEtatModule } from './etat.js';
import { cycleVeille } from './router.js';
import { ajouterBulleSysteme } from './chat.js';
import { render } from './rendu.js';

export function ajouterModule() {
  const champNom = document.getElementById("champNom");
  const champGlyphe = document.getElementById("champGlyphe");
  const champLang = document.getElementById("champLang");
  const champSource = document.getElementById("champSource");
  const champThemes = document.getElementById("champThemes");

  const nom = champNom.value.trim();
  const glyphe = champGlyphe.value.trim() || nom.slice(0, 2).toUpperCase();
  const lang = champLang.value.trim().toLowerCase() || "fr";
  const sourceType = champSource.value;
  const themes = champThemes.value.split(",").map((t) => t.trim()).filter(Boolean);

  if (!nom || themes.length === 0) {
    ajouterBulleSysteme("⚠ Nom et thèmes de veille sont obligatoires pour créer un module.");
    return;
  }

  const id = "m_" + nom.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_") + "_" + Date.now().toString(36);
  const cfg = { id, nom, glyphe, police: "'Spectral', serif", lang, sourceType, themes };
  MODULES_CONFIG.push(cfg);
  etat[id] = creerEtatModule();

  champNom.value = "";
  champGlyphe.value = "";
  champLang.value = "";
  champThemes.value = "";
  document.getElementById("panelAjout").classList.remove("ouvert");

  ajouterBulleSysteme(`✓ Module « ${nom} » créé et mis en veille.`);
  render();
  setTimeout(() => cycleVeille(id), 500);
}
