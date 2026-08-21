# cli/

Quatre commandes :

- `temoin` — émettre les témoins d'un lot d'enregistrements (calcul pur).
- `verifier` — vérifier un témoin (calcul pur).
- `ancrer` — sceller une racine via les calendriers OpenTimestamps
  (réseau ; produit une preuve **incomplète**).
- `completer` — mettre à niveau une preuve OTS après confirmation Bitcoin
  (équivalent de `ots upgrade`) ; une preuve est incomplète à l'émission
  et le devient quelques heures plus tard via les calendriers publics —
  la CLI gère cet état intermédiaire proprement (SPEC.md §7).

Construites en dernier, après SPEC.md, le vérifieur et la lib.
