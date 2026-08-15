// ---------------------------------------------------------------------------
// disque.js — écriture en temps réel sur disque (File System Access API,
// Chrome/Edge uniquement). N'importe que registry.js et etat.js — jamais
// chat.js, pour éviter une dépendance circulaire (chat appelle des fonctions
// qui, en bout de chaîne, écrivent sur le disque). Les messages à afficher
// passent donc par un callback `onMessage` fourni par l'appelant (hub.js),
// plutôt que par un import direct de chat.js.
// ---------------------------------------------------------------------------
import { MODULES_CONFIG } from './registry.js';
import { etat } from './etat.js';

let dossierHandle = null;

export async function connecterDossier(onMessage) {
  if (!window.showDirectoryPicker) {
    onMessage && onMessage("⚠ Ton navigateur ne permet pas d'écrire des fichiers locaux depuis une page web (fonctionne sur Chrome ou Edge, pas Firefox/Safari).");
    return;
  }
  try {
    dossierHandle = await window.showDirectoryPicker();
    const statut = document.getElementById("statutDossier");
    if (statut) {
      statut.textContent = "📁 Connecté — écriture en temps réel active";
      statut.style.color = "var(--teal)";
    }
    onMessage && onMessage("📁 Dossier connecté. Chaque cycle de chaque module sera désormais écrit sur le disque au fur et à mesure.");
    await ecrireTousLesFichiers();
  } catch (e) {
    // l'utilisateur a annulé la sélection du dossier — rien à faire
  }
}

async function ecrireFichierModule(cfg) {
  if (!dossierHandle) return;
  try {
    const m = etat[cfg.id];
    const donnees = {
      module: cfg.id,
      nom: cfg.nom,
      langue: cfg.lang,
      source_principale: cfg.sourceType,
      source_alternative: cfg.sourceTypeAlt || null,
      cycles_completes: m.cycles,
      derniere_maj: new Date(m.dernierSucces).toISOString(),
      historique: m.historique,
    };
    const fileHandle = await dossierHandle.getFileHandle(`${cfg.id}.json`, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(donnees, null, 2));
    await writable.close();
  } catch (e) {
    console.warn("Écriture disque échouée pour", cfg.id, e);
  }
}

async function ecrireIndex() {
  if (!dossierHandle) return;
  try {
    const resume = MODULES_CONFIG.map((cfg) => ({
      id: cfg.id, nom: cfg.nom, cycles: etat[cfg.id].cycles, derniere_maj: new Date(etat[cfg.id].dernierSucces).toISOString(),
    }));
    const fileHandle = await dossierHandle.getFileHandle("index.json", { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify({ mis_a_jour: new Date().toISOString(), modules: resume }, null, 2));
    await writable.close();
  } catch (e) {
    console.warn("Écriture de index.json échouée", e);
  }
}

async function ecrireTousLesFichiers() {
  for (const cfg of MODULES_CONFIG) await ecrireFichierModule(cfg);
  await ecrireIndex();
}

// Appelée après chaque cycle réussi (veille ou focus) d'un module donné —
// ne fait rien si aucun dossier n'est connecté.
export function synchroniserDisque(cfg) {
  if (!dossierHandle) return;
  ecrireFichierModule(cfg);
  ecrireIndex();
}
