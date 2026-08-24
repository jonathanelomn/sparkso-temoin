# sparkso-certification — Spécification v1

**Format du témoin, sérialisation canonique, sémantique de la garantie.**

Statut : v1, figée. Un témoin émis conformément à cette spécification doit
rester vérifiable sans dépendre du code de ce dépôt : la présente spécification
est l'interface, le code n'en est qu'une implémentation.

Licence de ce document : [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr).
Le code du dépôt est sous Apache-2.0.

---

## 1. Objet

Ce système certifie que des données existaient **au plus tard à un bloc donné**
d'une chaîne publique, et qu'elles n'ont pas été altérées depuis, par ancrage
d'empreintes (hachages salés). Principes non négociables :

- **Aucune donnée personnelle sur la chaîne, jamais.** Seules des empreintes
  sont ancrées. Les données restent chez leur propriétaire.
- **Vérifiable par quiconque, sans confiance envers la plateforme émettrice** :
  la formule de la section 5, le témoin de la section 8 et un explorateur de
  blocs public suffisent.
- **Socle : OpenTimestamps sur Bitcoin** (gratuit, sans portefeuille, standard
  ouvert). Le format du témoin accueille dès la v1 une extension vers une
  chaîne EVM (section 11) sans changement de format.

Le système ne connaît rien du métier : des octets en entrée, un témoin en
sortie. Ce que l'on ancre, quand, et où l'on conserve données et sels relève
de chaque projet consommateur.

## 2. Garantie exacte

Un témoin valide prouve exactement ceci :

> **« Ces octets existaient au plus tard lorsque le bloc B a été miné. »**

Rien de plus. En particulier :

- L'horodatage affiché d'un bloc Bitcoin tolère environ **deux heures de
  dérive** par rapport au temps réel. La présente spécification ne promet
  jamais « à telle date et heure » ; elle promet « au plus tard au bloc B ».
  Toute interface qui affiche une date doit la présenter comme l'horodatage
  du bloc, pas comme celui des données.
- Un témoin ne prouve ni l'exactitude, ni la provenance, ni la sincérité du
  contenu : il prouve l'antériorité et l'intégrité d'octets précis.
- Le vocabulaire recommandé est « **états certifiés par ancrage public** »,
  jamais « officiels » : la valeur juridique dépend du droit applicable ;
  la preuve technique, elle, est forte.

## 3. Notation

- `H` = SHA-256 ([FIPS 180-4]).
- `‖` = concaténation d'octets bruts.
- `canonique(e)` = sérialisation canonique d'un enregistrement `e`
  (section 4), en octets UTF-8.
- `e` = un enregistrement : une valeur JSON (le plus souvent un objet)
  décrivant les données à certifier.
- Les empreintes s'écrivent, dans le témoin, en **hexadécimal minuscule**
  (64 caractères pour SHA-256).

## 4. Sérialisation canonique

Deux implémentations indépendantes doivent produire, pour un même
enregistrement, exactement les mêmes octets. La sérialisation canonique est
**RFC 8785 (JSON Canonicalization Scheme, JCS)**, restreinte comme suit :

1. **Encodage** : UTF-8, sans BOM.
2. **Objets** : clés triées par unités de code UTF-16 croissantes (tri JCS).
   Clés dupliquées interdites.
