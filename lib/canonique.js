// Sérialisation canonique (SPEC.md §4).
//
// « Canonique » veut dire : une seule écriture possible. Deux logiciels
// différents qui reçoivent le même enregistrement doivent produire
// exactement le même texte, à l'octet près — sinon leurs empreintes
// divergeraient et rien ne serait vérifiable. Le profil suivi est la
// RFC 8785 (JCS), restreinte : clés triées, et AUCUN nombre flottant
// (les flottants s'écrivent différemment selon les langages ; la spec
// les interdit, on écrit les décimaux en chaînes ou en sous-unités).

/**
 * Sérialise une valeur JSON en sa forme canonique (une chaîne).
 * Rejette tout ce que la spécification interdit.
 */
export function canonique(valeur) {
  if (valeur === null) return 'null';
  const type = typeof valeur;
  if (type === 'boolean') return valeur ? 'true' : 'false';
  if (type === 'number') {
    if (!Number.isFinite(valeur)) {
      throw new TypeError('canonique : NaN et les infinis sont interdits (SPEC §4.4).');
    }
    if (!Number.isSafeInteger(valeur)) {
      throw new TypeError(
        'canonique : nombre flottant ou entier hors bornes interdit (SPEC §4.4) : ' + valeur +
        '. Écrire les décimaux en chaîne ("12.50") ou en sous-unité entière (centimes).');
    }
    if (Object.is(valeur, -0)) {
      throw new TypeError('canonique : -0 est interdit (SPEC §4.4).');
    }
    return String(valeur);
  }
  if (type === 'string') {
    // L'échappement de JSON.stringify est exactement celui de la RFC 8785.
    return JSON.stringify(valeur);
  }
  if (Array.isArray(valeur)) {
    return '[' + valeur.map(canonique).join(',') + ']';
  }
  if (type === 'object') {
    // Tri des clés par unités de code UTF-16 : le tri par défaut de sort().
    const cles = Object.keys(valeur).sort();
    return '{' + cles.map(cle => JSON.stringify(cle) + ':' + canonique(valeur[cle])).join(',') + '}';
  }
  throw new TypeError('canonique : type non sérialisable en JSON : ' + type + '.');
}
