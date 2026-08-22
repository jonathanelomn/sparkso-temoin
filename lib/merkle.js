// Arbre de Merkle (SPEC.md §6).
//
// Image : un tournoi. Chaque enregistrement a son empreinte (une
// « feuille ») ; on combine les feuilles deux par deux, puis les
// gagnants deux par deux, jusqu'à une unique empreinte-résumé : la
// racine. On n'ancre que la racine, et chaque enregistrement garde la
// liste de ses « matchs » (son chemin) pour prouver qu'il mène bien à
// cette racine.
//
// Règle en nombre impair : le nœud sans partenaire est promu tel quel
// au niveau supérieur (façon RFC 6962). On ne duplique JAMAIS la
// dernière feuille : la duplication est la faille CVE-2012-2459 (deux
// listes d'enregistrements différentes donneraient la même racine).

import { empreinteNoeud } from './empreinte.js';

/**
 * Construit l'arbre au-dessus des feuilles (des empreintes de 32 octets).
 * Retourne { racine, chemins } :
 *  - racine : les 32 octets du sommet ;
 *  - chemins[i] : le chemin de la feuille i, liste de
 *    { cote: "gauche"|"droite", empreinte: <32 octets> } — `cote` est la
 *    position de l'empreinte SŒUR par rapport au nœud courant.
 */
export function construireArbre(feuilles) {
  if (!Array.isArray(feuilles) || feuilles.length === 0) {
    throw new TypeError('construireArbre : au moins une feuille est requise.');
  }
  const chemins = feuilles.map(() => []);
  // Chaque nœud du niveau courant se souvient des feuilles qu'il couvre,
  // pour savoir à quels chemins ajouter chaque nouveau « match ».
  let niveau = feuilles.map((empreinte, indice) => ({ empreinte, couvre: [indice] }));

  while (niveau.length > 1) {
    const suivant = [];
    for (let i = 0; i + 1 < niveau.length; i += 2) {
      const gauche = niveau[i];
      const droite = niveau[i + 1];
      for (const indice of gauche.couvre) {
        chemins[indice].push({ cote: 'droite', empreinte: droite.empreinte });
      }
      for (const indice of droite.couvre) {
        chemins[indice].push({ cote: 'gauche', empreinte: gauche.empreinte });
      }
      suivant.push({
        empreinte: empreinteNoeud(gauche.empreinte, droite.empreinte),
        couvre: gauche.couvre.concat(droite.couvre),
      });
    }
    if (niveau.length % 2 === 1) {
      // Promotion telle quelle : aucun match à ce niveau pour l'orphelin,
      // donc rien à ajouter à ses chemins.
      suivant.push(niveau[niveau.length - 1]);
    }
    niveau = suivant;
  }
  return { racine: niveau[0].empreinte, chemins };
}

/**
 * Rejoue un chemin depuis une feuille : refait chaque « match » dans
 * l'ordre et retourne la racine obtenue (SPEC §6.1). La vérification
 * consiste à comparer ce résultat à la racine du témoin.
 */
export function repli(feuille, chemin) {
  let courant = feuille;
  for (const [i, maillon] of chemin.entries()) {
    if (maillon === null || typeof maillon !== 'object') {
      throw new TypeError('repli : chemin[' + i + '] doit être un objet { cote, empreinte }.');
    }
    if (!(maillon.empreinte instanceof Uint8Array) || maillon.empreinte.length !== 32) {
      throw new TypeError('repli : chemin[' + i + '].empreinte doit faire 32 octets.');
    }
    if (maillon.cote === 'gauche') {
      courant = empreinteNoeud(maillon.empreinte, courant);
    } else if (maillon.cote === 'droite') {
      courant = empreinteNoeud(courant, maillon.empreinte);
    } else {
      throw new TypeError('repli : chemin[' + i + '].cote doit être "gauche" ou "droite".');
    }
  }
  return courant;
}
