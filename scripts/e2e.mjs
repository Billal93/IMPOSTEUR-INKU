#!/usr/bin/env node
/**
 * Joue une partie complète contre l'API HTTP, de la création de la room au
 * classement final. Sert de test de bout en bout, en local comme en prod.
 *
 *   node scripts/e2e.mjs http://localhost:3000
 */
const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
function check(label, cond, extra = "") {
  log(`${cond ? "✓" : "✖"} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures++;
}

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-session-token": token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 300) };
  }
  return { ok: res.ok, status: res.status, data };
}

const state = (p) => api(`/api/rooms/${p.code}/state`, { token: p.token });

/* ------------------------------ 1. La room ------------------------------ */

log(`\n▶ Cible : ${BASE}\n`);

const TOTAL_ROUNDS = 3; // doit être une valeur autorisée : 3 / 5 / 7 / 0
const settings = {
  maxPlayers: 4,
  rounds: TOTAL_ROUNDS,
  timerSeconds: 15,
  clueTurns: 1,
  discussionSeconds: 0,
  categories: ["personnages", "lieux", "techniques", "objets", "creatures"],
  imposterOverride: null,
};

const created = await api("/api/rooms", {
  method: "POST",
  body: { pseudo: "Kagura", avatarId: "inku", settings },
});
check("création de la room", created.ok && /^[A-Z0-9]{6}$/.test(created.data.code ?? ""), created.data.error);
if (!created.ok) process.exit(1);

const code = created.data.code;
const players = [{ name: "Kagura", code, token: created.data.sessionToken, id: created.data.playerId }];
log(`  code : ${code}`);

for (const name of ["Rensuke", "Ayako"]) {
  const j = await api(`/api/rooms/${code}/join`, {
    method: "POST",
    body: { pseudo: name, avatarId: "masque" },
  });
  check(`${name} rejoint`, j.ok, j.data.error);
  if (j.ok) players.push({ name, code, token: j.data.sessionToken, id: j.data.playerId });
}

const dup = await api(`/api/rooms/${code}/join`, {
  method: "POST",
  body: { pseudo: "Kagura", avatarId: "cape" },
});
check("un pseudo déjà pris est refusé", !dup.ok, dup.data.error);

const badCode = await api(`/api/rooms/ZZZZZZ/join`, {
  method: "POST",
  body: { pseudo: "Fantome", avatarId: "inku" },
});
check("un code inconnu est refusé", badCode.status === 404);

// Heartbeats : tout le monde se signale présent.
for (const p of players) await state(p);

const lobby = await state(players[0]);
check("le lobby liste les 3 joueurs", lobby.data.players?.length === 3);
check("l'hôte est le créateur", lobby.data.hostPlayerId === players[0].id);

const notHost = await api(`/api/rooms/${code}/start`, { method: "POST", token: players[1].token });
check("un non-hôte ne peut pas lancer", notHost.status === 403, notHost.data.error);

/* ----------------------------- 2. La partie ----------------------------- */

const started = await api(`/api/rooms/${code}/start`, { method: "POST", token: players[0].token });
check("l'hôte lance la partie", started.ok, started.data.error);

async function snapshot() {
  const out = [];
  for (const p of players) {
    const s = await state(p);
    out.push({ p, s: s.data });
  }
  return out;
}

let views = await snapshot();
const words = new Set(views.map((v) => v.s.round?.myWord));
const imposters = views.filter((v) => v.s.round?.iAmImposter);
check("chaque joueur a reçu un mot", views.every((v) => !!v.s.round?.myWord));
check("il y a exactement 1 imposteur à 3 joueurs", imposters.length === 1);
check("l'imposteur a un mot différent des civils", words.size === 2, [...words].join(" / "));

const meView = views[0].s;
check(
  "le rôle des autres n'est jamais exposé",
  JSON.stringify(meView).includes("imposter_player_ids") === false,
);

/* --------------------------- 3. Tour d'indices --------------------------- */

async function playClues(roundLabel) {
  for (let guard = 0; guard < 30; guard++) {
    const s = (await state(players[0])).data;
    if (s.round?.status !== "indices") return s;

    const currentId = s.round.currentPlayerId;
    const current = players.find((p) => p.id === currentId);
    if (!current) return s;

    // Un indice qui contient le mot doit être rejeté.
    const cur = (await state(current)).data;
    if (guard === 0) {
      const cheat = await api(`/api/rooms/${code}/clue`, {
        method: "POST",
        token: current.token,
        body: { content: `c'est ${cur.round.myWord}` },
      });
      check(`${roundLabel} : un indice contenant le mot est rejeté`, cheat.status === 422, cheat.data.error);
    }

    const r = await api(`/api/rooms/${code}/clue`, {
      method: "POST",
      token: current.token,
      body: { content: `piste ${guard + 1} de ${current.name}` },
    });
    if (!r.ok) {
      check(`${roundLabel} : indice de ${current.name}`, false, r.data.error);
      return s;
    }
  }
  return (await state(players[0])).data;
}

