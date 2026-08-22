# Guide utilisateur — sparkso-temoin

Ce guide s'adresse d'abord à la personne qui **détient un témoin** (un
étudiant, une famille, un employeur qui a reçu le fichier) ; sa
dernière partie s'adresse aux équipes qui **intègrent** le système dans
une plateforme. Chaque terme technique est expliqué à sa première
apparition.

## 1. Qu'est-ce qu'un témoin ?

Un **témoin** est un reçu numérique : un petit fichier (nom se
terminant par `.temoin.json`) remis quand un enregistrement — une note,
un diplôme, n'importe quelle donnée — a été **scellé**. Il permet de
prouver plus tard, à n'importe qui, que « ces données existaient déjà à
telle époque et n'ont pas été modifiées depuis », **sans avoir à croire
la plateforme qui l'a émis** : la preuve s'appuie sur la blockchain
Bitcoin, un registre public que personne ne peut réécrire.

Le témoin contient : vos données (en clair), un **sel** (un grand
nombre secret propre à votre enregistrement — l'ingrédient qui empêche
quiconque de deviner vos données à partir des empreintes publiques), le
**chemin** de calcul, la **racine** (l'empreinte-résumé du lot), et
l'**attestation** d'ancrage (la preuve, avec le numéro du bloc Bitcoin).

## 2. Conserver son témoin

Traitez-le comme un document personnel — un relevé de notes, un
livret : il contient vos données et votre sel secret.

- **Gardez-en plusieurs copies** (téléphone, clé USB, courriel à
  vous-même…). Sans lui, la plateforme peut en général le réémettre,
  mais lui seul vous rend indépendant d'elle.
- **Ne le publiez pas** : le montrer, c'est montrer vos données.
  Transmettez-le uniquement à qui doit vérifier (un employeur, une
  administration).

## 3. Vérifier un témoin

Ouvrez la page de vérification (`verifieur/index.html`, ou son adresse
publiée par votre établissement ; version anglaise : `en.html`). Elle
fonctionne aussi **hors connexion** : tout le calcul se fait dans votre
navigateur, rien n'est envoyé nulle part.

1. Volet « Vérifier un témoin » : touchez le cadre en pointillés et
   choisissez votre fichier (ou collez son contenu dans le champ).
2. La vérification se lance seule et détaille chaque étape du calcul.
3. Lisez le verdict :
   - **Vert — « Conforme à son témoin »** avec un numéro de bloc : les
     calculs sont justes **et** la racine est ancrée ; la page donne le
     lien vers un explorateur public pour constater le bloc.
   - **Jaune — « aucune antériorité prouvée »** : les calculs sont
     justes mais le témoin n'est pas encore ancré (ou sa preuve n'est
     pas complétée) ; il doit être complété puis revérifié.
   - **Rouge** : quelque chose ne correspond pas — données modifiées,
     fichier abîmé ou falsifié. Le détail des étapes dit quoi.

Le volet « Guide pas à pas » de la page illustre tout cela capture par
capture, et le volet « Comprendre le système » explique les notions.

La promesse exacte est toujours « ces octets existaient **au plus tard
au bloc B** » — jamais une date-heure précise : l'horodatage affiché
d'un bloc Bitcoin tolère environ deux heures de dérive.

## 4. Vérifier sans nous croire du tout

La page recalcule l'empreinte et le chemin jusqu'à la racine. Pour le
contrôle ultime — relire la preuve d'ancrage elle-même — utilisez les
outils du standard ouvert **OpenTimestamps** (opentimestamps.org),
développés par des tiers : téléchargez la preuve `.ots` depuis la page
(bouton proposé quand le témoin est ancré), puis `ots verify`. C'est
volontaire : notre système est conçu pour être vérifiable par des
outils que nous n'avons pas écrits.

## 5. Pour les intégrateurs (plateformes)

Le cycle complet côté plateforme, avec l'outil en ligne de commande
(`temoin`) :

1. `temoin emettre` — sceller un lot d'enregistrements : témoins émis,
   racine calculée (aucun réseau) ;
2. `temoin ancrer` — déposer la racine via OpenTimestamps (seul moment
   qui touche au réseau) ;
3. `temoin completer` — quelques heures plus tard, compléter la preuve
   avec le bloc Bitcoin confirmé ;
4. `temoin verifier` — contrôler un témoin de bout en bout.

Le format d'échange entre votre plateforme et cet outil est défini dans
[EXTRACTION.md](../EXTRACTION.md) ; le format du témoin, figé, dans
[SPEC.md](../SPEC.md). Ce qui reste à votre charge : choisir quoi
sceller et quand, conserver données et sels, remettre les témoins à
leurs propriétaires (voir la frontière du projet dans le
[README](../README.md)).
