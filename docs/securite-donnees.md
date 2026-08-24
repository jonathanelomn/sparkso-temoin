# Sécurité des données — sparkso-certification

Ce que le système garantit, ce qu'il ne garantit pas, où vivent les
secrets, et les menaces auxquelles la conception répond. En langage
courant ; les fondements formels sont dans [SPEC.md](../SPEC.md)
(sections 5, 10 et 12).

## 1. Ce que le système garantit — et ne garantit pas

**Garanti** : l'**antériorité** (« ces octets existaient au plus tard
au bloc Bitcoin B ») et l'**intégrité** (un seul caractère modifié et
la vérification échoue). Ces garanties ne reposent sur la confiance en
personne : elles se recalculent chez le vérificateur et se constatent
sur un registre public.

**Non garanti** : la **véracité métier** (une note fausse, scellée,
reste fausse — le témoin prouve qu'elle n'a pas changé, pas qu'elle
était juste) et l'**identité** de l'émetteur (le système d'ancrage ne
signe pas ; l'identité relève de la plateforme et de ses circuits de
remise).

## 2. Rien de personnel ne sort jamais

Sur la blockchain, une seule chose est déposée : la **racine** — une
empreinte de 32 octets, un condensé irréversible. Ni données, ni noms,
ni notes, ni même les empreintes individuelles. Publier la racine ne
révèle rien.

## 3. Le sel : le secret qui protège les empreintes

Chaque enregistrement reçoit un **sel** : un grand nombre aléatoire
secret (16 octets), mélangé aux données avant le calcul d'empreinte.
Sans lui, un curieux pourrait « deviner » des données simples en
essayant toutes les possibilités (une note sur 20 : vingt essais) et en
comparant les empreintes. Avec lui, l'essai exhaustif devient
impossible.

Conséquences pratiques :

- le sel vit **hors chaîne**, stocké par la plateforme avec les
  données, et remis au propriétaire dans son témoin ;
- **détruire le sel** (et le témoin) rend l'empreinte à jamais muette :
  c'est le **crypto-shredding** (broyage cryptographique), la réponse
  du système au droit à l'effacement du RGPD (le règlement européen de
  protection des données) — on efface la donnée et son sel, l'arbre
  public ne permet plus rien d'en déduire (SPEC §10) ;
- un **témoin est un document personnel** : il contient les données en
  clair et le sel. Sa confidentialité relève de son porteur (voir le
  guide utilisateur).

## 4. Menaces et parades

| Menace | Parade dans la conception |
|---|---|
| Falsifier des données après coup | L'empreinte ne correspond plus ; la racine ancrée fige tout le lot. |
| Forger un arbre trompeur par duplication de nœuds (CVE-2012-2459, une faille historique des arbres de Merkle) | Arbre façon RFC 6962 : préfixes de domaine 0x00/0x01 et **promotion** du nœud orphelin — jamais de duplication (SPEC §6). |
| Confondre feuille et nœud interne | Les préfixes de domaine rendent les deux calculs incompatibles. |
| Casser SHA-256 (collisions) | État de l'art : aucune attaque connue ; SHA-256 est le socle de Bitcoin lui-même. Le champ `hachage` du témoin permettrait une migration future sans casser le format. |
| Antidater un ancrage | Impossible : le bloc Bitcoin est daté par la chaîne publique, pas par nous. |
| Plateforme malhonnête ou disparue | La vérification n'a pas besoin d'elle : témoin + page (ou outils OpenTimestamps officiels) suffisent. |

## 5. La page vérifieur, côté sécurité

- **Zéro requête réseau** : tout le calcul se fait dans le navigateur
  (API Web Crypto) ; constatable dans l'onglet réseau des outils de
  développement, et prouvé par le fonctionnement hors connexion.
- **Auto-suffisante** : un seul fichier, aucune ressource externe (ni
  script, ni police, ni image liée) — pas de tiers à qui faire
  confiance au chargement, pas de dépendance qui change sous nos pieds.
- Elle ne **stocke rien** : le témoin déposé reste dans la mémoire de
  l'onglet.

## 6. Dépendances (surface d'attaque logicielle)

- `lib/` — le cœur : **zéro dépendance**. Rien à auditer d'autre que
  notre code.
- `cli/` — une seule dépendance : la bibliothèque npm **officielle**
  `opentimestamps`, seule à toucher au réseau, confinée à `cli/ots.js`.
- La page — aucune dépendance.

## 7. Signaler un problème

Une faiblesse trouvée dans la spécification, la bibliothèque ou la
page ? Ouvrir une issue sur le dépôt GitHub (jonathanelomn/sparkso-certification)
en donnant le scénario ; pour un sujet sensible, contacter directement
le mainteneur plutôt que publier le détail.
