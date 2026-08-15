// ---------------------------------------------------------------------------
// hub.js — point d'entrée. C'est le SEUL fichier que index.html charge
// directement (<script type="module" src="js/hub.js">). Il importe tout ce
// dont il a besoin et branche les boutons — rien n'importe hub.js en retour,
// donc il peut se permettre de tout connaître sans jamais créer de cycle.
// ---------------------------------------------------------------------------
import { MODULES_CONFIG } from './registry.js';
import { etat } from './etat.js';
import { render } from './rendu.js';
import { cycleVeille, arreterModule, relancerModule } from './router.js';
import { ajouterBulleHub, envoyerMessage } from './chat.js';
import { genererDepuisModule } from './markov.js';
import { connecterDossier } from './disque.js';
import { exporterMemoire } from './export.js';
import { ajouterModule } from './modules-dynamiques.js';

// Ré-import ciblé pour le message d'après-export (évite un import dupliqué
// inutile : ajouterBulleSysteme vient du même chat.js déjà importé plus haut
// pour ajouterBulleHub).
import { ajouterBulleSysteme } from './chat.js';

function init() {
  document.getElementById("btnEnvoyer").addEventListener("click", envoyerMessage);
  document.getElementById("chatTexte").addEventListener("keydown", (e) => { if (e.key === "Enter") envoyerMessage(); });

  document.getElementById("btnToggleAjout").addEventListener("click", () => {
    document.getElementById("panelAjout").classList.toggle("ouvert");
  });
  document.getElementById("btnAnnulerAjout").addEventListener("click", () => {
    document.getElementById("panelAjout").classList.remove("ouvert");
  });
  document.getElementById("btnValiderAjout").addEventListener("click", ajouterModule);

  document.getElementById("btnExporter").addEventListener("click", () => exporterMemoire(ajouterBulleSysteme));
  document.getElementById("btnConnecterDossier").addEventListener("click", () => connecterDossier(ajouterBulleSysteme));

  // Délégation d'événements : un seul écouteur sur la grille entière plutôt
  // que d'attacher un onclick à chaque bouton de chaque carte (impossible
  // de toute façon avec des modules ES — voir la note dans rendu.js).
  document.getElementById("grid").addEventListener("click", (e) => {
    const bouton = e.target.closest("[data-action]");
    if (!bouton) return;
    const { action, id } = bouton.dataset;
    if (action === "arreter") arreterModule(id);
    else if (action === "relancer") relancerModule(id);
    else if (action === "generer") genererDepuisModule(id);
  });

  MODULES_CONFIG.forEach((m, i) => {
    etat[m.id].timeoutId = setTimeout(() => cycleVeille(m.id), i * 700);
  });

  ajouterBulleHub("Bonjour ! Tape « bonjour » pour tester, ou pose une vraie question — je transmets aux modules concernés.");

  render();
  setInterval(render, 1000); // rafraîchit les temps relatifs ("il y a Xs") en continu
}

init();
