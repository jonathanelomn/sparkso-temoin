// « temoin verifier <fichier.temoin.json> » — contrôler un témoin.
//
// Refait exactement ce que ferait n'importe quel vérifieur indépendant
// (SPEC.md §9), en expliquant chaque étape en français courant. Pur
// calcul, aucun réseau. Option --donnees <fichier> : comparer octet pour
// octet le champ canonique aux données que vous détenez.

import { readFileSync } from 'node:fs';
import { verifier } from '../lib/index.js';
import { lireJson, option, vert, rouge, jaune, gras, gris } from './commun.js';

export async function executer(args) {
  const cheminDonnees = option(args, '--donnees', null);
  const cheminTemoin = args[0];
  if (!cheminTemoin) {
    throw new Error('Usage : temoin verifier <fichier.temoin.json> [--donnees <fichier>]');
  }

  const temoin = lireJson(cheminTemoin, 'le témoin');
  const resultat = verifier(temoin);

  console.log(gras('Vérification du témoin, étape par étape :'));
  console.log();

  if (!resultat.conforme) {
    if (resultat.feuille) {
      console.log(vert('✓') + ' Empreinte des données recalculée : ' + gris(resultat.feuille));
    }
    for (const erreur of resultat.erreurs) {
      console.log(rouge('✗ ') + erreur);
    }
    console.log();
    console.log(rouge(gras('NON CONFORME.')) + ' Le recalcul ne confirme pas ce témoin :');
    console.log('soit il a été altéré, soit il est mal formé. S\'il vous a été remis,');
    console.log('rapprochez-vous de l\'émetteur.');
    process.exit(1);
  }

  console.log(vert('✓') + ' Format reconnu : témoin v1, hachage sha-256.');
  console.log(gris('  (l\'étiquette du reçu : elle dit comment le vérifier)'));
  console.log(vert('✓') + ' Empreinte des données recalculée : ' + gris(resultat.feuille));
  console.log(gris('  (le sel secret mélangé aux données, le tout passé dans SHA-256)'));
  console.log(vert('✓') + ' Chemin rejoué jusqu\'à la racine : ' + gris(resultat.racineRecalculee));
  console.log(gris('  (l\'empreinte combinée avec ses voisines, étage par étage)'));
  console.log(vert('✓') + ' La racine recalculée est identique à celle du témoin.');
  console.log(gris('  (donc ni les données, ni le sel, ni le chemin n\'ont été altérés)'));

  // Comparaison facultative aux données originales.
  if (cheminDonnees) {
    const octets = readFileSync(cheminDonnees);
    const attendu = Buffer.from(temoin.canonique, 'utf8');
    if (octets.equals(attendu)) {
      console.log(vert('✓') + ' Le fichier fourni est identique, octet pour octet, aux données scellées.');
    } else {
      console.log(rouge('✗') + ` Le fichier fourni diffère des données scellées ` +
        `(${octets.length} octets contre ${attendu.length}).`);
      process.exit(1);
    }
  }

  // Les attestations : la preuve d'antériorité.
  const { completes, incompletes, inconnues } = resultat.ancrage;
  console.log();
  if (completes.length > 0) {
    for (const attestation of completes) {
      console.log(vert(gras('CONFORME.')) + ` Racine à constater dans le bloc Bitcoin ${gras(String(attestation.bloc))} :`);
      console.log(`  https://mempool.space/fr/block/${attestation.bloc}`);
      console.log(`  https://blockstream.info/block-height/${attestation.bloc}`);
    }
    console.log(gris('Ces octets existaient au plus tard lorsque ce bloc a été miné.'));
    console.log(gris('Contrôle indépendant possible de la preuve .ots avec le client'));
    console.log(gris('OpenTimestamps officiel (« ots verify »).'));
  } else if (incompletes > 0) {
    console.log(jaune(gras('CONFORME, en attente.')) + ' La preuve OpenTimestamps n\'est pas encore');
    console.log('confirmée par Bitcoin. L\'émetteur doit lancer « temoin completer ».');
  } else if (inconnues > 0) {
    console.log(jaune(gras('CONFORME,')) + ' mais aucune attestation d\'un type connu (v1 : "ots").');
  } else {
    console.log(jaune(gras('CONFORME, sans ancrage.')) + ' Ce témoin ne porte aucune attestation :');
    console.log('il est en attente d\'ancrage et ne prouve encore aucune antériorité.');
  }
}
