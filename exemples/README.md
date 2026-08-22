# exemples/

**L'exemple canonique du projet — un cas réel, de bout en bout.**

Le 22 août 2026, le lot [`lot-demonstration.json`](lot-demonstration.json)
(trois notes fictives, format d'EXTRACTION.md) a été scellé puis
réellement ancré dans Bitcoin :

- racine du lot :
  `b133a459e42616aaa2338433e6da9d2589a015b117d43098a5d01be47611867b`
- ancrée dans le **bloc Bitcoin 963516**, miné le 22 août 2026 à
  02:43 UTC — à constater sur
  [mempool.space](https://mempool.space/fr/block/963516) ou
  [blockstream.info](https://blockstream.info/block-height/963516).

Contenu du dossier [`ancrage/`](ancrage) (l'arborescence d'EXTRACTION.md §3) :

```
sels/demonstration-notes-2026-S1.sels.json      les 3 sels (fictifs, donc publiables ici)
temoins/demonstration-notes-2026-S1/000N.temoin.json   les 3 témoins, complets
preuves/demonstration-notes-2026-S1.ots         la preuve OpenTimestamps, complète
```

## Le jalon d'interopérabilité — atteint

La preuve a été contrôlée par des outils **que nous n'avons pas écrits** :

1. le client OpenTimestamps officiel (`ots info`) relit notre `.ots` et y
   trouve `BitcoinBlockHeaderAttestation(963516)` (sa vérification
   complète, `ots verify`, demande un nœud Bitcoin local — quiconque en a
   un peut la faire) ;
2. la bibliothèque officielle OpenTimestamps vérifie de bout en bout et
   répond `{ bitcoin: { height: 963516 } }` ;
3. le hachage du bloc 963516 est identique sur deux explorateurs publics
   indépendants.

## Rejouer la vérification vous-même

```
node ../cli/index.js verifier ancrage/temoins/demonstration-notes-2026-S1/0001.temoin.json
```

ou déposez un de ces témoins sur la page `verifieur/index.html`.
Attention : ces témoins contiennent leurs données (fictives) en clair —
c'est uniquement parce qu'elles sont fictives qu'ils sont publiés ici ;
un vrai témoin se garde comme un document personnel.
