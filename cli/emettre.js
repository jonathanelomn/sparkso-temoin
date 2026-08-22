// « temoin emettre <lot.json> » — fabriquer les témoins d'un lot.
//
// Entrée : un lot d'extraction (EXTRACTION.md §1). Sortie : les sels,
// un témoin par enregistrement, et la racine à ancrer. Pur calcul,
// aucun réseau.

import { basename } from 'node:path';
import { join } from 'node:path';
import { emettre } from '../lib/index.js';
import { lireJson, ecrireJson, chemins, option, vert, gras, jaune, gris } from './commun.js';

export async function executer(args) {
  const dossier = option(args, '--dossier', 'ancrage');
  const cheminLot = args[0];
  if (!cheminLot) {
    throw new Error('Usage : temoin emettre <lot.json> [--dossier ancrage]');
  }

  const lot = lireJson(cheminLot, "le lot d'extraction");
  if (lot.format !== 1) {
    throw new Error('Le lot doit porter "format": 1 (voir EXTRACTION.md §1).');
  }
  if (typeof lot.lot !== 'string' || !lot.lot) {
    throw new Error('Le lot doit porter un identifiant "lot" (ex. "iugm-notes-2026-S1").');
  }
  if (!Array.isArray(lot.enregistrements) || lot.enregistrements.length === 0) {
    throw new Error('Le lot doit contenir au moins un enregistrement dans "enregistrements".');
  }

  console.log(gras(`Lot « ${lot.lot} » : ${lot.enregistrements.length} enregistrement(s) à sceller.`));
  console.log(gris('Pour chacun : tirage d\'un sel secret, mise en forme canonique,'));
  console.log(gris('empreinte SHA-256, puis construction de l\'arbre commun.'));

  // Tout le travail cryptographique est dans la lib (zéro dépendance).
  const { racine, temoins } = emettre(lot.enregistrements);

  const sortie = chemins(dossier, lot.lot);

  // 1. Les sels — SECRETS : à stocker avec les données, à détruire avec elles.
  ecrireJson(sortie.sels, {
    format: 1,
    lot: lot.lot,
    racine,
    attention: 'SECRET — ces sels permettent de confirmer les données scellées. ' +
      'À stocker comme les données elles-mêmes, à détruire avec elles (droit à l\'effacement).',
    sels: temoins.map(t => t.sel),
  });

  // 2. Un témoin par enregistrement, numéroté dans l'ordre du lot.
  for (const [i, temoin] of temoins.entries()) {
    const numero = String(i + 1).padStart(4, '0');
    ecrireJson(join(sortie.temoins, `${numero}.temoin.json`), temoin);
  }

  console.log();
  console.log(vert('✓') + ` ${temoins.length} témoin(s) écrits dans        ${sortie.temoins}/`);
  console.log(vert('✓') + ` Sels (secrets) écrits dans      ${sortie.sels}`);
  console.log(vert('✓') + ` Racine du lot (à ancrer)        ${racine}`);
  console.log();
  console.log(jaune('Important :') + ' pour l\'instant, ces témoins ne prouvent encore rien —');
  console.log('leur champ "attestations" est vide. Prochaine étape :');
  console.log(gras(`  temoin ancrer ${lot.lot}`) + gris(` --dossier ${dossier}`));
  console.log(`qui déposera la racine dans Bitcoin (gratuit, via OpenTimestamps),`);
  console.log(`puis, quelques heures plus tard : ` + gras(`temoin completer ${lot.lot}`) + '.');
  console.log();
  console.log('Source : ' + basename(cheminLot));
}
