# Proposition — attestation « evm » (extension de la SPEC §11)

**Statut : proposition à discuter. Rien ici n'est engagé ni figé.**
La spécification v1 (SPEC.md) reste inchangée : elle réserve seulement,
en sa section 11, un type d'attestation `"evm"` dont la définition précise
relève d'un « complément de spécification ». Ce document est le brouillon
de ce complément, écrit pour pouvoir être lu — et accepté, amendé ou
refusé — sans être expert. Chaque terme technique est défini à sa première
apparition.

## 1. Le but, en une phrase

Permettre qu'une racine déjà ancrée dans Bitcoin soit **aussi** inscrite
sur une blockchain à contrats, pour qu'on puisse la retrouver en deux
touches dans un explorateur public — sans rien changer au format du
témoin ni à la garantie existante.

## 2. Pourquoi un second ancrage

L'ancrage v1 (OpenTimestamps sur Bitcoin) est la référence : gratuit,
extrêmement robuste, adossé à la chaîne la plus éprouvée. Mais sa preuve
est un fichier `.ots` qu'il faut faire lire par un outil dédié. À
l'inverse, sur une chaîne dite « EVM », l'inscription est **directement
lisible par n'importe qui dans un explorateur web** : on colle le numéro
de transaction, on voit la racine, l'heure et le bloc. Les deux ancrages
sont complémentaires :

| | Bitcoin + OpenTimestamps (v1) | Chaîne EVM (proposé) |
|---|---|---|
| Solidité de la preuve | maximale | très bonne |
| Coût | gratuit | quelques fractions de centime |
| Lecture de la preuve | outil OpenTimestamps | explorateur web, direct |
| Rôle | **la** garantie | le confort de consultation |

La spécification l'a prévu dès le départ : `attestations` est un tableau
précisément pour qu'une même racine puisse porter plusieurs ancrages
(SPEC §8.2).

## 3. Les notions, définies une fois

- **EVM** — *Ethereum Virtual Machine*, « machine virtuelle Ethereum » :
  le petit ordinateur simulé que tous les participants du réseau Ethereum
  exécutent à l'identique. Par extension, une « chaîne EVM » est toute
  blockchain compatible avec ce moteur (Ethereum lui-même, Base, etc.).
- **Contrat intelligent** (*smart contract*) : un programme déposé sur la
  chaîne, dont le code est public et que personne ne peut modifier après
  coup. On lui envoie des transactions ; il exécute exactement ce que son
  code dit.
- **Transaction** : l'équivalent d'un virement ou d'un envoi de message
  signé, horodaté par son inclusion dans un bloc. Chaque transaction a un
  identifiant unique (son *hash*, une empreinte), que les explorateurs
  savent retrouver.
- **Événement** (*event*, aussi appelé *log*) : une ligne de journal
  qu'un contrat écrit pendant une transaction. C'est le moyen le moins
  coûteux de rendre une information publique et indexée sur une chaîne
  EVM — parfaite pour publier une racine.
- **Gas** : l'unité qui mesure le coût d'exécution d'une transaction ;
  on le paie dans la monnaie de la chaîne. Écrire un événement consomme
  très peu de gas.
- **chainId** : le numéro d'identification standard d'une chaîne EVM
  (1 = Ethereum, 8453 = Base…). Il évite toute confusion entre chaînes.
- **L2 / rollup** : une « couche 2 », chaîne rapide et bon marché qui
  publie régulièrement son état sur Ethereum (la « couche 1 ») pour
  hériter d'une partie de sa sécurité. Base est un rollup.
- **Finalité** : le moment à partir duquel une transaction ne peut plus
  être annulée par une réorganisation de la chaîne. Sur un rollup, la
  finalité « dure » est atteinte quand l'état est confirmé sur Ethereum.
- **Explorateur** : un site public qui affiche le contenu d'une
  blockchain (blocs, transactions, événements) — c'est le « registre
  consultable » du grand public.

## 4. Ce que la spécification réserve déjà

SPEC §11 fixe la forme, et elle seule :

```json
{ "type": "evm", "chainId": <entier>, "tx": "<hash de transaction>", "contrat": "<adresse>" }
```

avec deux contraintes : **aucun changement de format** (`format` reste
`1`) et un vérifieur v1 doit **ignorer sans erreur** ce type s'il ne le
connaît pas (SPEC §8.2) — le vérifieur actuel le fait déjà, c'est testé
par son étape « attestations » qui compte les types inconnus comme
« ignorés ».

## 5. La proposition

### 5.1 Chaîne : Base (chainId 8453)

Proposition : **Base**, le rollup le plus utilisé, déjà cité comme
candidat dans SPEC §11 (« Ethereum ou Base »). Raisons : coût par
transaction de l'ordre de la fraction de centime ; outillage et
explorateurs matures ; sécurité adossée à Ethereum. Ethereum en direct
resterait possible (même contrat, autre chainId) mais coûte cent à mille
fois plus cher par écriture, pour un bénéfice de confort identique — la
garantie de fond restant, dans les deux cas, l'ancrage Bitcoin.

### 5.2 Un contrat minimal, sans état

Un unique contrat « registre d'ancrage », volontairement minuscule :

```solidity
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// Registre d'ancrage : n'importe qui peut publier une racine de 32
/// octets ; le contrat ne stocke rien, il émet un événement — le bloc
/// qui contient la transaction date la publication.
contract RegistreAncrage {
    event Ancrage(bytes32 indexed racine, address indexed emetteur);

    function ancrer(bytes32 racine) external {
        emit Ancrage(racine, msg.sender);
    }
}
```

