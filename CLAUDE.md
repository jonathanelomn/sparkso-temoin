# sparkso-temoin — consignes pour Claude

## Ce qu'est ce projet

Système d'ancrage blockchain **générique et réutilisable** : des octets en
entrée, un témoin (reçu vérifiable) en sortie. Empreintes salées, arbre de
Merkle, ancrage OpenTimestamps sur Bitcoin. Aucune connaissance du métier
ici : Sparkso Universités (IUGM Mahajanga) n'est que le premier
consommateur. **[SPEC.md](SPEC.md) est l'interface — v1 FIGÉE, ne jamais
la modifier** (un témoin de 2026 doit se vérifier en 2036) ;
[EXTRACTION.md](EXTRACTION.md) définit le pont avec les plateformes.

## État (22 août 2026) — tout est construit, jalon atteint

- `SPEC.md` : v1 figée, vecteurs de test en annexe A.
- `lib/` : cœur **zéro dépendance** ; `npm test` rejoue l'annexe A (10 tests).
- `cli/` : `temoin emettre|ancrer|completer|verifier` (bin `temoin`) ;
  seul `cli/ots.js` touche au réseau, via la lib npm officielle
  `opentimestamps`.
- `verifieur/index.html` (+ `en.html`) : page statique auto-suffisante,
  4 volets, calcul en Web Crypto, zéro requête réseau.
- `exemples/` : **cas canonique réel** — lot `demonstration-notes-2026-S1`,
  racine `b133a459…867b` ancrée au **bloc Bitcoin 963516**, vérifiée par
  les outils officiels OpenTimestamps (voir exemples/README.md).

Pistes suivantes probables : section « Ancrage » côté sparkso-universites
(le contrat est dans EXTRACTION.md §3) ; extension EVM (SPEC §11, type
d'attestation réservé — sans changement de format).

## Conventions (obligatoires)

- **Tout en français** : documentation, messages CLI, commits.
- Commits : imparfait de récit court, ex. « Spec : le témoin v1 et la
  sérialisation canonique ».
- Vocabulaire : « états certifiés par ancrage public », jamais
  « officiels » ; promettre « au plus tard au bloc B », jamais une
  date-heure (dérive ~2 h des blocs Bitcoin).
- **Pédagogie** : l'utilisateur ne se considère pas expert. Expliquer
  chaque terme technique à sa première apparition, avec une image
  concrète (empreinte = empreinte digitale, sel = ingrédient secret,
  arbre = tournoi, ancrage = dépôt daté au registre public). Dérouler
  pas à pas. Les messages de la CLI et les pages suivent ce principe.
- Sérialisation canonique : RFC 8785 restreinte, **flottants interdits** ;
  Merkle façon RFC 6962 (préfixes 0x00/0x01, promotion du nœud orphelin,
  **jamais** de duplication — CVE-2012-2459).
- Les noms de champs du témoin (`sel`, `racine`, `gauche`…) sont des
  identifiants **figés**, jamais traduits. Le nom de fichier
  `.temoin.json` n'est qu'une convention.

## Les deux pages du vérifieur

`verifieur/index.html` (FR) et `verifieur/en.html` (EN) sont des copies
miroirs : **toute modification de l'une doit être répercutée dans
l'autre**. Style imposé (façon prismdata.com) : fond #08090d, halo
vert/violet, onglets pilule, accent #3ecf8e, logo Sparkso = hexagone de
19 hexagones décliné en vert. Aucune ressource externe (ni police, ni
image liée — les captures du guide sont embarquées en data-URI). Le volet
« Le parcours d'un témoin » sert de tableau de suivi : le tenir à jour à
chaque brique livrée.

## Frontière stricte

Dans ce dépôt : canonique, hachage salé, Merkle, témoin, ancrage,
vérification, page vérifieur, CLI. Zéro infrastructure (ni base de
données, ni framework web). Hors de ce dépôt (projets clients) : quoi
ancrer, quand, stockage des données/sels, écrans d'admin, remise des
témoins aux utilisateurs.
