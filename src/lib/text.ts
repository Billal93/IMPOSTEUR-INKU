/** Utilitaires texte partagés client / serveur. */

/** Alphabet sans caractères ambigus : ni 0/O, ni 1/I/L. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode(len = 6): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

export function isValidRoomCode(code: string): boolean {
  return /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/.test(code);
}

/** Nettoie une saisie utilisateur : ne garde que les caractères de l'alphabet. */
export function normalizeRoomCode(input: string): string {
  return input
    .toUpperCase()
    .split("")
    .filter((c) => CODE_ALPHABET.includes(c))
    .join("")
    .slice(0, 6);
}

export function generateSessionToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

/**
 * Normalisation agressive : minuscules, sans accents, sans ponctuation,
 * sans articles, espaces compactés. Sert à comparer indices et devinettes.
 */
export function normalize(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set(["le", "la", "les", "l", "un", "une", "des", "de", "du", "d", "au", "aux"]);

/** Normalise puis retire les articles — comparaison de mots de jeu. */
export function normalizeWord(input: string): string {
  return normalize(input)
    .split(" ")
    .filter((t) => t && !STOPWORDS.has(t))
    .join(" ");
}

/* ------------------------------- Pseudos ------------------------------- */

const BANNED = [
  "connard", "connasse", "salope", "pute", "putain", "encule", "enculee", "enfoire",
  "batard", "nique", "niquer", "ntm", "fdp", "pd", "tapette", "pedale", "negre",
  "bougnoule", "youpin", "sale juif", "sale arabe", "nazi", "hitler", "viol",
  "fuck", "shit", "bitch", "nigger", "faggot", "rape", "cunt", "whore", "asshole",
  "merde", "couille", "penis", "bite", "chatte", "zizi", "cul",
];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };

export type PseudoCheck = { ok: true; value: string } | { ok: false; reason: string };

export function checkPseudo(raw: string): PseudoCheck {
  const value = raw.replace(/\s+/g, " ").trim();
  if (value.length < 3) return { ok: false, reason: "Ton pseudo fait au moins 3 caractères." };
  if (value.length > 15) return { ok: false, reason: "15 caractères max, faut faire court." };
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _.'-]*$/u.test(value)) {
    return { ok: false, reason: "Lettres, chiffres et - _ . ' seulement." };
  }

  const flat = normalize(value)
    .split("")
    .map((c) => LEET[c] ?? c)
    .join("")
    .replace(/(.)\1+/g, "$1")
    .replace(/\s/g, "");

  for (const word of BANNED) {
    const needle = word.replace(/\s/g, "").replace(/(.)\1+/g, "$1");
    if (flat.includes(needle)) return { ok: false, reason: "Ce pseudo passe pas, trouve autre chose." };
  }
  return { ok: true, value };
}

/* ------------------------- Comparaisons de mots ------------------------- */

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/** Tolérance orthographique légère : ~1 faute pour 6 caractères, plafonnée à 3. */
export function isCloseEnough(guess: string, target: string): boolean {
  const g = normalizeWord(guess);
  const t = normalizeWord(target);
  if (!g) return false;
  if (g === t) return true;
  const budget = Math.min(3, Math.max(1, Math.floor(t.length / 6)));
  if (levenshtein(g, t) <= budget) return true;

  // Tolère aussi « Naruto » pour « Naruto Uzumaki » si le mot donné est
  // un token distinctif (≥ 4 lettres) du mot cible.
  const targetTokens = t.split(" ").filter((x) => x.length >= 4);
  if (targetTokens.length > 1 && targetTokens.every((tok) => g.includes(tok))) return true;
  if (g.length >= 4 && targetTokens.length === 1 && levenshtein(g, targetTokens[0]) <= budget) return true;
  return false;
}

/* --------------------------- Validation d'indice --------------------------- */

export type ClueCheck = { ok: true } | { ok: false; reason: string };

/**
 * Anti-triche basique : un indice ne doit pas contenir le mot (ou une partie
 * distinctive du mot) qu'il est censé faire deviner.
 */
export function checkClue(content: string, secretWord: string): ClueCheck {
  const raw = content.trim();
  if (!raw) return { ok: false, reason: "Faut écrire quelque chose." };
  if (raw.length > 60) return { ok: false, reason: "Un indice, pas un roman : 60 caractères max." };
  if (/\r|\n/.test(content)) return { ok: false, reason: "Une seule ligne." };

  const clue = normalize(raw);
  const secret = normalizeWord(secretWord);
  if (!clue) return { ok: false, reason: "Faut écrire quelque chose." };

  const clueFlat = clue.replace(/\s/g, "");
  const secretFlat = secret.replace(/\s/g, "");

  if (secretFlat && clueFlat.includes(secretFlat)) {
    return { ok: false, reason: "Ton indice contient le mot. Trouve un truc plus subtil." };
  }

  // Chaque token distinctif du mot secret est interdit tel quel (ou à 1 faute).
  const secretTokens = secret.split(" ").filter((t) => t.length >= 4);
  const clueTokens = clue.split(" ").filter(Boolean);
  for (const st of secretTokens) {
    for (const ct of clueTokens) {
      if (ct === st || ct.startsWith(st) || st.startsWith(ct.slice(0, Math.max(4, st.length - 1)))) {
        if (Math.abs(ct.length - st.length) <= 3 && levenshtein(ct, st) <= 1) {
          return { ok: false, reason: "Trop proche du mot. Reformule." };
        }
      }
    }
  }
  return { ok: true };
}
