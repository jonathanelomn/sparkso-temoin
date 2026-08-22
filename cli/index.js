#!/usr/bin/env node
// L'outil en ligne de commande de sparkso-temoin.
//
// Quatre commandes qui suivent la vie d'un lot (voir EXTRACTION.md) :
//   emettre    fabriquer les témoins d'un lot d'extraction  (pur calcul)
//   ancrer     déposer la racine du lot dans Bitcoin        (réseau)
//   completer  récupérer la preuve confirmée, la ranger     (réseau)
//   verifier   contrôler un témoin, pas à pas               (pur calcul)
//
// Chaque commande explique ce qu'elle fait en français courant : l'outil
// est aussi un support de compréhension du système.

import { rouge, gras, gris } from './commun.js';

const AIDE = `
${gras('temoin')} — états certifiés par ancrage public

La vie d'un lot, dans l'ordre :

  1. ${gras('temoin emettre <lot.json>')}
     Lit un lot d'extraction (le fichier JSON produit par la plateforme,
     voir EXTRACTION.md), tire un sel secret par enregistrement, calcule
     les empreintes, construit l'arbre, et écrit : les sels, un témoin
     par enregistrement, et la racine à ancrer. Aucun réseau.

  2. ${gras('temoin ancrer <lot>')}
     Dépose la racine du lot auprès des calendriers OpenTimestamps
     (gratuit, sans compte). La preuve obtenue est d'abord INCOMPLÈTE :
     Bitcoin doit confirmer, cela prend quelques heures.

  3. ${gras('temoin completer <lot>')}
     Quelques heures plus tard : récupère la preuve confirmée, note le
     numéro du bloc Bitcoin, et ajoute l'attestation dans chaque témoin
     du lot. Les témoins sont alors complets, prêts à être remis.

  4. ${gras('temoin verifier <fichier.temoin.json>')}
     Contrôle un témoin, étape par étape, comme le ferait n'importe qui :
     recalcul de l'empreinte, du chemin, de la racine, lecture des
     attestations. Option ${gris('--donnees <fichier>')} pour comparer aux
     données originales.

Options communes : ${gris('--dossier <chemin>')} (défaut : « ancrage »),
l'arborescence décrite dans EXTRACTION.md §3.
`;

const commandes = {
  emettre: () => import('./emettre.js'),
  ancrer: () => import('./ancrer.js'),
  completer: () => import('./completer.js'),
  verifier: () => import('./verifier.js'),
};

const [commande, ...args] = process.argv.slice(2);

if (!commande || commande === 'aide' || commande === '--help' || commande === '-h') {
  console.log(AIDE);
  process.exit(0);
}
if (!commandes[commande]) {
  console.error(rouge(`Commande inconnue : « ${commande} ».`) +
    ' Commandes possibles : emettre, ancrer, completer, verifier, aide.');
  process.exit(1);
}

try {
  const module_ = await commandes[commande]();
  await module_.executer(args);
} catch (erreur) {
  console.error(rouge('Erreur : ') + erreur.message);
  process.exit(1);
}
