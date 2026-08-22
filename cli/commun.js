// Petites fonctions partagées par les commandes : lecture/écriture de
// fichiers, mise en couleur des messages, arborescence « ancrage/ »
// (voir EXTRACTION.md §3).

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const enTerminal = process.stdout.isTTY;
const teinte = (code) => (texte) => enTerminal ? `\x1b[${code}m${texte}\x1b[0m` : String(texte);
export const vert = teinte('32');
export const jaune = teinte('33');
export const rouge = teinte('31');
export const gras = teinte('1');
export const gris = teinte('90');

export function lireJson(chemin, description) {
  let texte;
  try {
    texte = readFileSync(chemin, 'utf8');
  } catch {
    throw new Error(`Impossible de lire ${description} : le fichier « ${chemin} » est introuvable.`);
  }
  try {
    return JSON.parse(texte);
  } catch {
    throw new Error(`Le fichier « ${chemin} » n'est pas du JSON valide.`);
  }
}

export function ecrireJson(chemin, valeur) {
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, JSON.stringify(valeur, null, 2) + '\n');
}

export function ecrireOctets(chemin, octets) {
  mkdirSync(dirname(chemin), { recursive: true });
  writeFileSync(chemin, octets);
}

// L'arborescence recommandée par EXTRACTION.md, sous un dossier racine
// (par défaut « ancrage » dans le dossier courant).
export function chemins(dossier, lot) {
  return {
    sels: join(dossier, 'sels', `${lot}.sels.json`),
    temoins: join(dossier, 'temoins', lot),
    preuve: join(dossier, 'preuves', `${lot}.ots`),
  };
}

export function listerTemoins(dossierTemoins) {
  let noms;
  try {
    noms = readdirSync(dossierTemoins).filter(n => n.endsWith('.temoin.json')).sort();
  } catch {
    throw new Error(`Aucun témoin trouvé dans « ${dossierTemoins} ». Avez-vous lancé « emettre » d'abord ?`);
  }
  return noms.map(nom => join(dossierTemoins, nom));
}

// Lit une option « --nom valeur » dans les arguments, avec valeur par défaut.
export function option(args, nom, defaut) {
  const i = args.indexOf(nom);
  if (i === -1) return defaut;
  const valeur = args[i + 1];
  if (valeur === undefined) throw new Error(`L'option ${nom} attend une valeur.`);
  args.splice(i, 2);
  return valeur;
}
