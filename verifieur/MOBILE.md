# Audit mobile de la page vérifieur — 22 août 2026

Ce document raconte, pas à pas, la vérification du bon fonctionnement des
deux pages du vérifieur (`index.html` en français, `en.html` en anglais)
sur un écran de téléphone, les trois défauts trouvés, et la façon dont ils
ont été corrigés. Il explique chaque terme technique à sa première
apparition : il doit rester lisible par quelqu'un qui n'a jamais fait de
développement web.

## Pourquoi le téléphone d'abord

Le public final du vérifieur — étudiants, familles, employeurs, notamment
à Mahajanga — consultera très majoritairement depuis un **smartphone**.
Pour beaucoup, le téléphone est le seul écran disponible. Une page qui ne
se vérifie confortablement que sur ordinateur raterait donc sa cible. Le
principe fondateur de la page (tout le calcul se fait localement, aucune
requête réseau) vaut identiquement sur téléphone : rien dans la conception
n'exigeait un grand écran, il fallait seulement s'en assurer.

## Comment l'audit a été mené

L'audit a utilisé un **navigateur piloté par programme** : une vraie copie
de Chromium (le moteur libre qui motorise Chrome et Edge) lancée sans
fenêtre visible — on dit « **headless** », littéralement « sans tête » —
et commandée par un script via la bibliothèque **Playwright** (un outil
d'automatisation de navigateurs). C'est exactement le même moteur de rendu
qu'un vrai téléphone Android ; seule la main qui clique est remplacée par
du code.

Le navigateur a été configuré pour imiter un téléphone courant :

- **Viewport** (la surface visible de la page) de 390 × 844 points — la
  taille d'un iPhone 14 ou d'un Pixel récent ;
- **Densité de pixels** de 2 (chaque point logique est dessiné avec
  2 × 2 pixels physiques, comme sur les écrans « Retina ») ;
- **Écran tactile** activé, pour que la page se sache pilotée au doigt.

Contrôles effectués, sur chacun des quatre volets et dans les deux
langues :

1. **Aucun débordement horizontal** : la largeur totale du contenu ne doit
   jamais dépasser la largeur de l'écran, sinon la page « glisse » de
   côté. Résultat : aucun débordement, avant comme après correction.
2. **Aucune erreur JavaScript** (le langage de programmation exécuté par
   le navigateur, qui fait ici tout le calcul de vérification).
   Résultat : aucune erreur.
3. **Le parcours complet de vérification** : le bouton « Essayer avec
   l'exemple de la spécification » a été actionné dans le navigateur
   mobile ; le moteur a bien recalculé l'empreinte, rejoué le chemin de
   Merkle et affiché le verdict attendu (« Conforme à son témoin — aucune
   antériorité prouvée », l'exemple ne portant pas d'attestation).
4. **Inspection visuelle** de captures d'écran de chaque volet.

## Ce qui fonctionnait déjà bien

La page avait été écrite avec de bons réflexes, qui ont tous été
confirmés :

- la balise `viewport` (l'instruction qui dit au téléphone « affiche à
  l'échelle 1, pas en miniature de page bureau ») était présente ;
- le titre principal utilise `clamp()` (une règle de style qui borne une
  taille entre un minimum et un maximum selon la largeur d'écran) : il
  rétrécit proprement ;
- les longues empreintes hexadécimales (64 caractères) se replient sur
  plusieurs lignes grâce à `overflow-wrap: anywhere` (« autorise la
  coupure n'importe où ») au lieu de pousser la page en largeur ;
- les blocs de code défilent horizontalement **à l'intérieur** de leur
  cadre (`overflow-x: auto`), jamais la page entière ;
- le glisser-déposer, qui n'existe pas au doigt, avait déjà un secours :
  toucher le cadre ouvre le sélecteur de fichiers du téléphone ;
- la frise numérotée du « parcours d'un témoin », les cartes, le verdict
  détaillé : tout se lit confortablement en colonne unique.

## Les trois défauts corrigés

### 1. La barre d'onglets devenait une bulle difforme

Sur grand écran, les quatre onglets tiennent côte à côte dans une
« pilule » horizontale. Sur 390 points de large, ils se repliaient en
quatre lignes **à l'intérieur de la même pilule**, produisant une grosse
bulle aux coins exagérément ronds, aux boutons mal alignés — fonctionnelle
mais visiblement accidentelle.

Correction : une **media query** — une règle de style conditionnelle, qui
ne s'applique que si l'écran remplit une condition, ici « largeur au plus
520 points » — garde la pilule sur **une seule ligne, qui glisse
latéralement au doigt** (le motif habituel des applications mobiles).
La pilule suivante, coupée au bord de l'écran, signale d'elle-même qu'il
y a plus à droite ; et quand on touche un onglet, il se recentre de
lui-même (en respectant le réglage « réduire les animations » de
l'appareil). Une première version en menu vertical, essayée puis montrée
sur un vrai téléphone, occupait quatre lignes d'écran pour un bénéfice
moindre : la rangée glissante lui a été préférée.

### 2. Safari sur iPhone zoomait de force dans le champ de collage

Le champ « collez le témoin ici » utilisait une police de 12,8 px.
Or Safari sur iPhone a un comportement historique : si un champ de saisie
a une police **inférieure à 16 px**, il zoome automatiquement toute la
page au moment où l'on touche le champ — et la page reste grossie ensuite.
C'est l'un des agacements mobiles les plus connus du web.

Correction : sur écran étroit, la police du champ passe à 16 px, le seuil
exact qui désarme ce zoom forcé. (L'apparence sur ordinateur ne change
pas.)

### 3. « Cliquez » n'a pas de sens au doigt

Trois libellés parlaient de « cliquer » ou de « glisser un fichier depuis
votre ordinateur » — des gestes de souris. Sur téléphone, on **touche**.

Correction : chaque libellé concerné existe désormais en deux versions
dans la page (`<span class="si-souris">` / `<span class="si-tactile">`),
et la feuille de style affiche la bonne grâce à la condition
`pointer: coarse` (« pointeur grossier » : le vocabulaire standard du web
pour « cet appareil se pilote au doigt, pas avec un curseur précis »).
Un iPhone lit « Votre témoin JSON — touchez pour choisir un fichier » ;
un ordinateur lit toujours « Déposez ici un témoin JSON — ou cliquez pour
choisir un fichier ». Aucun JavaScript n'est nécessaire : c'est du style
pur, fidèle à l'esprit « page auto-suffisante ».

Les trois corrections ont été appliquées à l'identique dans `index.html`
et `en.html` (règle du miroir), puis re-vérifiées dans le navigateur
mobile : libellés tactiles bien affichés, champ à 16 px, menu d'onglets
propre, toujours aucun débordement ni erreur, verdict de l'exemple
inchangé dans les deux langues.

## Retours du premier test sur un vrai téléphone

Le soir même, un test sur iPhone réel a apporté trois enseignements que
la simulation n'avait pas donnés :

1. **Un aperçu de fichier n'est pas un navigateur.** Ouverte dans
   l'aperçu de pièce jointe d'une application de messagerie ou de
   discussion, la page s'affiche mais son JavaScript est bloqué par le
   bac à sable de sécurité de l'aperçu : rien ne réagit au toucher. Ce
   n'est pas un défaut de la page — pour tester ou utiliser le
   vérifieur, il faut l'ouvrir dans un vrai navigateur (ou tout export
   statique qui la sert telle quelle).
2. **Chaque volet ouvre désormais sur un titre.** Trois volets
   commençaient par un titre de section, le volet « Vérifier un
   témoin » non : l'incohérence se voyait immédiatement en passant de
   l'un à l'autre. Il a reçu le sien (« Votre témoin, vérifié ici
   même »).
3. **Le menu vertical a cédé la place à une rangée glissante.** La
   première correction des onglets (menu vertical) fonctionnait mais
   occupait quatre lignes d'écran ; à l'usage, la rangée d'onglets sur
   une ligne, qui glisse au doigt, s'est révélée plus élégante — voir
   le défaut n° 1 ci-dessus, décrit dans sa forme finale.

## Ce qui reste volontairement hors de portée

Rien de nouveau : comme sur ordinateur, la page recalcule l'empreinte et
le chemin de Merkle, mais la lecture complète de la preuve OpenTimestamps
(le fichier `.ots`) se fait avec le client OpenTimestamps officiel — c'est
la portée v1 assumée, indépendante de l'appareil.

## Refaire l'audit soi-même

À la main, sur un téléphone réel (ou dans le mode « appareil mobile » des
outils de développement d'un navigateur de bureau) :

1. ouvrir la page, parcourir les quatre volets : rien ne doit défiler de
   côté ; la barre d'onglets tient sur une ligne et glisse au doigt,
   l'onglet touché se recentrant tout seul ;
2. dans « Vérifier un témoin », lire les libellés : ils doivent dire
   « touchez », pas « cliquez » ;
3. toucher le champ de collage : la page ne doit pas zoomer (iPhone) ;
4. toucher le cadre en pointillés : le sélecteur de fichiers doit
   s'ouvrir ;
5. « Essayer avec l'exemple de la spécification » : le verdict « Conforme
   à son témoin » doit apparaître avec ses cinq étapes détaillées.

Par programme, l'essentiel du script d'audit (Node.js avec le paquet
`playwright-core` installé **hors du dépôt** — le cœur du projet reste
sans dépendance) :

```js
const { chromium } = require('playwright-core');
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2, isMobile: true, hasTouch: true,
});
const page = await context.newPage();
await page.goto('file:///…/verifieur/index.html');
// Débordement horizontal ?
await page.evaluate(() =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth);
// Parcours réel : bouton exemple, puis lecture du verdict.
await page.getByText("Essayer avec l'exemple").click();
await page.locator('.verdict h2').innerText();
```
