# verifieur/

Page HTML statique **unique et auto-suffisante** : tout le calcul dans le
navigateur (API Web Crypto), rien n'est envoyé nulle part — constatable
dans l'onglet réseau, c'est un argument de crédibilité. On y dépose un
témoin JSON (ou un fichier scellé).

Portée v1, assumée et affichée : la page recalcule l'empreinte et le
chemin de Merkle jusqu'à la racine R, puis affiche « conforme à son
témoin ; racine R à constater dans le bloc B » avec un lien pré-rempli
vers un explorateur public. Le parsing complet de la preuve OTS en
navigateur est hors v1.

La page se copie telle quelle dans n'importe quel export statique
(ex. `iugm.sparkso.mg/verifier/`) : elle doit le rester.
