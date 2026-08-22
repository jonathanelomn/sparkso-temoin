// « temoin ancrer <lot> » — déposer la racine du lot dans Bitcoin.
//
// Seul moment où le système touche au réseau (avec « completer ») : la
// racine — 32 octets, rien d'autre — est soumise aux calendriers
// OpenTimestamps publics. Gratuit, sans compte, sans portefeuille.

import { existsSync, readFileSync } from 'node:fs';
import { depuisHex } from '../lib/index.js';
import { ancrerRacine } from './ots.js';
import { lireJson, ecrireOctets, chemins, option, vert, jaune, gras, gris } from './commun.js';

export async function executer(args) {
  const dossier = option(args, '--dossier', 'ancrage');
  const lot = args[0];
  if (!lot) {
    throw new Error('Usage : temoin ancrer <lot> [--dossier ancrage]');
  }

  const sortie = chemins(dossier, lot);
  const fichierSels = lireJson(sortie.sels, `le récapitulatif du lot (écrit par « emettre »)`);
  const racine = depuisHex(fichierSels.racine, 32, 'racine');

  if (existsSync(sortie.preuve)) {
    const taille = readFileSync(sortie.preuve).length;
    console.log(jaune('Une preuve existe déjà') + ` pour ce lot (${sortie.preuve}, ${taille} octets).`);
    console.log('Pour la mettre à niveau après confirmation Bitcoin : ' + gras(`temoin completer ${lot}`));
    return;
  }

  console.log(gras(`Ancrage du lot « ${lot} »`));
  console.log('Racine à déposer : ' + gris(fichierSels.racine));
  console.log('Envoi aux calendriers OpenTimestamps publics…');

  const octetsOts = await ancrerRacine(racine);
  ecrireOctets(sortie.preuve, octetsOts);

  console.log();
  console.log(vert('✓') + ` Preuve écrite : ${sortie.preuve} (${octetsOts.length} octets)`);
  console.log();
  console.log(jaune('Cette preuve est pour l\'instant INCOMPLÈTE') + ' : elle référence les');
  console.log('calendriers, qui vont regrouper cette racine avec d\'autres et l\'inscrire');
  console.log('dans une transaction Bitcoin. Quand un bloc l\'aura confirmée (comptez');
  console.log('quelques heures), lancez :');
  console.log(gras(`  temoin completer ${lot}`) + gris(` --dossier ${dossier}`));
}