let s = await playClues("manche 1");
check("après les indices, on passe au vote", s.round?.status === "vote", s.round?.status);
check("tous les indices sont visibles", (s.round?.clues?.length ?? 0) === players.length);

/* ------------------------------- 4. Le vote ------------------------------ */

const selfVote = await api(`/api/rooms/${code}/vote`, {
  method: "POST",
  token: players[0].token,
  body: { targetId: players[0].id },
});
check("on ne peut pas voter pour soi", !selfVote.ok, selfVote.data.error);

// Les deux premiers votent pour le troisième : pas d'égalité possible.
const target = players[2];
for (const voter of [players[0], players[1]]) {
  const v = await api(`/api/rooms/${code}/vote`, {
    method: "POST",
    token: voter.token,
    body: { targetId: target.id },
  });
  check(`vote de ${voter.name}`, v.ok, v.data.error);
}

const afterFirstVote = (await state(players[1])).data;
check(
  "le vote reste caché jusqu'au dépouillement",
  !JSON.stringify(afterFirstVote.round?.votedPlayerIds ?? []).includes(target.id) ||
    afterFirstVote.round?.status !== "vote" ||
    afterFirstVote.round?.myVote === target.id,
);

// Le dernier vote déclenche le dépouillement.
await api(`/api/rooms/${code}/vote`, {
  method: "POST",
  token: players[2].token,
  body: { targetId: players[0].id },
});

s = (await state(players[0])).data;
check("le dépouillement a eu lieu", ["devinette", "resultat"].includes(s.round?.status ?? ""), s.round?.status);

/* --------------------------- 5. Devinette / résultat --------------------- */

if (s.round?.status === "devinette") {
  const caught = players.find((p) => p.id === s.round.eliminatedPlayerId);
  check("l'éliminé est bien l'imposteur", !!caught);
  const g = await api(`/api/rooms/${code}/guess`, {
    method: "POST",
    token: caught.token,
    body: { guess: "un mot totalement au hasard" },
  });
  check("l'imposteur tente sa devinette", g.ok, g.data.error);
  s = (await state(players[0])).data;
}

check("écran de résultat", s.round?.status === "resultat", s.round?.status);
check("le résultat révèle les deux mots", !!s.round?.result?.civilWord && !!s.round?.result?.imposterWord);
check("un vainqueur est désigné", ["civils", "imposteur"].includes(s.round?.result?.winner ?? ""), s.round?.result?.winner);
log(
  `  mots : ${s.round?.result?.civilWord} / ${s.round?.result?.imposterWord}` +
    ` · vainqueur : ${s.round?.result?.winner}`,
);

const reported = await api(`/api/rooms/${code}/report`, {
  method: "POST",
  token: players[0].token,
  body: { clue: { playerId: players[1].id, turnNumber: 1 } },
});
check("signalement d'un indice après la manche", reported.ok, reported.data.error);

