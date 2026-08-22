// sparkso-temoin — le cœur, zéro dépendance (SPEC.md est l'interface).
export { canonique } from './canonique.js';
export {
  sha256, genererSel, empreinteFeuille, empreinteNoeud,
  versHex, depuisHex, TAILLE_SEL, PREFIXE_FEUILLE, PREFIXE_NOEUD,
} from './empreinte.js';
export { construireArbre, repli } from './merkle.js';
export { emettre, ajouterAttestation, verifier } from './temoin.js';
