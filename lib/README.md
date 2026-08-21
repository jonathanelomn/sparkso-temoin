# lib/

Le cœur, **zéro dépendance** (crypto intégrée de Node uniquement) :

- `canonique.js` — sérialisation canonique (SPEC.md §4, profil RFC 8785
  restreint : clés triées, flottants rejetés).
- `merkle.js` — feuilles, arbre (promotion du nœud orphelin, jamais de
  duplication), chemins, repli (SPEC.md §5–6).
- `temoin.js` — émission et vérification d'un témoin v1 (SPEC.md §8–9).

À venir après le vérifieur, dans l'ordre de construction : calcul pur
d'abord (`temoin`, `verifier`), réseau en dernier (`ancrer`, `completer`).
Toute implémentation doit reproduire les vecteurs de l'annexe A de SPEC.md.
