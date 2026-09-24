#!/usr/bin/env node
/** UI static gates: no inline style=, no hex colors in TS/TSX, file length ≤300 (skip blank/comment). */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["src"];
const MAX_LINES = 300;
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const STYLE_ATTR = /\sstyle\s*=\s*\{/;
const COLOR_FN = /\b(?:rgb|rgba|hsl|hsla)\s*\(/;
const CODE_EXT = new Set([".ts", ".tsx"]);
const errors = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path);
    else if (CODE_EXT.has(extname(name))) check(path);
  }
}

function check(path) {
  const text = readFileSync(path, "utf8");
  const lines = text.split("\n");
  const codeLines = lines.filter((l) => l.trim() && !l.trim().startsWith("//") && !l.trim().startsWith("*")).length;
  if (codeLines > MAX_LINES) errors.push(`${path}: ${codeLines} code lines > ${MAX_LINES}`);
  lines.forEach((line, i) => {
    const n = i + 1;
    if (STYLE_ATTR.test(line)) errors.push(`${path}:${n}: style= attribute forbidden (CSP)`);
    if (HEX.test(line) && !path.includes("test") && !line.includes("//")) errors.push(`${path}:${n}: hex color outside :root`);
    if (COLOR_FN.test(line) && !path.includes("test")) errors.push(`${path}:${n}: raw color function`);
  });
}

for (const root of ROOTS) {
  try {
    walk(root);
  } catch (e) {
    errors.push(String(e));
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
process.stdout.write("lint:ui ok\n");
