// Le témoin (SPEC.md §8–9).
//
// Le témoin est le reçu remis au propriétaire des données : un document
// JSON qui contient tout le nécessaire pour refaire la vérification
// sans nous — les données (dans leur écriture canonique), le sel, le
// chemin dans l'arbre, la racine, et les attestations d'ancrage.

import { canonique } from './canonique.js';
import {
  TAILLE_SEL, genererSel, empreinteFeuille, versHex, depuisHex,
} from './empreinte.js';
import { construireArbre, repli } from './merkle.js';

/**
 * Émet les témoins d'un lot d'enregistrements (des valeurs JSON).
 * Un sel neuf est tiré pour chacun, sauf si `options.sels` en fournit
 * (utile pour reproduire les vecteurs de test de la spec).
 *
 * Retourne { racine, temoins } :
 *  - racine : la racine de l'arbre, en hexadécimal — c'est elle qu'on ancre ;
 *  - temoins[i] : le témoin de l'enregistrement i, avec `attestations`
 *    vide — le témoin ne prouvera une antériorité qu'une fois la racine
 *    ancrée et l'attestation ajoutée (voir `ajouterAttestation`).
 */
export function emettre(enregistrements, options = {}) {
  if (!Array.isArray(enregistrements) || enregistrements.length === 0) {
    throw new TypeError('emettre : au moins un enregistrement est requis.');
  }
  const sels = options.sels ?? enregistrements.map(() => genererSel());
  if (sels.length !== enregistrements.length) {
    throw new TypeError('emettre : il faut exactement un sel par enregistrement.');
  }
  for (const sel of sels) {
    if (!(sel instanceof Uint8Array) || sel.length !== TAILLE_SEL) {
      throw new TypeError('emettre : chaque sel doit faire 32 octets bruts.');
    }
  }

  const chaines = enregistrements.map(canonique);
  const feuilles = chaines.map((chaine, i) => empreinteFeuille(sels[i], chaine));
  const { racine, chemins } = construireArbre(feuilles);

  const temoins = enregistrements.map((_, i) => ({
    format: 1,
    hachage: 'sha-256',
    canonique: chaines[i],
    sel: versHex(sels[i]),
    chemin: chemins[i].map(maillon => ({
      cote: maillon.cote,
      empreinte: versHex(maillon.empreinte),
    })),
    racine: versHex(racine),
    attestations: [],
  }));
  return { racine: versHex(racine), temoins };
}

/**
 * Ajoute une attestation d'ancrage à un témoin (sans le modifier :
 * retourne une copie). v1 : type "ots" — `preuveOts` est le contenu
 * binaire du fichier .ots ; `bloc`, s'il est connu, est la hauteur du
 * bloc Bitcoin (preuve complète). Sans `bloc`, la preuve est incomplète.
 */
export function ajouterAttestation(temoin, { preuveOts, bloc }) {
  if (!(preuveOts instanceof Uint8Array)) {
    throw new TypeError('ajouterAttestation : preuveOts doit être des octets (le fichier .ots).');
  }
  const attestation = { type: 'ots', preuve: Buffer.from(preuveOts).toString('base64') };
  if (bloc !== undefined) {
    if (!Number.isInteger(bloc) || bloc < 0) {
      throw new TypeError('ajouterAttestation : bloc doit être une hauteur de bloc entière.');
    }
    attestation.bloc = bloc;
  }
  return { ...temoin, attestations: [...(temoin.attestations ?? []), attestation] };
}

/**
 * Vérifie un témoin (SPEC §9). Ne lève pas d'exception pour un témoin
 * invalide : retourne un compte rendu.
 *
 * Retourne {
 *   conforme,            // les étapes 1 à 4 passent (recalcul exact)
 *   erreurs,             // liste de messages si non conforme
 *   feuille,             // empreinte de feuille recalculée (hex)
 *   racineRecalculee,    // racine recalculée (hex)
 *   ancrage: {           // lecture des attestations (étape 5)
 *     completes,         //   attestations ots avec bloc : [{bloc, preuve}]
 *     incompletes,       //   nombre d'ots sans bloc
 *     inconnues,         //   nombre d'attestations d'un type ignoré
 *   },
 * }
 */
export function verifier(temoin) {
  const erreurs = [];
  const resultat = { conforme: false, erreurs, feuille: null, racineRecalculee: null, ancrage: null };
  if (temoin === null || typeof temoin !== 'object' || Array.isArray(temoin)) {
    erreurs.push('Un témoin est un objet JSON.');
    return resultat;
  }

  // Étape 1 — format.
  if (temoin.format !== 1) {
    erreurs.push('"format" doit valoir 1 (reçu : ' + JSON.stringify(temoin.format) + ').');
    return resultat;
  }
  if (temoin.hachage !== 'sha-256') {
    erreurs.push('"hachage" doit valoir "sha-256" (reçu : ' + JSON.stringify(temoin.hachage) + ').');
    return resultat;
  }

  // Étape 2 — empreinte de la feuille.
  if (typeof temoin.canonique !== 'string') {
    erreurs.push('"canonique" doit être une chaîne.');
    return resultat;
  }
  let feuille;
  try {
    const sel = depuisHex(temoin.sel, TAILLE_SEL, 'sel');
    feuille = empreinteFeuille(sel, temoin.canonique);
  } catch (erreur) {
    erreurs.push(erreur.message);
    return resultat;
  }
  resultat.feuille = versHex(feuille);

  // Étape 3 — repli du chemin.
  if (!Array.isArray(temoin.chemin)) {
    erreurs.push('"chemin" doit être un tableau.');
    return resultat;
  }
  let racineRecalculee;
  try {
    const chemin = temoin.chemin.map((maillon, i) => ({
      cote: maillon?.cote,
      empreinte: depuisHex(maillon?.empreinte, 32, 'chemin[' + i + '].empreinte'),
    }));
    racineRecalculee = repli(feuille, chemin);
  } catch (erreur) {
    erreurs.push(erreur.message);
    return resultat;
  }
  resultat.racineRecalculee = versHex(racineRecalculee);

  // Étape 4 — comparaison à la racine annoncée, sur les octets décodés.
  let racineAnnoncee;
  try {
    racineAnnoncee = depuisHex(temoin.racine, 32, 'racine');
  } catch (erreur) {
    erreurs.push(erreur.message);
    return resultat;
  }
  if (!racineRecalculee.equals(racineAnnoncee)) {
    erreurs.push('La racine recalculée (' + resultat.racineRecalculee +
      ') ne correspond pas à la racine du témoin (' + temoin.racine + ').');
    return resultat;
  }
  resultat.conforme = true;

  // Étape 5 — attestations : les types inconnus sont ignorés sans erreur.
  const attestations = Array.isArray(temoin.attestations) ? temoin.attestations : [];
  const ots = attestations.filter(a => a && a.type === 'ots');
  resultat.ancrage = {
    completes: ots.filter(a => Number.isInteger(a.bloc))
      .map(a => ({ bloc: a.bloc, preuve: a.preuve })),
    incompletes: ots.filter(a => !Number.isInteger(a.bloc)).length,
    inconnues: attestations.length - ots.length,
  };
  return resultat;
}