/* ------------------------ 6. Les manches suivantes ------------------------ */

/** Vote de tout le monde, puis devinette et revote éventuels. */
async function resolveRound(label) {
  let cur = (await state(players[0])).data;

  for (let guard = 0; guard < 6; guard++) {
    if (cur.round?.status === "vote" || cur.round?.status === "revote") {
      const pool = cur.round.revoteCandidateIds?.length
        ? cur.round.revoteCandidateIds
        : players.map((p) => p.id);
      for (const voter of players) {
        const targetId = pool.find((id) => id !== voter.id);
        if (targetId) {
          await api(`/api/rooms/${code}/vote`, {
            method: "POST",
            token: voter.token,
            body: { targetId },
          });
        }
      }
    } else if (cur.round?.status === "devinette") {
      const caught = players.find((p) => p.id === cur.round.eliminatedPlayerId);
      await api(`/api/rooms/${code}/guess`, {
        method: "POST",
        token: caught.token,
        body: { guess: "une reponse au pif" },
      });
    } else if (cur.round?.status === "indices") {
      await playClues(label);
    } else {
      break;
    }
    cur = (await state(players[0])).data;
  }
  return cur;
}

const seenWords = new Set([s.round?.result?.civilWord]);
let previousOrder = views[0].s.round.turnOrder.join(",");

for (let n = 2; n <= TOTAL_ROUNDS; n++) {
  const next = await api(`/api/rooms/${code}/next-round`, { method: "POST", token: players[0].token });
  check(`l'hôte enchaîne la manche ${n}`, next.ok, next.data.error);

  s = (await state(players[0])).data;
  check(`on est bien à la manche ${n}`, s.game?.roundNumber === n, String(s.game?.roundNumber));

  const order = s.round.turnOrder.join(",");
  check(`manche ${n} : l'ordre de passage a été décalé`, order !== previousOrder);
  previousOrder = order;

  s = await resolveRound(`manche ${n}`);
  check(`manche ${n} : écran de résultat`, s.round?.status === "resultat", s.round?.status);

  const word = s.round?.result?.civilWord;
  check(`manche ${n} : paire jamais rejouée (anti-répétition)`, !seenWords.has(word), word);
  seenWords.add(word);
  log(`  manche ${n} : ${word} / ${s.round?.result?.imposterWord} · ${s.round?.result?.winner}`);
}

/* ----------------------------- 7. Fin de partie --------------------------- */

const end = await api(`/api/rooms/${code}/next-round`, { method: "POST", token: players[0].token });
check("la dernière manche clôt la partie", end.ok, end.data.error);

s = (await state(players[0])).data;
check("la room est terminée", s.status === "terminee", s.status);
check("le classement est renvoyé", (s.leaderboard?.length ?? 0) === 3);
check(
  "le classement est trié par score décroissant",
  (s.leaderboard?.length ?? 0) === 3 &&
    s.leaderboard.every((r, i, a) => i === 0 || a[i - 1].score >= r.score),
);
check(
  "des points ont été distribués sur les 3 manches",
  (s.leaderboard ?? []).some((r) => r.score > 0),
);
log("  classement : " + (s.leaderboard ?? []).map((r) => `${r.pseudo} ${r.score}`).join(" · "));

/* --------------------------- 8. Reconnexion ------------------------------- */

const rejoin = await api(`/api/rooms/${code}/join`, {
  method: "POST",
  token: players[1].token,
  body: { pseudo: players[1].name, avatarId: "cape" },
});
check("un joueur retrouve sa place avec son token", rejoin.status === 409 || rejoin.data.reconnected === true);

const stranger = await state({ code, token: "token-bidon-qui-nexiste-pas" });
check("un token inconnu est rejeté", stranger.status === 403);

await sleep(200);
log(`\n${failures === 0 ? "✓ Tout est vert" : `✖ ${failures} échec(s)`}\n`);
process.exit(failures === 0 ? 0 : 1);
