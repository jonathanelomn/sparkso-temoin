// « temoin completer <lot> » — finir le travail après confirmation Bitcoin.
//
// Une preuve OpenTimestamps naît incomplète (« ancrer ») et devient
// complète quelques heures plus tard, quand Bitcoin a confirmé. Cette
// commande : interroge les calendriers (équivalent de « ots upgrade »),
// note le numéro du bloc, range la preuve complétée, et ajoute
// l'attestation dans chaque témoin du lot — qui deviennent alors des
// preuves d'antériorité complètes, prêtes à être remises.

import { readFileSync } from 'node:fs';
import { completerPreuve } from './ots.js';
import {
  lireJson, ecrireJson, ecrireOctets, chemins, listerTemoins, option,
  vert, jaune, gras, gris,
} from './commun.js';

export async function executer(args) {
  const dossier = option(args, '--dossier', 'ancrage');
  const lot = args[0];
  if (!lot) {
    throw new Error('Usage : temoin completer <lot> [--dossier ancrage]');
  }

  const sortie = chemins(dossier, lot);
  let octetsOts;
  try {
    octetsOts = readFileSync(sortie.preuve);
  } catch {
    throw new Error(`Pas de preuve pour ce lot (« ${sortie.preuve} »). Lancez d'abord « temoin ancrer ${lot} ».`);
  }

  console.log(gras(`Mise à niveau de la preuve du lot « ${lot} »`));
  console.log('Interrogation des calendriers OpenTimestamps…');

  const { octets, bloc } = await completerPreuve(octetsOts);

  if (bloc === null) {
    console.log();
    console.log(jaune('Pas encore.') + ' Bitcoin n\'a pas encore confirmé cette racine.');
    console.log('C\'est normal dans les premières heures après l\'ancrage : les');
    console.log('calendriers regroupent les racines puis attendent un bloc. Réessayez');
    console.log('plus tard — la preuve actuelle reste valable, rien n\'est perdu.');
    process.exit(2);
  }

  // La preuve est complète : on la range, puis on complète chaque témoin.
  ecrireOctets(sortie.preuve, octets);
  const preuveBase64 = octets.toString('base64');

  const fichiers = listerTemoins(sortie.temoins);
  let misAJour = 0;
  for (const fichier of fichiers) {
    const temoin = lireJson(fichier, 'un témoin du lot');
    const autres = (temoin.attestations ?? []).filter(a => !(a && a.type === 'ots'));
    const deja = (temoin.attestations ?? []).some(a => a && a.type === 'ots' && a.bloc === bloc);
    if (!deja) {
      temoin.attestations = [...autres, { type: 'ots', preuve: preuveBase64, bloc }];
      ecrireJson(fichier, temoin);
      misAJour++;
    }
  }

  console.log();
  console.log(vert('✓') + ` Preuve complète : la racine est ancrée dans le bloc Bitcoin ${gras(String(bloc))}.`);
  console.log(vert('✓') + ` Preuve mise à niveau : ${sortie.preuve} (${octets.length} octets)`);
  console.log(vert('✓') + ` ${misAJour} témoin(s) complétés avec l'attestation` +
    (misAJour < fichiers.length ? gris(` (${fichiers.length - misAJour} l'avaient déjà)`) : ''));
  console.log();
  console.log('À constater publiquement :');
  console.log(`  https://mempool.space/fr/block/${bloc}`);
  console.log();
  console.log('Les témoins de ' + gris(sortie.temoins + '/') + ' sont maintenant complets :');
  console.log('chacun prouve « ces octets existaient au plus tard au bloc ' + String(bloc) + ' ».');
  console.log('Ils peuvent être remis à leurs propriétaires.');
}
