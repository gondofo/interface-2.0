// ---------------------------------------------------------------------------
// etat.js — l'état vivant de chaque module (mode, cycles, historique...).
// N'importe que registry.js. Tout le reste du projet lit et modifie cet
// objet `etat` en important cette même référence (les modules ES partagent
// la même instance d'un objet exporté — pas de copie).
// ---------------------------------------------------------------------------
import { MODULES_CONFIG } from './registry.js';

export const etat = {};

export function creerEtatModule() {
  return {
    mode: "veille",
    stopped: false,
    cycles: 0,
    dernierPing: Date.now(),
    dernierSucces: Date.now(),
    log: [],
    historique: [],
    requeteEnCours: null,
    etapeIndex: 0,
    timeoutId: null,
  };
}

MODULES_CONFIG.forEach((m) => { etat[m.id] = creerEtatModule(); });
