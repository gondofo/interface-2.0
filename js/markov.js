// ---------------------------------------------------------------------------
// markov.js — génération de phrases par chaîne de Markov. PAS de l'IA, PAS
// de la compréhension : on découpe en mots ce qu'un module a réellement
// appris (son historique) et on construit une table "après ce mot vient tel
// autre mot, statistiquement". Générer une phrase = partir d'un mot au
// hasard et suivre les enchaînements observés. Le résultat est souvent
// grammaticalement bancal — c'est la limite honnête de la méthode.
//
// Importe chat.js pour pousser ses résultats dans le même fil de discussion
// (markov.js -> chat.js, sens unique : chat.js n'importe jamais markov.js).
// ---------------------------------------------------------------------------
import { etat } from './etat.js';
import { MODULES_CONFIG, SEUIL_GENERATION } from './registry.js';
import { messagesChat, renderChat, ajouterBulleSysteme } from './chat.js';

function construireChaineMarkov(corpusTexte) {
  const mots = corpusTexte.split(/\s+/).map((m) => m.trim()).filter((m) => m.length > 0);
  const chaine = {};
  for (let i = 0; i < mots.length - 1; i++) {
    const cle = mots[i];
    if (!chaine[cle]) chaine[cle] = [];
    chaine[cle].push(mots[i + 1]);
  }
  return { chaine, mots };
}

function genererPhraseMarkov(chaine, mots, longueur) {
  if (mots.length === 0) return "";
  let motCourant = mots[Math.floor(Math.random() * mots.length)];
  const resultat = [motCourant];
  for (let i = 0; i < longueur; i++) {
    const suivants = chaine[motCourant];
    if (!suivants || suivants.length === 0) break;
    motCourant = suivants[Math.floor(Math.random() * suivants.length)];
    resultat.push(motCourant);
  }
  return resultat.join(" ");
}

export function genererDepuisModule(id) {
  const cfg = MODULES_CONFIG.find((m) => m.id === id);
  const m = etat[id];
  if (!cfg || !m) return;

  if (m.historique.length < SEUIL_GENERATION) {
    ajouterBulleSysteme(`⏳ ${cfg.nom} n'a pas encore assez appris pour générer une phrase seul (${m.historique.length}/${SEUIL_GENERATION} cycles). Laisse-le tourner plus longtemps.`);
    return;
  }

  const corpus = m.historique.map((e) => e.extrait).join(" ");
  const { chaine, mots } = construireChaineMarkov(corpus);
  const phrase = genererPhraseMarkov(chaine, mots, 24);

  messagesChat.push({ type: "generation", cfg, texte: phrase || "(pas assez de matière pour générer quoi que ce soit)", ts: Date.now() });
  renderChat();
}
