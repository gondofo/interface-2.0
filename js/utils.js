// ---------------------------------------------------------------------------
// utils.js — fonctions pures. N'importe rien d'autre du projet : c'est une
// feuille de l'arbre de dépendances, tout le monde peut l'importer sans
// risque de dépendance circulaire.
// ---------------------------------------------------------------------------

export function formatRelatif(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 3) return "à l'instant";
  if (s < 60) return `il y a ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m}min`;
  return `il y a ${Math.round(m / 60)}h`;
}

export function tronquer(txt, n) {
  if (!txt) return "";
  return txt.length > n ? txt.slice(0, n).trim() + "…" : txt;
}

export function echapperHtml(txt) {
  const d = document.createElement("div");
  d.textContent = txt;
  return d.innerHTML;
}

export function normaliser(txt) {
  return txt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function auHasard(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}
