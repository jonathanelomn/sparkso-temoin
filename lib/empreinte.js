// Empreintes (SPEC.md §5).
//
// Une empreinte est l'« empreinte digitale » d'octets : 32 octets issus
// de SHA-256. Le sel est un grand nombre aléatoire secret, propre à
// chaque enregistrement : mélangé aux données avant le calcul, il
// empêche de retrouver un contenu devinable en essayant toutes les
// possibilités, et sa destruction rend l'empreinte définitivement
// muette (effacement, SPEC §10).
//
// Les préfixes 0x00 (feuille) et 0x01 (nœud) « signent » le rôle de
// chaque empreinte : impossible de faire passer un nœud de l'arbre
// pour un enregistrement, ou l'inverse.

import { createHash, randomBytes } from 'node:crypto';

export const PREFIXE_FEUILLE = Buffer.from([0x00]);
export const PREFIXE_NOEUD = Buffer.from([0x01]);
export const TAILLE_SEL = 32;

/** SHA-256 d'octets ; retourne 32 octets. */
export function sha256(octets) {
  return createHash('sha256').update(octets).digest();
}

/** Tire un sel de 32 octets d'un générateur cryptographiquement sûr. */
export function genererSel() {
  return randomBytes(TAILLE_SEL);
}

/**
 * Empreinte d'une feuille : h = H(0x00 ‖ sel ‖ canonique) (SPEC §5.2).
 * `sel` : 32 octets bruts. `chaineCanonique` : la sérialisation canonique.
 */
export function empreinteFeuille(sel, chaineCanonique) {
  if (!(sel instanceof Uint8Array) || sel.length !== TAILLE_SEL) {
    throw new TypeError('empreinteFeuille : le sel doit faire exactement 32 octets bruts.');
  }
  if (typeof chaineCanonique !== 'string') {
    throw new TypeError('empreinteFeuille : la sérialisation canonique doit être une chaîne.');
  }
  return sha256(Buffer.concat([PREFIXE_FEUILLE, sel, Buffer.from(chaineCanonique, 'utf8')]));
}

/** Empreinte d'un nœud interne : parent = H(0x01 ‖ gauche ‖ droite) (SPEC §5.3). */
export function empreinteNoeud(gauche, droite) {
  if (gauche.length !== 32 || droite.length !== 32) {
    throw new TypeError('empreinteNoeud : deux empreintes de 32 octets attendues.');
  }
  return sha256(Buffer.concat([PREFIXE_NOEUD, gauche, droite]));
}

/** Octets → hexadécimal minuscule (l'écriture des empreintes dans le témoin). */
export function versHex(octets) {
  return Buffer.from(octets).toString('hex');
}

/**
 * Hexadécimal minuscule → octets, avec contrôle strict (SPEC §8.3 et A.4) :
 * minuscules uniquement, et taille exacte si `tailleAttendue` est donnée.
 */
export function depuisHex(hex, tailleAttendue, nomChamp = 'valeur') {
  if (typeof hex !== 'string' || !/^[0-9a-f]*$/.test(hex) || hex.length % 2 !== 0) {
    throw new TypeError(nomChamp + ' : hexadécimal minuscule attendu.');
  }
  const octets = Buffer.from(hex, 'hex');
  if (tailleAttendue !== undefined && octets.length !== tailleAttendue) {
    throw new TypeError(nomChamp + ' : ' + tailleAttendue + ' octets attendus, ' +
      octets.length + ' reçus.');
  }
  return octets;
}
