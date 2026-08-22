// La bibliothèque doit reproduire, à l'octet près, les vecteurs de test
// de l'annexe A de SPEC.md. C'est sa preuve de conformité : si un de ces
// tests casse, c'est le code qui a tort, jamais la spec.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonique, empreinteFeuille, versHex, emettre, verifier,
} from '../lib/index.js';

const hexVersOctets = (hex) => Buffer.from(hex, 'hex');

// --- Annexe A.1 : sérialisation canonique et feuille seule ---

test('A.1 — la sérialisation canonique trie les clés et garde l’UTF-8', () => {
  const enregistrement = {
    note: 17, cours: 'ALG-101', mention: 'très bien', date: '2026-01-15T08:30:00Z',
  };
  const attendu =
    '{"cours":"ALG-101","date":"2026-01-15T08:30:00Z","mention":"très bien","note":17}';
  assert.equal(canonique(enregistrement), attendu);
  assert.equal(Buffer.from(attendu, 'utf8').length, 82);
});

test('A.1 — l’empreinte de la feuille est celle de la spec', () => {
  const sel = hexVersOctets('000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f');
  const chaine =
    '{"cours":"ALG-101","date":"2026-01-15T08:30:00Z","mention":"très bien","note":17}';
  assert.equal(
    versHex(empreinteFeuille(sel, chaine)),
    '249c0c3ba98b4289915ff807e8f69810978fd64e03e10a9bb02d81c95ea5c9f1');
});

// --- Annexe A.2 : arbre à 3 feuilles ---

const H1 = 'fd45a6c9a58f0692fd14e24c5a9ac1db2f016f0b6f4b5e6ce01ffe9c0c1f3bba';
const H2 = '9c5be57dfe868cdf8b297f34858fb2fc764996d3d4c532b4043d95ba935c9eee';
const H3 = '6b21c078f3d89f7794fa7be19237a9a514c12afaf9b125a1610153f07b2a079e';
const P12 = '619d2265e7a293938e0caf3207c4015658312d78db8d24b8e11bbffd4d659f35';
const RACINE = 'c6c5f4615cc9a453def6b0a1b6999de9528c194a102983475a3e7e84106ebe8e';

function emettreVecteurB() {
  return emettre(
    [{ n: 1 }, { n: 2 }, { n: 3 }],
    { sels: [
      hexVersOctets('11'.repeat(32)),
      hexVersOctets('22'.repeat(32)),
      hexVersOctets('33'.repeat(32)),
    ] });
}

test('A.2 — l’arbre à 3 feuilles donne la racine de la spec (promotion, pas duplication)', () => {
  const { racine, temoins } = emettreVecteurB();
  assert.equal(racine, RACINE);
  assert.deepEqual(temoins.map(t => t.chemin), [
    [{ cote: 'droite', empreinte: H2 }, { cote: 'droite', empreinte: H3 }],
    [{ cote: 'gauche', empreinte: H1 }, { cote: 'droite', empreinte: H3 }],
    [{ cote: 'gauche', empreinte: P12 }],
  ]);
});

test('A.2 — chacun des trois témoins émis se re-vérifie', () => {
  const { temoins } = emettreVecteurB();
  for (const temoin of temoins) {
    const resultat = verifier(temoin);
    assert.equal(resultat.conforme, true, resultat.erreurs.join(' ; '));
    assert.equal(resultat.racineRecalculee, RACINE);
  }
});

test('A.2 — un arbre à une feuille a pour racine sa feuille, chemin vide', () => {
  const { racine, temoins } = emettre([{ n: 3 }], { sels: [hexVersOctets('33'.repeat(32))] });
  assert.equal(racine, H3);
  assert.deepEqual(temoins[0].chemin, []);
});

// --- Annexe A.3 : le témoin complet ---

const VECTEUR_C = {
  format: 1,
  hachage: 'sha-256',
  canonique: '{"n":3}',
  sel: '33'.repeat(32),
  chemin: [{ cote: 'gauche', empreinte: P12 }],
  racine: RACINE,
  attestations: [],
};

test('A.3 — le vecteur C est conforme, sans antériorité prouvée', () => {
  const resultat = verifier(VECTEUR_C);
  assert.equal(resultat.conforme, true);
  assert.equal(resultat.feuille, H3);
  assert.deepEqual(resultat.ancrage, { completes: [], incompletes: 0, inconnues: 0 });
});

test('A.3 — une racine altérée est refusée', () => {
  const altere = { ...VECTEUR_C, racine: RACINE.slice(0, -1) + 'f' };
  const resultat = verifier(altere);
  assert.equal(resultat.conforme, false);
  assert.ok(resultat.erreurs.length > 0);
});

test('les attestations : complètes comptées, incomplètes et types inconnus ignorés sans erreur', () => {
  const temoin = { ...VECTEUR_C, attestations: [
    { type: 'ots', preuve: 'AAEC', bloc: 934210 },
    { type: 'ots', preuve: 'AAEC' },
    { type: 'evm', chainId: 8453 },
  ] };
  const resultat = verifier(temoin);
  assert.equal(resultat.conforme, true);
  assert.deepEqual(resultat.ancrage.completes, [{ bloc: 934210, preuve: 'AAEC' }]);
  assert.equal(resultat.ancrage.incompletes, 1);
  assert.equal(resultat.ancrage.inconnues, 1);
});

// --- Annexe A.4 : cas à rejeter ---

test('A.4 — les nombres flottants, NaN, infinis, -0 et entiers hors bornes sont rejetés', () => {
  for (const interdit of [17.5, NaN, Infinity, -Infinity, -0, 2 ** 53]) {
    assert.throws(() => canonique({ note: interdit }), TypeError);
  }
  assert.equal(canonique({ note: '17.5' }), '{"note":"17.5"}'); // la forme permise
});

test('A.4 — sel de mauvaise taille, cote inconnu, empreinte non hexadécimale : refusés', () => {
  const selCourt = verifier({ ...VECTEUR_C, sel: '3333' });
  assert.equal(selCourt.conforme, false);

  const coteInconnu = verifier({ ...VECTEUR_C,
    chemin: [{ cote: 'haut', empreinte: P12 }] });
  assert.equal(coteInconnu.conforme, false);

  const hexMajuscule = verifier({ ...VECTEUR_C,
    chemin: [{ cote: 'gauche', empreinte: P12.toUpperCase() }] });
  assert.equal(hexMajuscule.conforme, false);
});
