# lib/

Le cœur du système, **zéro dépendance** (uniquement la crypto intégrée de
Node). Chaque fichier porte une notion, expliquée en tête de fichier :

- [`canonique.js`](canonique.js) — la mise en forme unique des données
  avant hachage (SPEC §4) : clés triées, flottants refusés.
- [`empreinte.js`](empreinte.js) — l'empreinte digitale des données
  (SHA-256), le sel secret de 32 octets, les préfixes qui distinguent
  feuilles et nœuds (SPEC §5).
- [`merkle.js`](merkle.js) — l'arbre qui résume toutes les empreintes en
  une seule racine, et le rejeu d'un chemin (SPEC §6).
- [`temoin.js`](temoin.js) — l'assemblage et la vérification du reçu
  final, le témoin (SPEC §8–9).

Usage type :

```js
import { emettre, verifier, ajouterAttestation } from 'sparkso-temoin';

// Émettre : un lot d'enregistrements → une racine à ancrer + un témoin chacun.
const { racine, temoins } = emettre([{ note: 17 }, { note: 12 }]);

// Vérifier : un témoin → un compte rendu détaillé.
const resultat = verifier(temoins[0]);   // { conforme: true, ... }
```

Les tests ([`../test/vecteurs.test.js`](../test/vecteurs.test.js))
rejouent tous les vecteurs de l'annexe A de SPEC.md : `npm test`.
