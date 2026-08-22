# Plan de test — sparkso-temoin

Comment ce projet se vérifie, à trois étages : tests automatiques,
test grandeur nature, tests manuels de la page. Et la règle d'or qui
gouverne le tout.

## 1. La philosophie : la spécification est le contrat

[SPEC.md](../SPEC.md) est figée (v1) et contient en annexe A des
**vecteurs de test** : des exemples chiffrés, calculés à la main une
fois pour toutes — « telles données, tel sel, doivent donner exactement
telle empreinte, telle racine ». Un témoin émis en 2026 devant rester
vérifiable en 2036, ces vecteurs sont le contrat : tout code, présent
ou futur, dans n'importe quel langage, doit les reproduire au caractère
près.

## 2. Tests automatiques (`npm test`)

La commande `npm test` (elle lance le lanceur de tests intégré à
Node.js, sans bibliothèque extérieure) rejoue les **10 tests** du
dossier `test/`, qui couvrent l'annexe A :

- **Vecteur A** — sérialisation canonique (la forme unique et
  normalisée des données) et empreinte d'une feuille seule ;
- **Vecteur B** — arbre de Merkle à 3 feuilles : racine, chemins,
  promotion du nœud orphelin (jamais de duplication) ;
- **Vecteur C** — témoin complet : repli du chemin jusqu'à la racine ;
- **Cas à rejeter** — entrées invalides qui doivent échouer proprement
  (flottants interdits, champs manquants, chemin incohérent…).

Attendu : `10 pass, 0 fail`, en une seconde. Ces tests tournent sans
réseau et sans dépendance.

## 3. Le test grandeur nature (jalon du 22 août 2026)

Le dossier `exemples/` contient un lot réel
(`demonstration-notes-2026-S1`) réellement ancré : racine
`b133a459…867b`, **bloc Bitcoin 963516**. Sa preuve a été relue par le
client OpenTimestamps **officiel** — l'outil d'un tiers — et le bloc
recoupé sur deux explorateurs publics indépendants. C'est le test de
compatibilité ultime : notre chaîne complète produit des preuves que le
standard reconnaît. Ce cas sert d'exemple canonique partout (page,
docs, démonstrations).

## 4. Tests manuels de la page vérifieur

À rejouer après toute modification de `verifieur/index.html` ou
`en.html` (règle du miroir : les deux langues, toujours) :

1. **L'exemple de la spécification** : bouton « Essayer avec l'exemple » →
   verdict jaune « aucune antériorité prouvée », cinq étapes détaillées.
2. **Le témoin réel** : charger
   `exemples/ancrage/temoins/demonstration-notes-2026-S1/0001.temoin.json`
   → verdict vert, bloc 963516, liens explorateurs.
3. **Un témoin altéré** : changer un caractère des données → verdict
   rouge, l'étape fautive identifiée.
4. **Les quatre volets** : navigation, liens internes, dépliants.
5. **Sur téléphone** (ou fenêtre étroite < 520 px) : la liste de
   contrôle complète est dans [../verifieur/MOBILE.md](../verifieur/MOBILE.md) —
   onglets glissants, libellés « touchez », pas de zoom forcé, aucun
   défilement latéral.
6. **Hors connexion** : couper le réseau, recharger la page, vérifier
   l'exemple — tout doit fonctionner à l'identique.

## 5. La règle d'or

**Un test qui casse signale un code faux, jamais un vecteur à
adapter.** Les vecteurs de l'annexe A ne se modifient pas : les changer
reviendrait à changer la spécification, donc à casser la promesse de
vérifiabilité des témoins déjà émis. Si un nouveau comportement est
nécessaire, il passe par un complément de spécification (comme
[PROPOSITION-EVM.md](../PROPOSITION-EVM.md)), jamais par une retouche
de la v1.

## 6. Ajouter des tests

Toute nouvelle brique de calcul reçoit ses vecteurs (dans le complément
de spec qui la définit) et ses tests automatiques. Les évolutions de la
page vérifieur enrichissent la liste manuelle ci-dessus — et le
document d'avancements du mois consigne ce qui a été vérifié et
comment.
