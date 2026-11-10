#!/usr/bin/env node
/**
 * Liste les textes français de l'interface qui n'ont pas encore de traduction anglaise.
 * Usage : npm run i18n:missing      (depuis frontend/)
 * Ajoutez ensuite chaque texte manquant dans src/i18n/en.json  ("texte français": "English text").
 * Heuristique : détecte les textes contenant des accents ou des mots français courants (les mots neutres comme
 * « Contact » ou « Clients » peuvent être ignorés). Les textes à variables se traitent dans src/i18n/rules.ts.
 */
const ts = require("typescript"), fs = require("fs"), path = require("path");
const dict = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/i18n/en.json"), "utf8"));
const FR = /[À-ÿ]|\b(le|la|les|des|du|de|votre|vos|une|un|et|pour|avec|sur|dans|par|est|sont|nous|vous|aux|ce|cette|ces|ou|au|en)\b/i;
const SKIP_ATTR = /^(className|key|id|name|type|href|src|htmlFor|role|autoComplete|style|width|height|viewBox|d|fill|stroke|list|target|rel|method|inputMode|pattern|accept|value|defaultValue|tint|stripe|tone|cat|icon|variant|size|mode|line|c|cls|row|dot|pill|num|foot)$/;
const found = new Map();
const norm = (s) => s.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&apos;|&#39;/g, "'").replace(/\s+/g, " ").trim();
const add = (t, f) => { t = norm(t); if (!t || !/[A-Za-zÀ-ÿ]{3}/.test(t) || !FR.test(t) || dict[t] || /^[\w./:#-]+$/.test(t)) return; if (!found.has(t)) found.set(t, f); };
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.tsx?$/.test(e.name)) continue;
    const sf = ts.createSourceFile(p, fs.readFileSync(p, "utf8"), ts.ScriptTarget.Latest, true, e.name.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    (function v(n) {
      if (ts.isJsxText(n)) add(n.getText(), p);
      else if (ts.isJsxAttribute(n) && n.initializer && ts.isStringLiteral(n.initializer) && !SKIP_ATTR.test(n.name.getText())) add(n.initializer.text, p);
      else if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && !ts.isJsxAttribute(n.parent) && !ts.isImportDeclaration(n.parent) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n) && !ts.isElementAccessExpression(n.parent) && n.text.includes(" ")) add(n.text, p);
      ts.forEachChild(n, v);
    })(sf);
  }
})(path.join(__dirname, "../src"));
if (!found.size) console.log("✓ Aucun texte français sans traduction détecté.");
else { console.log(`${found.size} texte(s) sans traduction (à ajouter dans src/i18n/en.json) :\n`); for (const [t, f] of found) console.log(`- "${t}"   (${path.relative(path.join(__dirname, ".."), f)})`); }
