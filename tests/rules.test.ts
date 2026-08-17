import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildTurnOrder,
  computeScoreDeltas,
  pickImposters,
  tallyTop,
} from "../src/lib/rules";
import {
  DEFAULT_SETTINGS,
  autoImposterCount,
  resolveImposterCount,
} from "../src/lib/constants";

/* ------------------------------ Imposteurs ------------------------------ */

test("le nombre d'imposteurs suit le palier 1 jusqu'à 6, 2 à partir de 7", () => {
  assert.equal(autoImposterCount(3), 1);
  assert.equal(autoImposterCount(6), 1);
  assert.equal(autoImposterCount(7), 2);
  assert.equal(autoImposterCount(12), 2);
});

test("l'override host est borné pour garder au moins deux civils", () => {
  const forced = { ...DEFAULT_SETTINGS, imposterOverride: 3 };
  assert.equal(resolveImposterCount(3, forced), 1);
  assert.equal(resolveImposterCount(5, forced), 3);
  assert.equal(resolveImposterCount(4, forced), 2);
});

test("le tirage évite les imposteurs des manches précédentes quand c'est possible", () => {
  const ids = ["a", "b", "c", "d", "e"];
  for (let i = 0; i < 60; i++) {
    const picked = pickImposters(ids, DEFAULT_SETTINGS, ["a", "b"]);
    assert.equal(picked.length, 1);
    assert.ok(!["a", "b"].includes(picked[0]), "un imposteur récent a été repris");
  }
});

test("le pool tournant se relâche si l'effectif est trop juste", () => {
  const ids = ["a", "b", "c"];
  const picked = pickImposters(ids, DEFAULT_SETTINGS, ["a", "b", "c"]);
  assert.equal(picked.length, 1);
  assert.ok(ids.includes(picked[0]));
});

/* --------------------------- Ordre de passage --------------------------- */

test("l'ordre de passage est décalé d'un cran d'une manche à l'autre", () => {
  const previous = ["a", "b", "c", "d"];
  assert.deepEqual(buildTurnOrder(["a", "b", "c", "d"], previous), ["b", "c", "d", "a"]);
});

test("les joueurs partis sortent de l'ordre, les nouveaux passent en dernier", () => {
  const previous = ["a", "b", "c"];
  const order = buildTurnOrder(["a", "c", "z"], previous);
  assert.deepEqual(order.slice(0, 2), ["c", "a"]);
  assert.deepEqual(order.slice(2), ["z"]);
});

test("sans manche précédente, l'ordre contient tout le monde une seule fois", () => {
  const ids = ["a", "b", "c", "d", "e"];
  const order = buildTurnOrder(ids, null);
  assert.equal(order.length, ids.length);
  assert.deepEqual([...order].sort(), [...ids].sort());
});

/* ------------------------------ Dépouillement ---------------------------- */

test("le dépouillement isole le joueur en tête", () => {
  const { max, top } = tallyTop([
    { target_player_id: "a" },
    { target_player_id: "b" },
    { target_player_id: "a" },
  ]);
  assert.equal(max, 2);
  assert.deepEqual(top, ["a"]);
});

test("une égalité remonte tous les ex æquo", () => {
  const { max, top } = tallyTop([
    { target_player_id: "a" },
    { target_player_id: "b" },
    { target_player_id: "c" },
  ]);
  assert.equal(max, 1);
  assert.deepEqual([...top].sort(), ["a", "b", "c"]);
});

test("aucun vote ne désigne personne", () => {
  const { max, top } = tallyTop([]);
  assert.equal(max, 0);
  assert.deepEqual(top, []);
});

/* --------------------------------- Scores -------------------------------- */

const participants = ["civ1", "civ2", "civ3", "imp"];

test("civils vainqueurs : +1 aux civils survivants, rien à l'imposteur", () => {
  const deltas = computeScoreDeltas({
    winner: "civils",
    imposterIds: ["imp"],
    eliminatedId: "imp",
    participantIds: participants,
    passedByPlayerId: [],
  });
  assert.deepEqual(deltas, { civ1: 1, civ2: 1, civ3: 1 });
});

test("un civil éliminé ne marque pas, même quand les civils gagnent", () => {
  const deltas = computeScoreDeltas({
    winner: "civils",
    imposterIds: ["imp"],
    eliminatedId: "civ2",
    participantIds: participants,
    passedByPlayerId: [],
  });
  assert.equal(deltas.civ2, undefined);
  assert.equal(deltas.civ1, 1);
});

test("imposteur vainqueur : +3 pour lui, rien pour les civils", () => {
  const deltas = computeScoreDeltas({
    winner: "imposteur",
    imposterIds: ["imp"],
    eliminatedId: "civ1",
    participantIds: participants,
    passedByPlayerId: [],
  });
  assert.deepEqual(deltas, { imp: 3 });
});

test("chaque tour passé coûte un point, cumulable avec un gain", () => {
  const deltas = computeScoreDeltas({
    winner: "civils",
    imposterIds: ["imp"],
    eliminatedId: "imp",
    participantIds: participants,
    passedByPlayerId: ["civ1", "civ1"],
  });
  assert.equal(deltas.civ1, -1); // +1 de victoire, -2 de tours passés
  assert.equal(deltas.civ2, 1);
});

test("un imposteur démasqué qui rate sa devinette marque zéro", () => {
  const deltas = computeScoreDeltas({
    winner: "civils",
    imposterIds: ["imp"],
    eliminatedId: "imp",
    participantIds: participants,
    passedByPlayerId: [],
  });
  assert.equal(deltas.imp, undefined);
});

test("double égalité sans élimination : personne ne marque", () => {
  const deltas = computeScoreDeltas({
    winner: null,
    imposterIds: ["imp"],
    eliminatedId: null,
    participantIds: participants,
    passedByPlayerId: [],
  });
  assert.deepEqual(deltas, {});
});
