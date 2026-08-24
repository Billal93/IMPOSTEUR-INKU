#!/usr/bin/env node
/**
 * Génère les 12 avatars joueur à partir des 11 expressions peintes de la
 * mascotte INKU (`public/mascots/`).
 *
 *   node scripts/build-avatars.mjs
 *
 * Recette du design system : rotation de teinte en HSL qui tient deux choses
 * fixes — les pixels quasi désaturés (blancs des yeux, virole du pinceau) et
 * le trait d'encre sombre, qui ne s'éclaircit jamais. Chaque avatar garde donc
 * le même pinceau, la même éclaboussure et le même trait : c'est visiblement
 * le même personnage, dans une autre humeur et une autre teinte.
 *
 * Les PNG produits sont versionnés — ce script ne tourne qu'à la régénération.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "public/mascots");
const OUT = join(root, "public/avatars");

/** Seuils de la recette : en dessous, le pixel n'est pas recoloré. */
const SAT_FLOOR = 0.06; // blancs d'œil, virole métallique
const INK_CEILING = 0.22; // trait d'encre #2b1046 (L ≈ 0.17)

/**
 * 12 avatars, 11 expressions : `neutral` sert deux fois — une version claire
 * (« Neutre ») et une version presque noire (« Encre »), le seul couple où la
 * couleur seule porte l'identité.
 */
const AVATARS = [
  { id: "inku", expression: "determined", hue: 0 },
  { id: "fier", expression: "smug", hue: 35 },
  { id: "sournois", expression: "sneaky", hue: 70 },
  { id: "enerve", expression: "angry", hue: 95 },
  { id: "criant", expression: "shouting", hue: 125 },
  { id: "excite", expression: "excited", hue: 150 },
  { id: "content", expression: "content", hue: 185 },
  { id: "nerveux", expression: "nervous", hue: 215 },
  { id: "suspicieux", expression: "suspicious", hue: 245 },
  { id: "triste", expression: "sad", hue: 280 },
  { id: "neutre", expression: "neutral", hue: 0, saturation: 0.12, lightness: 1.12 },
  { id: "encre", expression: "neutral", hue: 0, saturation: 0.18, lightness: 0.55 },
];

/* ------------------------------ Conversions ------------------------------ */

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const chan = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [
    Math.round(chan(h + 1 / 3) * 255),
    Math.round(chan(h) * 255),
    Math.round(chan(h - 1 / 3) * 255),
  ];
}

/* -------------------------------- Rendu --------------------------------- */

function recolour(png, { hue, saturation, lightness }) {
  const out = new PNG({ width: png.width, height: png.height });
  png.data.copy(out.data);

  const shift = ((hue % 360) + 360) / 360;

  for (let i = 0; i < out.data.length; i += 4) {
    if (out.data[i + 3] < 8) continue; // transparent

    const [h, s, l] = rgbToHsl(out.data[i], out.data[i + 1], out.data[i + 2]);

    // Blancs d'œil et virole : jamais teintés.
    if (s < SAT_FLOOR) continue;
    // Trait d'encre : ne tourne pas et ne s'éclaircit jamais.
    if (l < INK_CEILING) continue;

    const nh = (h + shift) % 1;
    const ns = saturation === undefined ? s : Math.min(1, s * saturation);
    const nl = lightness === undefined ? l : Math.min(1, l * lightness);

    const [r, g, b] = hslToRgb(nh, ns, nl);
    out.data[i] = r;
    out.data[i + 1] = g;
    out.data[i + 2] = b;
  }
  return out;
}

/** Taille de sortie : les avatars s'affichent entre 20 et 116 px. */
const SIZE = 288;

/** Boîte englobante du dessin, marges transparentes exclues. */
function contentBox(png) {
  let x0 = png.width;
  let y0 = png.height;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      if (png.data[(y * png.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/**
 * Recadre sur le dessin, complète en carré, puis réduit par moyenne de blocs
 * (les bords restent nets et l'alpha est correctement pondéré).
 */
function squareThumbnail(png) {
  const box = contentBox(png);
  const side = Math.max(box.w, box.h);
  const offX = box.x0 - Math.floor((side - box.w) / 2);
  const offY = box.y0 - Math.floor((side - box.h) / 2);

  const out = new PNG({ width: SIZE, height: SIZE });
  const step = side / SIZE;

  for (let oy = 0; oy < SIZE; oy++) {
    for (let ox = 0; ox < SIZE; ox++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let n = 0;
      const sx0 = Math.floor(ox * step);
      const sy0 = Math.floor(oy * step);
      const sx1 = Math.max(sx0 + 1, Math.floor((ox + 1) * step));
      const sy1 = Math.max(sy0 + 1, Math.floor((oy + 1) * step));

      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const px = offX + sx;
          const py = offY + sy;
          n++;
          if (px < 0 || py < 0 || px >= png.width || py >= png.height) continue;
          const i = (py * png.width + px) * 4;
          const alpha = png.data[i + 3] / 255;
          // Prémultiplié : évite le liseré sombre sur les bords adoucis.
          r += png.data[i] * alpha;
          g += png.data[i + 1] * alpha;
          b += png.data[i + 2] * alpha;
          a += alpha;
        }
      }

      const o = (oy * SIZE + ox) * 4;
      if (a > 0) {
        out.data[o] = Math.round(r / a);
        out.data[o + 1] = Math.round(g / a);
        out.data[o + 2] = Math.round(b / a);
        out.data[o + 3] = Math.round((a / n) * 255);
      } else {
        out.data[o + 3] = 0;
      }
    }
  }
  return out;
}

mkdirSync(OUT, { recursive: true });

for (const avatar of AVATARS) {
  const src = join(SRC, `inku-${avatar.expression}.png`);
  const png = PNG.sync.read(readFileSync(src));
  const out = squareThumbnail(recolour(png, avatar));
  const buf = PNG.sync.write(out, { deflateLevel: 9 });
  writeFileSync(join(OUT, `${avatar.id}.png`), buf);
  console.log(`✓ ${avatar.id.padEnd(11)} ← ${avatar.expression.padEnd(11)} ${(buf.length / 1024).toFixed(0)} Ko`);
}

console.log(`\n${AVATARS.length} avatars générés dans public/avatars/`);
