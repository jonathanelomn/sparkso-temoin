# cli/

L'outil en ligne de commande. Quatre commandes qui suivent la vie d'un
lot (voir [EXTRACTION.md](../EXTRACTION.md)), chacune expliquant ce
qu'elle fait en français courant :

```
temoin emettre <lot.json>      fabrique sels + témoins + racine   (pur calcul)
temoin ancrer <lot>            dépose la racine dans Bitcoin      (réseau)
temoin completer <lot>         récupère la preuve confirmée       (réseau)
temoin verifier <t.temoin.json> contrôle un témoin, pas à pas     (pur calcul)
```

`temoin aide` affiche le déroulé complet. Option commune :
`--dossier <chemin>` (défaut `ancrage`), l'arborescence d'EXTRACTION.md §3.

`completer` gère proprement l'état intermédiaire d'OpenTimestamps : une
preuve est incomplète à l'émission et le devient quelques heures plus
tard via les calendriers publics (équivalent de `ots upgrade`) — tant
que Bitcoin n'a pas confirmé, la commande le dit et sort avec le code 2.

Seul ce dossier touche au réseau, via la bibliothèque JavaScript
**officielle** d'OpenTimestamps (implémentation de référence — la
meilleure garantie d'interopérabilité avec l'outil officiel `ots`).
La `lib/` du projet reste, elle, à zéro dépendance.
