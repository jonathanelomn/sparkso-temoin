// Le pont vers OpenTimestamps — la seule partie du projet qui touche au
// réseau. On s'appuie sur la bibliothèque JavaScript OFFICIELLE
// d'OpenTimestamps (l'implémentation de référence) : c'est la meilleure
// garantie que nos preuves .ots restent lisibles par l'outil officiel
// « ots » — l'outil d'un tiers, notre jalon d'interopérabilité.
// (La lib/ du projet, elle, reste à zéro dépendance : ce fichier n'est
// utilisé que par les commandes « ancrer » et « completer ».)

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const OTS = require('opentimestamps');

/**
 * Dépose une racine (32 octets) auprès des calendriers OpenTimestamps
 * publics. Retourne les octets du fichier .ots — une preuve INCOMPLÈTE :
 * elle ne référence que les calendriers, en attendant la confirmation
 * Bitcoin (quelques heures).
 */
export async function ancrerRacine(racineOctets) {
  const detache = OTS.DetachedTimestampFile.fromHash(new OTS.Ops.OpSHA256(), racineOctets);
  await OTS.stamp(detache);
  return Buffer.from(detache.serializeToBytes());
}

/**
 * Tente de mettre à niveau une preuve .ots (équivalent de « ots
 * upgrade ») : interroge les calendriers ; si Bitcoin a confirmé, la
 * preuve devient complète et se termine par une attestation désignant
 * un bloc.
 *
 * Retourne { octets, bloc } :
 *  - octets : la preuve (mise à niveau si possible, sinon inchangée) ;
 *  - bloc : la hauteur du bloc Bitcoin, ou null si pas encore confirmé.
 */
export async function completerPreuve(octetsOts) {
  const detache = OTS.DetachedTimestampFile.deserialize(Array.from(octetsOts));
  let change = false;
  try {
    change = await OTS.upgrade(detache);
  } catch {
    // Les calendriers peuvent être injoignables : on repart de la preuve telle quelle.
  }
  const octets = change ? Buffer.from(detache.serializeToBytes()) : Buffer.from(octetsOts);

  let bloc = null;
  for (const attestation of detache.timestamp.getAttestations()) {
    if (attestation instanceof OTS.Notary.BitcoinBlockHeaderAttestation) {
      // En cas d'attestations multiples, on retient le bloc le plus ancien
      // (le plus petit numéro) : c'est la borne « au plus tard » la plus forte.
      if (bloc === null || attestation.height < bloc) bloc = attestation.height;
    }
  }
  return { octets, bloc };
}
