// ---------------------------------------------------------------------------
// chat.js — tout ce qui touche au panneau de discussion. Importe router.js
// pour déclencher les recherches (chat.js -> router.js, sens unique : router
// n'importe jamais chat.js en retour, voir la note dans router.js).
// ---------------------------------------------------------------------------
import { MODULES_CONFIG, SOURCES } from './registry.js';
import { etat } from './etat.js';
import { echapperHtml, normaliser, auHasard } from './utils.js';
import { lancerFocusCollectif } from './router.js';

// Exporté (pas juste interne) car markov.js pousse aussi des messages ici
// pour afficher ses générations dans le même fil de discussion.
export const messagesChat = [];

// Chaque règle : un test sur le texte normalisé, et une liste de réponses
// possibles (une est tirée au hasard pour éviter l'effet "robot répétitif").
// Ce n'est pas de l'apprentissage — une liste de correspondances texte →
// réponse, évaluée dans l'ordre, la première qui correspond gagne.
function reponseSalutation(texte) {
  const t = normaliser(texte);
  const actifs = MODULES_CONFIG.filter((m) => etat[m.id].mode !== "arret").length;
  const enFocus = MODULES_CONFIG.filter((m) => etat[m.id].mode === "focus").length;
  const cyclesTotal = MODULES_CONFIG.reduce((s, m) => s + etat[m.id].cycles, 0);

  const regles = [
    {
      test: /^(bonjour|salut|bonsoir|coucou|hello|hey|yo|bjr)\b/,
      reponses: [
        `Bonjour ! ${actifs} modules sont actifs en ce moment (${cyclesTotal} cycles cumulés). Pose-moi une vraie question et je les mets tous au travail.`,
        `Salut ! Les modules tournent en arrière-plan depuis un moment — ${cyclesTotal} cycles jusqu'ici. Une question à leur poser ?`,
      ],
    },
    { test: /merci/, reponses: ["Avec plaisir !", "De rien, autre chose ?", "Content d'avoir aidé."] },
    {
      test: /(ca va|comment vas tu|comment allez vous|comment tu vas)/,
      reponses: [
        `Tout tourne normalement de mon côté — ${cyclesTotal} cycles cumulés jusqu'ici. Et toi ?`,
        `${enFocus > 0 ? enFocus + " module(s) en plein focus là, ça chauffe un peu" : "Calme plat, tout le monde est en veille"}. Et de ton côté ?`,
      ],
    },
    { test: /(au revoir|a bientot|bye|a plus|a la prochaine)/, reponses: ["À bientôt — les modules continuent d'apprendre même quand tu n'es pas là.", "À plus tard !"] },
    {
      test: /^(qui es tu|qui es-tu|tu es qui|c'est quoi ce truc|c'est quoi cette interface)/,
      reponses: ["Je suis le hub qui supervise les modules — pas une IA générative. Je relaie tes questions à des modules qui cherchent de vraies informations sur Wikipédia, Wikisource, Wiktionnaire et Gutendex."],
    },
    {
      test: /^(aide|aide moi|help|comment ca marche|comment utiliser|mode d'emploi)/,
      reponses: ["Tape une question et j'interroge tous les modules actifs en même temps, chacun dans son domaine. Tu peux aussi arrêter/relancer un module dans les cartes en dessous, ou en ajouter un nouveau avec le bouton en haut."],
    },
    {
      test: /^(je ne comprends pas|comprend pas|repete|recommence|quoi|hein|pardon)\b/,
      reponses: ["Pas de souci — reformule ta question ou pose-la autrement, je réessaie avec les modules."],
    },
    { test: /(quoi de neuf|des nouvelles|du nouveau)/, reponses: [`Depuis le début : ${cyclesTotal} cycles cumulés sur ${MODULES_CONFIG.length} modules. Rien de spectaculaire, juste de la veille continue.`] },
    { test: /^(bravo|excellent|super|genial|cool|nice|impressionnant)/, reponses: ["Merci ! Ce sont surtout les modules qui font le travail.", "Content que ça te plaise."] },
    { test: /(ca marche pas|ca ne marche pas|bug|erreur|probleme|plante)/, reponses: ["Regarde la console du navigateur (F12) pour voir l'erreur exacte, ou vérifie qu'un module n'est pas resté bloqué en focus — un bouton Arrêter/Relancer est disponible sur chaque carte."] },
    { test: /^(oui|ok|d'accord|daccord|entendu|parfait|top)$/, reponses: ["👍", "C'est noté."] },
    { test: /^(non|pas vraiment|non merci)$/, reponses: ["D'accord, dis-moi si tu changes d'avis."] },
  ];

  for (const regle of regles) {
    if (regle.test.test(t)) return auHasard(regle.reponses);
  }
  return null; // pas une phrase reconnue → traité comme une vraie question pour les modules
}

export function ajouterBulleUtilisateur(texte) {
  messagesChat.push({ type: "moi", texte, ts: Date.now() });
  renderChat();
}

export function ajouterBulleSysteme(texte) {
  messagesChat.push({ type: "systeme", texte, ts: Date.now() });
  renderChat();
}

export function ajouterBulleHub(texte) {
  messagesChat.push({ type: "hub", texte, ts: Date.now() });
  renderChat();
}

export function ajouterBulleModule(cfg, titre, extrait, source) {
  messagesChat.push({ type: "module", cfg, titre, extrait: extrait && extrait.length > 220 ? extrait.slice(0, 220).trim() + "…" : extrait, source, ts: Date.now() });
  renderChat();
}

// Une seule bulle de réponse, fondue à partir de plusieurs extraits — sans
// nom de module, sans badge de source, juste un texte continu. C'est de la
// concaténation avec de petits connecteurs, pas une vraie synthèse : on
// prend la première phrase de chaque extrait utile et on les enchaîne.
export function ajouterBulleReponse(texte) {
  messagesChat.push({ type: "reponse", texte, ts: Date.now() });
  renderChat();
}

function premierePhrase(txt, maxLongueur) {
  if (!txt) return "";
  const idx = txt.search(/[.!?](\s|$)/);
  const phrase = idx > -1 ? txt.slice(0, idx + 1) : txt;
  return phrase.length > maxLongueur ? phrase.slice(0, maxLongueur).trim() + "…" : phrase;
}

// Les résultats "vides" (rien trouvé) ont leur titre égal à la requête elle-
// même et un extrait vide — c'est le signal qu'on utilise pour les écarter
// de la synthèse plutôt que de citer une source qui n'a rien donné.
function synthetiserReponse(resultats, requete) {
  const valides = resultats.filter((r) => r.extrait && r.titre !== requete);
  if (valides.length === 0) return null;

  const tries = [...valides].sort((a, b) => b.extrait.length - a.extrait.length).slice(0, 3);
  const connecteurs = ["", "Par ailleurs, ", "De plus, "];

  const phrases = tries.map((r, i) => connecteurs[i] + premierePhrase(r.extrait, 180));
  return phrases.join(" ");
}

export async function envoyerMessage() {
  const input = document.getElementById("chatTexte");
  const texte = input.value.trim();
  if (!texte) return;

  ajouterBulleUtilisateur(texte);
  input.value = "";

  const reponse = reponseSalutation(texte);
  if (reponse) {
    ajouterBulleHub(reponse);
    return;
  }

  const btn = document.getElementById("btnEnvoyer");
  if (btn) btn.disabled = true;

  const resultats = [];
  await lancerFocusCollectif(texte, null, (cfg, titre, extrait, source) => {
    resultats.push({ cfg, titre, extrait, source });
  });

  const synthese = synthetiserReponse(resultats, texte);
  if (synthese) {
    ajouterBulleReponse(synthese);
  } else {
    ajouterBulleSysteme("Aucun module n'a trouvé de réponse exploitable cette fois — reformule ou réessaie.");
  }

  if (btn) btn.disabled = false;
}

export function renderChat() {
  const zone = document.getElementById("chatLog");
  if (!zone) return;
  zone.innerHTML = messagesChat.map((msg) => {
    if (msg.type === "moi") {
      return `<div class="bulle bulle-moi">${echapperHtml(msg.texte)}</div>`;
    }
    if (msg.type === "systeme") {
      return `<div class="bulle bulle-systeme">${echapperHtml(msg.texte)}</div>`;
    }
    if (msg.type === "hub") {
      return `<div class="bulle bulle-module"><div class="bulle-glyphe">◆</div><div class="bulle-corps"><div class="bulle-nom">hub</div><div class="bulle-titre">${echapperHtml(msg.texte)}</div></div></div>`;
    }
    if (msg.type === "reponse") {
      return `<div class="bulle bulle-reponse">${echapperHtml(msg.texte)}</div>`;
    }
    if (msg.type === "generation") {
      return `<div class="bulle bulle-module">
        <div class="bulle-glyphe" style="font-family:${msg.cfg.police}">${msg.cfg.glyphe}</div>
        <div class="bulle-corps">
          <div class="bulle-nom">${echapperHtml(msg.cfg.nom)} <span class="badge badge-generation" style="margin-left:4px">génération libre — non vérifiée</span></div>
          <div class="bulle-titre" style="font-style:italic">${echapperHtml(msg.texte)}</div>
        </div>
      </div>`;
    }
    // type === "module"
    const tag = (SOURCES[msg.source] && SOURCES[msg.source].tag) || "?";
    return `<div class="bulle bulle-module">
      <div class="bulle-glyphe" style="font-family:${msg.cfg.police}">${msg.cfg.glyphe}</div>
      <div class="bulle-corps">
        <div class="bulle-nom">${echapperHtml(msg.cfg.nom)} <span class="badge badge-source" style="margin-left:4px">${tag}</span></div>
        <div class="bulle-titre">${echapperHtml(msg.titre)}</div>
        <div class="bulle-extrait">${echapperHtml(msg.extrait)}</div>
      </div>
    </div>`;
  }).join("");
  zone.scrollTop = zone.scrollHeight;
}
