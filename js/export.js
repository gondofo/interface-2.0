// ---------------------------------------------------------------------------
// export.js — export de la mémoire de chaque module en .zip. Utilise JSZip,
// chargé en global depuis un <script> classique dans index.html (pas un
// import ES) : c'est une bibliothèque tierce, pas un fichier du projet.
// ---------------------------------------------------------------------------
import { MODULES_CONFIG } from './registry.js';
import { etat } from './etat.js';

export async function exporterMemoire(onMessage) {
  const btn = document.getElementById("btnExporter");
  if (btn) btn.disabled = true;
  const texteOriginal = btn ? btn.textContent : "";
  if (btn) btn.textContent = "Préparation du zip…";

  try {
    if (typeof JSZip === "undefined") throw new Error("JSZip n'a pas pu être chargé (vérifie ta connexion ou le CDN)");

    const zip = new JSZip();
    const resume = [];

    MODULES_CONFIG.forEach((cfg) => {
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
      zip.file(`${cfg.id}.json`, JSON.stringify(donnees, null, 2));
      resume.push({ id: cfg.id, nom: cfg.nom, cycles: m.cycles, derniere_maj: donnees.derniere_maj });
    });

    zip.file("index.json", JSON.stringify({ exporte_le: new Date().toISOString(), modules: resume }, null, 2));

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memoire-interface-b-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onMessage && onMessage("💾 Export téléchargé — un fichier JSON par module, plus un index.json récapitulatif.");
  } catch (e) {
    onMessage && onMessage("⚠ L'export a échoué : " + e.message);
  }

  if (btn) { btn.disabled = false; btn.textContent = texteOriginal; }
}
