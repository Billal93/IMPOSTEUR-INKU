#!/usr/bin/env node
/**
 * Pousse les variables de .env.local vers Vercel (production, preview, dev).
 *
 *   node scripts/push-env-to-vercel.mjs
 *
 * Les valeurs sont écrites directement sur l'entrée standard de `vercel env add`
 * et ne sont jamais affichées : rien ne fuite dans les logs du terminal.
 */
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const TARGETS = ["production", "preview", "development"];

let raw;
try {
  raw = readFileSync(join(root, ".env.local"), "utf8");
} catch {
  console.error("✖ .env.local introuvable.");
  process.exit(1);
}

const env = {};
for (const line of raw.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const missing = VARS.filter((v) => !env[v] || env[v].includes("xxxx") || env[v].startsWith("eyJhbGciOi."));
if (missing.length) {
  console.error(`✖ Valeurs manquantes ou non remplacées dans .env.local : ${missing.join(", ")}`);
  process.exit(1);
}

const vercel = process.platform === "win32" ? "vercel.cmd" : "vercel";

function run(args, stdin) {
  return new Promise((resolve) => {
    // shell: true est nécessaire sous Windows pour lancer vercel.cmd.
    const child = spawn(vercel, args, {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ code, out }));
    if (stdin !== undefined) {
      child.stdin.write(stdin);
      child.stdin.end();
    }
  });
}

for (const name of VARS) {
  for (const target of TARGETS) {
    // On retire d'abord l'éventuelle valeur existante pour rester idempotent.
    await run(["env", "rm", name, target, "--yes"]);
    const { code, out } = await run(["env", "add", name, target], env[name]);
    const ok = code === 0 || /already exists/i.test(out);
    console.log(`${ok ? "✓" : "✖"} ${name} → ${target}${ok ? "" : `\n${out}`}`);
    if (!ok) process.exitCode = 1;
  }
}
