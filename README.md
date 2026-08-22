# sparkso-temoin

**États certifiés par ancrage public.** Des octets en entrée, un témoin en
sortie : ce système certifie que des données existaient au plus tard à un
bloc donné d'une chaîne publique et n'ont pas été altérées depuis, par
ancrage d'empreintes salées — jamais des données elles-mêmes.

- **Aucune donnée personnelle sur la chaîne, jamais.** On n'ancre que des
  empreintes (hachages salés) ; les données restent chez leur propriétaire.
- **Vérifiable par quiconque, sans confiance envers la plateforme** : la
  formule, le témoin et un explorateur public suffisent. C'est pourquoi ce
  dépôt — spécification et vérifieur compris — est public : l'argument
  « vérifiable par quiconque » se constate.
- **Socle : OpenTimestamps sur Bitcoin** (gratuit, sans portefeuille,
  standard ouvert). Le format accueille dès la v1 une extension vers une
  chaîne EVM, sans changement de format.

La vraie interface est **[SPEC.md](SPEC.md)** : format du témoin v1,
sérialisation canonique (RFC 8785 restreinte), formule d'empreinte avec
séparation de domaine (RFC 6962), sémantique exacte de la garantie
(« au plus tard au bloc B »), effacement (crypto-shredding), et vecteurs
de test en annexe. Un témoin émis en 2026 doit rester vérifiable en 2036
avec la spec seule.

## Structure

```
SPEC.md              la spécification v1 — l'interface du système
EXTRACTION.md        le lot d'extraction : comment une plateforme alimente le système
PROPOSITION-EVM.md   proposition (à discuter) : ancrage secondaire sur chaîne EVM
lib/                 le cœur : canonique(), Merkle, témoin — zéro dépendance
cli/                 ancrer / completer / verifier / temoin
verifieur/           page statique auto-suffisante (un fichier HTML par langue,
                     testée sur téléphone — voir verifieur/MOBILE.md)
exemples/            fichiers d'essai et leurs témoins
docs/                guide utilisateur, plan de test, sécurité, avancements
```

## Frontière du projet

**Dans** ce projet (générique, aucune connaissance du métier) :
sérialisation canonique, hachage salé, arbre de Merkle, format du témoin,
ancrage, vérification, page vérifieur, CLI. Zéro dépendance
d'infrastructure.

**Hors** de ce projet (chaque projet client) : quoi ancrer, quels
événements métier déclenchent un sceau, le stockage des instantanés et
des sels, les écrans d'admin, l'activation.

## Consommation

Dépendance `package.json` par URL git (pas de publication npm pour
l'instant). La page `verifieur/` se copie telle quelle dans n'importe quel
export statique — chaque instance l'héberge à sa propre adresse ; elle est
auto-suffisante et n'envoie rien nulle part (constatable dans l'onglet
réseau du navigateur).

## Vocabulaire

Dire « états certifiés par ancrage public », jamais « officiels » : la
valeur juridique dépend du droit applicable ; la preuve technique, elle,
est forte. Un témoin valide prouve exactement « ces octets existaient au
plus tard lorsque le bloc B a été miné » — voir SPEC.md, section 2.

## Licences

- Code : [Apache-2.0](LICENSE).
- [SPEC.md](SPEC.md) : [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr).
