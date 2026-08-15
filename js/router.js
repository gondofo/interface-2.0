// ---------------------------------------------------------------------------
// router.js — décide qui apprend quoi, et quand. C'est le fichier à modifier
// le jour où tu veux qu'une question ne réveille QUE le module concerné au
// lieu de tous les modules (il suffirait de changer le filtre dans
// lancerFocusCollectif ci-dessous).
//
// Règle de dépendance importante : router.js n'importe JAMAIS chat.js.
// chat.js importe router.js (pour lancer une recherche), donc si router.js
// importait chat.js en retour, on aurait un cycle d'imports. La solution :
// lancerFocusModule/lancerFocusCollectif reçoivent des callbacks
// (onResultat, onStatus) fournis par l'appelant plutôt que d'aller chercher
// eux-mêmes les fonctions d'affichage du chat.
// ---------------------------------------------------------------------------
import { MODULES_CONFIG, ETAPES_FOCUS, HISTORIQUE_MAX } from './registry.js';
import { etat } from './etat.js';
import { obtenirConnaissance } from './connecteurs.js';
import { synchroniserDisque } from './disque.js';
import { render } from './rendu.js';
import { tronquer } from './utils.js';

export async function cycleVeille(id) {
  const cfg = MODULES_CONFIG.find((m) => m.id === id);
  const m = etat[id];
  if (!cfg || !m || m.stopped || m.mode !== "veille") return;

  m.dernierPing = Date.now();
  try {
    const r = await obtenirConnaissance(cfg);
    if (m.stopped || m.mode !== "veille") return;
    m.cycles += 1;
    m.dernierSucces = Date.now();
    const entree = { origine: "veille", source: r.source, titre: r.titre, extrait: tronquer(r.extrait, 120), ts: Date.now() };
    m.log.unshift(entree);
    m.log = m.log.slice(0, 4);
    m.historique.unshift(entree);
    m.historique = m.historique.slice(0, HISTORIQUE_MAX);
    synchroniserDisque(cfg);
    render();
  } catch (e) {
    // échec silencieux, on retentera au prochain cycle
  }

  if (!m.stopped && m.mode === "veille") {
    const delai = 7000 + Math.random() * 6000;
    m.timeoutId = setTimeout(() => cycleVeille(id), delai);
  }
}

export function arreterModule(id) {
  const m = etat[id];
  m.stopped = true;
  m.mode = "arret";
  clearTimeout(m.timeoutId);
  render();
}

export function relancerModule(id) {
  const m = etat[id];
  m.stopped = false;
  m.mode = "veille";
  render();
  cycleVeille(id);
}

// Focus d'UN module sur une requête donnée. `onResultat(cfg, titre, extrait,
// source)` est appelé à la fin — c'est l'appelant (chat.js) qui décide quoi
// en faire (ex : afficher une bulle dans le chat).
export async function lancerFocusModule(cfg, requete, onResultat) {
  const id = cfg.id;
  const m = etat[id];
  clearTimeout(m.timeoutId);
  m.mode = "focus";
  m.requeteEnCours = requete;
  m.etapeIndex = 0;
  render();

  let dernierTitre = requete, dernierExtrait = "", dernierSource = cfg.sourceType;

  for (let etape = 0; etape < ETAPES_FOCUS.length; etape++) {
    m.etapeIndex = etape;
    render();
    try {
      const motCle = etape === 0 ? requete : `${requete} ${cfg.themes[etape % cfg.themes.length]}`;
      const r = await obtenirConnaissance(cfg, motCle);
      dernierTitre = r.titre; dernierExtrait = r.extrait; dernierSource = r.source;
    } catch (e) {
      // une étape peut échouer sans interrompre le cycle de ce module
    }
    await new Promise((res) => setTimeout(res, 400 + Math.random() * 400));
  }

  m.cycles += 1;
  m.dernierSucces = Date.now();
  m.requeteEnCours = null;
  const entree = { origine: "focus", source: dernierSource, titre: dernierTitre, extrait: tronquer(dernierExtrait, 150), requete, ts: Date.now() };
  m.log.unshift(entree);
  m.log = m.log.slice(0, 4);
  m.historique.unshift(entree);
  m.historique = m.historique.slice(0, HISTORIQUE_MAX);
  synchroniserDisque(cfg);
  m.mode = "veille";
  render();

  if (onResultat) onResultat(cfg, dernierTitre, dernierExtrait, dernierSource);
  cycleVeille(id);
}

// Focus COLLECTIF : tous les modules actifs (non arrêtés) reçoivent la même
// question et partent en focus simultanément, chacun dans son domaine.
// `onStatus(texte)` pour les messages d'état, `onResultat(...)` relayé à
// chaque lancerFocusModule.
export async function lancerFocusCollectif(requete, onStatus, onResultat) {
  const cibles = MODULES_CONFIG.filter((cfg) => etat[cfg.id].mode !== "arret");
  if (cibles.length === 0) {
    if (onStatus) onStatus("Tous les modules sont arrêtés — relance-en au moins un pour obtenir une réponse.");
    return;
  }
  if (onStatus) onStatus(`🔎 ${cibles.length} module(s) planchent sur ta question…`);
  await Promise.allSettled(cibles.map((cfg) => lancerFocusModule(cfg, requete, onResultat)));
}
