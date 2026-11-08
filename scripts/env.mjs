// Reads the shop's .env.local (gitignored, mode 0600) without printing it.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
export const root = resolve(import.meta.dirname, "..");
export const envPath = resolve(root, ".env.local");
export function readEnv() {
  return Object.fromEntries(
    readFileSync(envPath, "utf8").split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
}
