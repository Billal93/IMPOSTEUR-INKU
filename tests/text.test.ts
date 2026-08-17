import { test } from "node:test";
import assert from "node:assert/strict";

import {
  checkClue,
  checkPseudo,
  generateRoomCode,
  isCloseEnough,
  isValidRoomCode,
  normalizeRoomCode,
  normalizeWord,
} from "../src/lib/text";

/* ----------------------------- Codes de room ----------------------------- */

test("un code fait 6 caractères et évite les caractères ambigus", () => {
  for (let i = 0; i < 300; i++) {
    const code = generateRoomCode();
    assert.equal(code.length, 6);
    assert.ok(isValidRoomCode(code), `code invalide : ${code}`);
    assert.ok(!/[01OIL]/.test(code), `caractère ambigu dans ${code}`);
  }
});

test("la saisie d'un code est nettoyée des caractères impossibles", () => {
  assert.equal(normalizeRoomCode("ab-c2 34"), "ABC234");
  assert.equal(normalizeRoomCode("O0I1L"), "");
  assert.equal(normalizeRoomCode("ABCDEFGHIJ"), "ABCDEF");
});

/* -------------------------------- Pseudos -------------------------------- */

test("les pseudos hors bornes sont refusés", () => {
  assert.equal(checkPseudo("ab").ok, false);
  assert.equal(checkPseudo("a".repeat(16)).ok, false);
  assert.equal(checkPseudo("Kagura").ok, true);
});

test("les espaces en trop sont nettoyés", () => {
  const r = checkPseudo("  Sakura   B  ");
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.value, "Sakura B");
});

test("le filtre anti-insultes résiste au leetspeak et aux lettres répétées", () => {
  assert.equal(checkPseudo("connard").ok, false);
  assert.equal(checkPseudo("c0nnnard").ok, false);
  assert.equal(checkPseudo("FDP").ok, false);
  assert.equal(checkPseudo("Naruto").ok, true);
});

test("les pseudos avec accents et tirets passent", () => {
  assert.equal(checkPseudo("Éléa-2").ok, true);
  assert.equal(checkPseudo("l'Ombre").ok, true);
  assert.equal(checkPseudo("<script>").ok, false);
});

/* -------------------------------- Indices -------------------------------- */

test("un indice qui contient le mot est refusé", () => {
  assert.equal(checkClue("Naruto est son ami", "Naruto Uzumaki").ok, false);
  assert.equal(checkClue("le rasengan de base", "Le Rasengan").ok, false);
});

test("le contournement par accents, casse ou ponctuation est refusé aussi", () => {
  assert.equal(checkClue("N.A.R.U.T.O", "Naruto Uzumaki").ok, false);
  assert.equal(checkClue("nArUtO", "Naruto Uzumaki").ok, false);
});

test("une faute d'une lettre sur le mot est refusée", () => {
  assert.equal(checkClue("narutu le heros", "Naruto Uzumaki").ok, false);
});

test("un vrai indice passe", () => {
  assert.equal(checkClue("ninja blond au renard", "Naruto Uzumaki").ok, true);
  assert.equal(checkClue("boule bleue tourbillon", "Le Rasengan").ok, true);
});

test("un indice vide ou multiligne est refusé", () => {
  assert.equal(checkClue("   ", "Naruto").ok, false);
  assert.equal(checkClue("deux\nlignes", "Naruto").ok, false);
  assert.equal(checkClue("x".repeat(61), "Naruto").ok, false);
});

/* ------------------------- Devinette de l'imposteur ------------------------ */

test("la devinette exacte est acceptée", () => {
  assert.equal(isCloseEnough("Naruto Uzumaki", "Naruto Uzumaki"), true);
});

test("une petite faute de frappe passe", () => {
  assert.equal(isCloseEnough("naruto uzumaky", "Naruto Uzumaki"), true);
  assert.equal(isCloseEnough("Le Rasengann", "Le Rasengan"), true);
});

test("les articles et la casse n'ont pas d'importance", () => {
  assert.equal(isCloseEnough("rasengan", "Le Rasengan"), true);
  assert.equal(normalizeWord("Le Village caché de Konoha"), "village cache konoha");
});

test("un mot voisin mais différent est refusé", () => {
  assert.equal(isCloseEnough("Sasuke Uchiwa", "Naruto Uzumaki"), false);
  assert.equal(isCloseEnough("Le Chidori", "Le Rasengan"), false);
  assert.equal(isCloseEnough("", "Le Rasengan"), false);
});
