// ---------------------------------------------------------------------------
// rendu.js — génère le HTML des cartes et des statistiques. N'importe que
// registry.js, etat.js et utils.js : jamais router.js, chat.js ou markov.js.
//
// Important : les boutons des cartes (Arrêter/Relancer/Générer) n'utilisent
// PAS onclick="..." — avec des modules ES, les fonctions déclarées dans un
// fichier ne sont plus globales (contrairement à un <script> classique), donc
// onclick="arreterModule(...)" échouerait silencieusement. On pose plutôt des
// attributs data-action / data-id, et c'est hub.js qui écoute les clics sur
// la grille et redirige vers la bonne fonction (délégation d'événements).
// ---------------------------------------------------------------------------
import { MODULES_CONFIG, SOURCES, ETAPES_FOCUS, SEUIL_GENERATION } from './registry.js';
import { etat } from './etat.js';
import { formatRelatif, tronquer } from './utils.js';

export function render() {
  const actifs = MODULES_CONFIG.filter((m) => etat[m.id].mode === "veille").length;
  const enFocus = MODULES_CONFIG.filter((m) => etat[m.id].mode === "focus").length;
  const arretes = MODULES_CONFIG.filter((m) => etat[m.id].mode === "arret").length;
  const cyclesTotal = MODULES_CONFIG.reduce((s, m) => s + etat[m.id].cycles, 0);

  const sousTitre = document.getElementById("sousTitre");
  if (sousTitre) sousTitre.textContent = `${MODULES_CONFIG.length} modules, 4 sources publiques : Wikipédia, Wikisource, Wiktionnaire, Gutendex.`;

  const stats = document.getElementById("stats");
  if (stats) {
    stats.innerHTML = `
      <span><b style="color:var(--teal)">${actifs}</b> en veille</span>
      <span><b style="color:var(--amber)">${enFocus}</b> en focus</span>
      <span><b style="color:var(--rust)">${arretes}</b> arrêtés</span>
      <span>${cyclesTotal} cycles cumulés</span>`;
  }

  const grid = document.getElementById("grid");
  if (!grid) return;

  grid.innerHTML = MODULES_CONFIG.map((cfg) => {
    const m = etat[cfg.id];
    const couleur = m.mode === "focus" ? "var(--amber)" : m.mode === "arret" ? "var(--rust)" : "var(--teal)";
    const label = m.mode === "focus" ? "Focus" : m.mode === "arret" ? "Arrêté" : "Veille";
    const sourcesTexte = cfg.sourceTypeAlt ? `${SOURCES[cfg.sourceType].label} · ${SOURCES[cfg.sourceTypeAlt].label}` : SOURCES[cfg.sourceType].label;

    const corps = m.mode === "focus" ? `
      <div class="focus-progress">◌ ${ETAPES_FOCUS[m.etapeIndex]}</div>
      <div class="focus-query">« ${tronquer(m.requeteEnCours, 60)} »</div>
      <div class="progress-track"><div class="progress-fill" style="width:${((m.etapeIndex + 1) / ETAPES_FOCUS.length) * 100}%"></div></div>
    ` : `
      <div class="log-zone">
        ${m.log.length === 0
          ? `<div class="empty-log">En attente du premier cycle d'apprentissage…</div>`
          : m.log.map((e) => `
            <div class="log-entry">
              <div>
                <span class="badge ${e.origine === "focus" ? "badge-focus" : "badge-veille"}">${e.origine}</span>
                <span class="badge badge-source">${(SOURCES[e.source] && SOURCES[e.source].tag) || "?"}</span>
                <span class="log-titre">${e.titre}</span>
              </div>
              <div class="log-extrait">${e.extrait}</div>
            </div>`).join("")}
      </div>`;

    const boutonAction = m.mode === "arret"
      ? `<button class="action-btn relancer" data-action="relancer" data-id="${cfg.id}">▶ Relancer</button>`
      : `<button class="action-btn arreter" data-action="arreter" data-id="${cfg.id}" ${m.mode === "focus" ? "disabled" : ""}>■ Arrêter</button>`;

    const boutonGenerer = m.historique.length >= SEUIL_GENERATION
      ? `<button class="action-btn" style="color:var(--rust)" data-action="generer" data-id="${cfg.id}">🎲 Générer</button>`
      : "";

    return `
      <div class="card">
        <div class="card-head">
          <div class="card-head-left">
            <div class="glyphe" style="font-family:${cfg.police};color:${couleur}">${cfg.glyphe}</div>
            <div>
              <div class="nom" style="font-family:${cfg.police}">${cfg.nom}</div>
              <div class="meta">${sourcesTexte} · ${m.cycles} cycles</div>
            </div>
          </div>
          <div class="statut" style="color:${couleur}">
            <span class="dot ${m.mode !== "arret" ? "pulse" : ""}" style="background:${couleur}"></span>${label}
          </div>
        </div>
        <div class="card-body">
          ${corps}
          <div class="card-foot">
            <span class="timestamp">● ${formatRelatif(m.dernierSucces)}</span>
            <div style="display:flex;gap:6px;">${boutonGenerer}${boutonAction}</div>
          </div>
        </div>
      </div>`;
  }).join("");
}