3. **Chaînes** : échappement minimal de la RFC 8785 §3.2.2.2 (identique à
   `JSON.stringify` d'ECMAScript).
4. **Nombres** : **AUCUN nombre flottant.** Seuls sont admis les entiers
   compris entre −(2⁵³−1) et 2⁵³−1 inclus, sérialisés sans signe `+`, sans
   zéros de tête, sans exposant, et sans `-0`. Toute valeur non entière,
   hors bornes, `NaN` ou infinie **doit être rejetée** par l'émetteur comme
   par le vérifieur. Les quantités décimales (montants, moyennes…)
   s'écrivent en **chaînes décimales** (ex. `"12.50"`) ou en entiers d'une
   sous-unité (ex. centimes). Les flottants sont **interdits par la présente
   spécification**, pas seulement déconseillés.
5. **Dates et heures** : chaînes ISO 8601 en UTC avec suffixe `Z`
   (ex. `"2026-01-15T08:30:00Z"`). Jamais de décalage `+HH:MM`, jamais
   d'heure locale.
6. **Autres valeurs** : `true`, `false`, `null`, tableaux et objets imbriqués
   sont admis et sérialisés selon la RFC 8785.
7. **Aucun blanc** en dehors des chaînes.

Dans le témoin, `canonique(e)` est transportée telle quelle, comme une chaîne
JSON (section 8). Le calcul d'empreinte porte sur **les octets UTF-8 de cette
chaîne**, jamais sur une re-sérialisation.

## 5. Empreintes

### 5.1 Sel

- 32 octets tirés d'un **générateur cryptographiquement sûr** (CSPRNG),
  **propre à chaque enregistrement**, jamais réutilisé.
- Le sel est gardé par le propriétaire des données, hors chaîne. Il rend
  l'empreinte inerte face aux attaques par dictionnaire sur des contenus
  devinables, et permet l'effacement (section 10).
- **Représentation** dans le témoin : hexadécimal minuscule (64 caractères).
- **Dans le calcul** : les 32 octets bruts, décodés de l'hexadécimal.
  Jamais la chaîne hexadécimale elle-même.

### 5.2 Empreinte d'une feuille

Avec séparation de domaine à la manière de la RFC 6962 :

```
h = H( 0x00 ‖ sel ‖ canonique(e) )
```

où `0x00` est un unique octet de valeur zéro.

### 5.3 Nœud interne

```
parent = H( 0x01 ‖ gauche ‖ droite )
```

où `0x01` est un unique octet de valeur un, et `gauche`, `droite` sont les
32 octets bruts des empreintes enfants. Les préfixes `0x00`/`0x01` rendent
impossible la confusion entre une feuille et un nœud interne (attaque par
seconde préimage sur la structure de l'arbre).

## 6. Arbre de Merkle

- Les feuilles `h₁ … hₙ` sont ordonnées par l'émetteur ; l'ordre est encodé
  dans les chemins et n'a pas besoin d'être connu du vérifieur.
- Chaque niveau est construit en appariant les nœuds de gauche à droite :
  `parent = H(0x01 ‖ gauche ‖ droite)`.
- **Nombre impair de nœuds à un niveau** : le nœud orphelin est **promu tel
  quel** au niveau supérieur (à la manière de la RFC 6962). Ne **JAMAIS**
  dupliquer la dernière feuille — la duplication est la cause de la
  vulnérabilité CVE-2012-2459 (Bitcoin) : elle permet à deux ensembles de
  feuilles distincts de produire la même racine.
- La racine `R` est l'unique nœud du dernier niveau. Un arbre à une seule
  feuille a pour racine cette feuille (`R = h₁`).
- Le **chemin** d'une feuille est la liste, du bas vers le haut, des
  empreintes sœurs avec leur côté (`gauche` ou `droite`). Un niveau où le
  nœud courant est promu sans sœur ne contribue **aucun** élément au chemin.

### 6.1 Repli d'un chemin

```
repli(h, chemin) :
  courant ← h
  pour chaque {cote, empreinte} du chemin, dans l'ordre :
    si cote = "gauche" : courant ← H(0x01 ‖ empreinte ‖ courant)
    si cote = "droite" : courant ← H(0x01 ‖ courant ‖ empreinte)
  retourner courant
```

`cote` désigne la position de l'empreinte **sœur**, pas celle du nœud courant.

## 7. Ancrage

La racine `R` est scellée via **OpenTimestamps** : ses octets sont soumis aux
calendriers publics, qui les agrègent dans une transaction Bitcoin. La preuve
prend la forme d'un fichier `.ots` ([format OpenTimestamps]).

Cycle de vie d'une preuve OTS :

1. **Incomplète** à l'émission : elle ne référence que des calendriers.
2. **Complète** quelques heures plus tard, après confirmation Bitcoin : mise
   à niveau auprès des calendriers (équivalent de `ots upgrade`), elle se
   termine alors par une attestation Bitcoin désignant le bloc `B`.

Un témoin dont l'attestation est encore incomplète est **structurellement
valide mais ne prouve encore aucune antériorité** ; il doit être complété
puis re-vérifié.

## 8. Format du témoin v1

Le témoin d'un enregistrement `e` est un document JSON :

```
T(e) = { format, hachage, canonique, sel, chemin, racine, attestations }
```

### 8.1 Champs

| Champ | Type | Contenu |
|---|---|---|
| `format` | entier | `1`. **Premier champ** du document émis. |
| `hachage` | chaîne | `"sha-256"`, explicite (agilité cryptographique : une v2 pourra en changer sans ambiguïté). |
| `canonique` | chaîne | La sérialisation canonique de `e`, telle quelle (section 4). |
| `sel` | chaîne | Le sel, hexadécimal minuscule, 64 caractères. |
| `chemin` | tableau | Chemin de Merkle, de la feuille vers la racine. Chaque élément : `{"cote": "gauche"|"droite", "empreinte": "<hex>"}`. Tableau vide pour un arbre à une feuille. |
| `racine` | chaîne | La racine `R`, hexadécimal minuscule, 64 caractères. |
| `attestations` | tableau | Les attestations d'ancrage de `R` (§8.2). Peut être vide tant que l'ancrage n'est pas réalisé ; le témoin ne prouve alors aucune antériorité. |

### 8.2 Attestations

`attestations` est un **tableau**, pas un champ unique : une même racine peut
être ancrée sur plusieurs chaînes. La v1 ne définit qu'un type :

```json
{ "type": "ots", "preuve": "<base64 du fichier .ots>", "bloc": B }
```

- `preuve` : le contenu binaire du fichier `.ots`, en **base64 standard**
  (RFC 4648 §4, avec `+`, `/` et bourrage `=`).
- `bloc` : entier, hauteur du bloc Bitcoin, présent **uniquement** quand la
  preuve est complète. Son absence signale une preuve incomplète.

Le type `"evm"` est **réservé** pour l'extension de la section 11. Un
vérifieur v1 doit **ignorer sans erreur** les attestations d'un type qu'il
ne connaît pas, tant qu'au moins une attestation lui est intelligible ou que
le tableau est vide.

### 8.3 Encodages (figés)

- Empreintes (`empreinte`, `racine`) : **hexadécimal minuscule**.
- Sel : **hexadécimal minuscule**.
- Preuve OTS : **base64 standard**.
- Côtés du chemin : les chaînes exactes `"gauche"` et `"droite"`.
- Le document témoin lui-même n'a pas besoin d'être canonique ; seule la
  valeur du champ `canonique` l'est. `format` est émis en premier champ,
  mais un vérifieur ne doit pas dépendre de l'ordre des champs.

### 8.4 Exemple

```json
{
  "format": 1,
  "hachage": "sha-256",
  "canonique": "{\"n\":3}",
  "sel": "3333333333333333333333333333333333333333333333333333333333333333",
  "chemin": [
    { "cote": "gauche", "empreinte": "619d2265e7a293938e0caf3207c4015658312d78db8d24b8e11bbffd4d659f35" }
  ],
  "racine": "c6c5f4615cc9a453def6b0a1b6999de9528c194a102983475a3e7e84106ebe8e",
  "attestations": [
    { "type": "ots", "preuve": "<base64 du .ots>", "bloc": 934210 }
  ]
}
```

(Les empreintes de cet exemple sont celles du vecteur B de l'annexe A ;
l'attestation est illustrative.)

## 9. Vérification

Entrée : un témoin `T`. Étapes :

1. **Format** : `T.format = 1` ; `T.hachage = "sha-256"` ; sinon, rejeter
   (ou déléguer à un vérifieur du format annoncé).
2. **Feuille** : décoder `T.sel` de l'hexadécimal (32 octets exigés) ;
   calculer `h = H(0x00 ‖ sel ‖ octets UTF-8 de T.canonique)`.
3. **Repli** : `R' = repli(h, T.chemin)` avec les préfixes `0x01` (§6.1).
4. **Racine** : valide ⇔ `R' = T.racine` (comparaison des octets, après
   décodage hexadécimal).
5. **Ancrage** : une attestation `ots` complète prouve que `R` est ancrée
   dans le bloc `B`, constatable sur n'importe quel explorateur Bitcoin
   public. La vérification de la preuve `.ots` peut être faite avec le
   client OpenTimestamps officiel — l'outil d'un tiers, précisément pour
   ne pas avoir à croire l'émetteur.

Si les données originales sont disponibles, le vérifieur peut en outre les
re-sérialiser (section 4) et exiger l'égalité avec `T.canonique` : cela lie
le témoin aux données réellement détenues, pas seulement à la chaîne
transportée dans le témoin.

## 10. Effacement et RGPD

La chaîne ne porte **rien d'effaçable** : ni données, ni données
pseudonymisées — uniquement des empreintes salées, incalculables et
inversables par personne sans le sel.

La **destruction du sel et des données** rend l'empreinte ancrée inerte :
elle ne permet plus **ni de retrouver, ni même de confirmer** le contenu,
y compris pour un contenu devinable (c'est le rôle du sel de 32 octets par
enregistrement). C'est le **crypto-shredding** : la réponse du système au
droit à l'effacement. Ce qui est effaçable est hors chaîne, chez le
propriétaire des données ; ce qui est sur la chaîne n'a jamais rien porté
d'effaçable.

Conséquence opérationnelle pour les projets consommateurs : le sel fait
partie des données personnelles au sens de la gestion du cycle de vie — il
se stocke avec elles et se détruit avec elles.

## 11. Extension réservée : attestation « evm »

Pour la lisibilité directe dans un explorateur, une extension prévue scelle
la même racine `R` sur **une** chaîne EVM (Ethereum ou Base). Elle
n'introduira **aucun changement de format** : uniquement un nouveau type
dans `attestations`, de la forme réservée :

```json
{ "type": "evm", "chainId": <entier>, "tx": "<hash de transaction>", "contrat": "<adresse>" }
```

La définition précise (contrat, événement, encodage exact) relèvera d'un
complément de spécification ; le champ `format` restera `1`.

## 12. Considérations de sécurité

- **Séparation de domaine** : les préfixes `0x00` (feuille) et `0x01`
  (nœud) sont obligatoires ; sans eux, un nœud interne peut être présenté
  comme une feuille.
- **Promotion, jamais duplication** : voir section 6 et CVE-2012-2459.
- **Sel unique par enregistrement** : un sel réutilisé permet de relier des
  enregistrements entre eux et affaiblit la protection par dictionnaire.
- **Comparaisons** : comparer des octets décodés, pas des chaînes
  hexadécimales (insensibilité à la casse accidentelle interdite : l'hex
  est minuscule, mais la comparaison ne doit pas en dépendre).
- Un témoin est **public par nature** dès lors que `canonique` contient les
  données : ne remettre un témoin qu'à qui peut connaître l'enregistrement.

---

## Annexe A — Vecteurs de test

Sans ces vecteurs, aucune implémentation indépendante ne peut se valider.
Toutes les empreintes sont SHA-256 en hexadécimal minuscule.

### A.1 Vecteur A — sérialisation canonique et feuille seule

Enregistrement (dans un ordre de clés quelconque à l'entrée) :

```json
{ "note": 17, "cours": "ALG-101", "mention": "très bien", "date": "2026-01-15T08:30:00Z" }
```

Sérialisation canonique attendue (82 octets UTF-8 — le `è` de « très »
compte pour deux octets) :

```
{"cours":"ALG-101","date":"2026-01-15T08:30:00Z","mention":"très bien","note":17}
```

Octets UTF-8 de la sérialisation canonique, en hexadécimal :

```
7b22636f757273223a22414c472d313031222c2264617465223a22323032362d30312d31
355430383a33303a30305a222c226d656e74696f6e223a227472c3a873206269656e222c
226e6f7465223a31377d
```

Sel (32 octets, donné en hexadécimal) :

```
000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f
```

Empreinte de feuille attendue, `h = H(0x00 ‖ sel ‖ canonique)` :

```
249c0c3ba98b4289915ff807e8f69810978fd64e03e10a9bb02d81c95ea5c9f1
```

Pour un arbre réduit à cette seule feuille : `chemin = []` et `racine = h`.

### A.2 Vecteur B — arbre à 3 feuilles

Trois enregistrements et leurs sels :

| Feuille | Enregistrement | `canonique` | Sel (hex) |
|---|---|---|---|
| 1 | `{"n":1}` | `{"n":1}` | `11` répété 32 fois (`1111…11`, 64 caractères) |
| 2 | `{"n":2}` | `{"n":2}` | `22` répété 32 fois |
| 3 | `{"n":3}` | `{"n":3}` | `33` répété 32 fois |

Empreintes de feuilles attendues :

```
h1 = fd45a6c9a58f0692fd14e24c5a9ac1db2f016f0b6f4b5e6ce01ffe9c0c1f3bba
h2 = 9c5be57dfe868cdf8b297f34858fb2fc764996d3d4c532b4043d95ba935c9eee
h3 = 6b21c078f3d89f7794fa7be19237a9a514c12afaf9b125a1610153f07b2a079e
```

Construction (3 est impair : `h3` est **promu tel quel** au niveau 1) :

```
p12 = H(0x01 ‖ h1 ‖ h2)
    = 619d2265e7a293938e0caf3207c4015658312d78db8d24b8e11bbffd4d659f35
R   = H(0x01 ‖ p12 ‖ h3)
    = c6c5f4615cc9a453def6b0a1b6999de9528c194a102983475a3e7e84106ebe8e
```

Chemins attendus (`cote` = position de l'empreinte sœur) :

| Feuille | Chemin |
|---|---|
| 1 | `[{"cote":"droite","empreinte":h2}, {"cote":"droite","empreinte":h3}]` |
| 2 | `[{"cote":"gauche","empreinte":h1}, {"cote":"droite","empreinte":h3}]` |
| 3 | `[{"cote":"gauche","empreinte":p12}]` |

Contrôle : le repli (§6.1) de chacun des trois chemins doit redonner `R`.

### A.3 Vecteur C — témoin complet (feuille 3 du vecteur B)

Témoin structurellement valide, sans attestation (état « en attente
d'ancrage ») :

```json
{
  "format": 1,
  "hachage": "sha-256",
  "canonique": "{\"n\":3}",
  "sel": "3333333333333333333333333333333333333333333333333333333333333333",
  "chemin": [
    { "cote": "gauche", "empreinte": "619d2265e7a293938e0caf3207c4015658312d78db8d24b8e11bbffd4d659f35" }
  ],
  "racine": "c6c5f4615cc9a453def6b0a1b6999de9528c194a102983475a3e7e84106ebe8e",
  "attestations": []
}
```

Résultat attendu de la vérification (§9) : étapes 1 à 4 **valides** ;
étape 5 : **aucune antériorité prouvée** (pas d'attestation).

### A.4 Cas à rejeter

Une implémentation conforme doit rejeter, à l'émission comme à la
vérification :

- un enregistrement contenant un nombre flottant (`{"note": 17.5}`),
  `NaN`, un infini, `-0`, ou un entier hors de ±(2⁵³−1) ;
- un sel dont le décodage hexadécimal ne fait pas exactement 32 octets ;
- un `cote` différent des chaînes exactes `"gauche"` ou `"droite"` ;
- une empreinte qui n'est pas 64 caractères hexadécimaux.

---

[FIPS 180-4]: https://csrc.nist.gov/publications/detail/fips/180/4/final
[format OpenTimestamps]: https://opentimestamps.org/
