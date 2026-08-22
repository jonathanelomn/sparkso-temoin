# Le lot d'extraction — le pont entre une plateforme et sparkso-temoin

Ce document définit **comment une plateforme** (Sparkso Universités pour
l'IUGM, ou n'importe quel autre projet) **prépare ses données à sceller**,
et **où** cela doit vivre chez elle. Il complète [SPEC.md](SPEC.md) : la
spec dit ce qu'est un témoin ; ce document dit comment on alimente le
système, simplement et toujours de la même façon.

Rappel de la frontière : sparkso-temoin ne connaît rien du métier. C'est
la plateforme qui choisit **quoi** sceller et **quand** ; sparkso-temoin
reçoit des enregistrements, rend des témoins.

## 1. Le fichier « lot d'extraction »

Une extraction = **un fichier JSON**, que la plateforme sait produire en un
clic. Sa forme :

```json
{
  "format": 1,
  "lot": "iugm-notes-2026-S1",
  "cree": "2026-08-22T10:00:00Z",
  "enregistrements": [
    { "etudiant": "2026-0417", "cours": "ALG-101", "note": 17, "session": "2026-S1" },
    { "etudiant": "2026-0912", "cours": "ALG-101", "note": 12, "session": "2026-S1" }
  ]
}
```

- `format` : `1` — la version de ce format de lot.
- `lot` : un identifiant choisi par la plateforme, unique chez elle,
  stable dans le temps (recommandé : `instance-objet-période`).
- `cree` : la date de l'extraction, ISO 8601 UTC (suffixe `Z`).
- `enregistrements` : la liste des données à sceller. Chaque élément est
  un enregistrement JSON **conforme aux règles de la spec (§4)** :
  dates en ISO 8601 UTC, **aucun nombre à virgule** (écrire `"12.50"` ou
  des centimes entiers), pas de clés dupliquées. C'est la seule
  contrainte que la plateforme doit respecter — le reste (mise en forme
  canonique, sels, arbre, ancrage) est le travail de sparkso-temoin.

Le contenu des enregistrements appartient à la plateforme. Deux conseils :

- **Autonome** : un enregistrement doit rester compréhensible seul dans
  dix ans (mettre `"cours": "ALG-101"` plutôt qu'un identifiant interne
  de base de données qui n'existera peut-être plus).
- **Stable** : sceller l'état final d'une donnée (une note validée, un
  diplôme délivré), pas un brouillon.

## 2. Ce que la plateforme reçoit en retour

Pour un lot de N enregistrements, sparkso-temoin rend :

- **N sels** (un par enregistrement) — secrets, à stocker avec les
  données, à détruire avec elles (droit à l'effacement, spec §10) ;
- **N témoins** (un fichier `.temoin.json` par enregistrement) — à
  remettre à chaque propriétaire (l'étudiant, par exemple) ;
- **une racine** et **une preuve `.ots`**, communes au lot — d'abord
  incomplète, complétée quelques heures plus tard.

## 3. L'endroit explicite chez chaque plateforme

Chaque plateforme doit offrir **un seul lieu, nommé et visible**, pour
tout ce qui touche à l'ancrage — recommandation : une section
d'administration « **Ancrage** » avec :

1. un bouton « Extraire les données à sceller » qui produit le lot
   ci-dessus (la plateforme décide du périmètre : la session close, la
   promotion diplômée…) ;
2. la liste des lots avec leur état — `extrait` → `ancré (en attente)` →
   `complété` → `témoins remis` ;
3. un lien vers la page de vérification publique de l'instance
   (ex. `iugm.sparkso.mg/verifier/`).

Et côté stockage de l'instance, une arborescence unique :

```
ancrage/
  extractions/  iugm-notes-2026-S1.json          # les lots produits
  sels/         iugm-notes-2026-S1.sels.json     # SECRETS — avec les données
  temoins/      iugm-notes-2026-S1/*.temoin.json # un reçu par enregistrement
  preuves/      iugm-notes-2026-S1.ots           # la preuve OpenTimestamps
```

Attention : **sels et témoins contiennent les données en clair** — ils se
stockent et se protègent comme les données elles-mêmes, jamais dans un
dépôt public. Seule la page de vérification est publique.

## 4. Le trajet complet, en une ligne

Plateforme : produit `extractions/<lot>.json` → sparkso-temoin (CLI) :
émet sels + témoins, ancre la racine, complète la preuve → plateforme :
range sels et preuves, remet les témoins → quiconque : vérifie sur la
page publique.