Choix assumés, dans l'esprit du projet :

- **Pas de stockage** dans le contrat (pas de tableau des racines) : le
  stockage est la ressource chère des chaînes EVM, et il n'apporte rien —
  l'événement, indexé par les explorateurs, suffit à retrouver la racine
  et son bloc. C'est l'exact parallèle du choix v1 « la préversion de la
  preuve ne référence que des calendriers » : le minimum qui prouve.
- **Pas de contrôle d'accès** : n'importe qui peut appeler `ancrer`.
  Publier une racine n'est jamais dangereux (une empreinte ne révèle
  rien — même logique que SPEC §12) ; ce qui compte pour un vérifieur
  est « cette racine figure dans ce bloc », pas « qui l'a envoyée ».
  `emetteur` est journalisé à titre indicatif seulement.
- **Pas de dépendance, pas de bibliothèque** : environ dix lignes,
  auditable d'un regard, rien à mettre à niveau.

### 5.3 L'attestation produite

Après l'appel à `ancrer(R)` inclus dans un bloc, l'émetteur complète le
témoin (les noms de champs, comme tous ceux du témoin, sont figés et
jamais traduits) :

```json
{ "type": "evm", "chainId": 8453, "tx": "0x<hash>", "contrat": "0x<adresse>" }
```

Champ additionnel proposé pour le complément de spécification, sur le
modèle du champ `bloc` de l'attestation OTS : `"bloc": <entier>`, la
hauteur du bloc **de la chaîne EVM** contenant la transaction, présent
uniquement une fois la transaction confirmée. Il permet d'énoncer la
promesse dans la forme canonique du projet : « racine présente **au plus
tard au bloc N de Base** » — jamais une date-heure.

### 5.4 Vérification

Sans outil : ouvrir un explorateur de la chaîne, coller `tx`, vérifier
que la transaction s'adresse bien à `contrat`, que l'événement `Ancrage`
porte exactement la racine du témoin, et noter le numéro de bloc. Deux
touches, lisible sur téléphone.

Avec outils (extension future de `temoin verifier` et, éventuellement,
du volet « attestations » de la page) : mêmes contrôles via une
interrogation de la chaîne. Comme pour la v1, la page vérifieur pourrait
au minimum **afficher** l'attestation et fournir le lien pré-rempli vers
l'explorateur, sans requête réseau automatique — fidèle au principe
« zéro requête » : c'est l'utilisateur qui touche le lien.

### 5.5 Ce que cela ne change pas

- Le format du témoin (`format: 1`), tous les champs existants, la
  sérialisation canonique, l'arbre de Merkle : intacts.
- Le vérifieur v1 et les témoins déjà émis : intacts (le type inconnu
  est ignoré sans erreur — comportement déjà en place).
- La garantie de référence : l'ancrage Bitcoin. L'attestation « evm »
  est un confort de consultation qui s'y **ajoute**.

## 6. Risques et limites, sans fard

- **Finalité d'un rollup** : quelques secondes après envoi, la
  transaction est quasi certaine, mais la finalité dure (côté Ethereum)
  prend de l'ordre de la journée. La formulation prudente reste « au
  plus tard au bloc N », et la preuve de référence reste Bitcoin.
- **Coût récurrent et clé de signature** : contrairement à
  OpenTimestamps (gratuit, sans compte), écrire sur une chaîne EVM
  demande une clé qui détient un petit solde. La garde de cette clé et
  son approvisionnement sont de l'**infrastructure**, donc hors de ce
  dépôt (frontière stricte) : ils appartiennent au projet client, comme
  le stockage des sels.
- **Pérennité de la chaîne** : Base est opérée par une entreprise
  (Coinbase). Si la chaîne disparaissait un jour, les témoins n'en
  seraient pas invalidés : l'attestation Bitcoin continue de prouver
  l'antériorité. C'est exactement pour cela que l'EVM reste un ancrage
  *secondaire*.

## 7. Étapes proposées (dans l'ordre, chacune validable seule)

1. **Complément de spécification** : un fichier `SPEC-EVM.md` (la SPEC
   v1 n'est pas touchée) fixant l'événement, les encodages (adresse et
   hash en hexadécimal `0x` minuscule), le champ `bloc`, et les vecteurs
   de test correspondants.
2. **Contrat** : le `RegistreAncrage` ci-dessus, avec son test, déployé
   d'abord sur le réseau d'essai de Base (Base Sepolia — un réseau
   identique où la monnaie est gratuite et sans valeur, fait pour
   s'entraîner).
3. **CLI** : `temoin ancrer-evm` (émission de la transaction) et
   l'extension de `temoin verifier` (lecture de l'événement), le réseau
   restant confiné aux modules qui le touchent déjà, à côté de
   `cli/ots.js`.
4. **Page vérifieur** : affichage de l'attestation « evm » avec lien
   pré-rempli vers l'explorateur (dans les deux langues, règle du
   miroir).
5. **Déploiement réel** sur Base, et ancrage EVM du lot de démonstration
   pour disposer, comme pour Bitcoin, d'un cas canonique réel dans
   `exemples/`.

## 8. Décisions attendues avant d'engager quoi que ce soit

1. La chaîne : Base, Ethereum, ou les deux ?
2. Le champ `bloc` additionnel : retenu tel quel ?
3. Qui garde la clé d'écriture et son solde (projet client ? lequel ?) —
   hors de ce dépôt, mais la réponse conditionne l'étape 5.
