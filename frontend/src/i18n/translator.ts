import { applyRules } from "./rules";

/**
 * Traducteur DOM FR → EN.
 * - Remplace le contenu des nœuds texte (et les attributs placeholder/title/aria-label/alt) d'après un dictionnaire.
 * - Ne change que `nodeValue` / valeurs d'attributs : jamais la structure du DOM (sûr pour React).
 * - Un MutationObserver traduit aussi le contenu ajouté ou modifié ensuite (navigation, données chargées).
 * - `start()` renvoie une fonction qui restaure le français.
 */
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE", "SVG"]);
const ATTRS = ["placeholder", "title", "aria-label", "alt"];

type Rec = { orig: string; applied: string };

export function start(dict: Record<string, string>): () => void {
  const map = new Map(Object.entries(dict));
  const texts = new WeakMap<Text, Rec>();
  const attrs = new WeakMap<Element, Record<string, Rec>>();

  const norm = (s: string) => s.replace(/\s+/g, " ").trim();
  // 1 234 (espace fine insécable française) → 1,234
  const fixNum = (s: string) => s.replace(/(\d)[\u202f\u00a0](?=\d{3}(?!\d))/g, "$1,");
  function tr(source: string): string {
    const raw = fixNum(source);
    const core = norm(raw);
    if (!core) return raw;
    const out = map.get(core) ?? applyRules(core);
    if (!out || out === core) return raw;
    const lead = raw.match(/^\s*/)![0], trail = raw.match(/\s*$/)![0];
    return lead + out + trail;
  }

  const skip = (el: Element | null) => { for (let e = el; e; e = e.parentElement) { if (SKIP_TAGS.has(e.tagName.toUpperCase()) || e.getAttribute("translate") === "no") return true; } return false; };

  function doText(n: Text) {
    if (skip(n.parentElement)) return;
    const cur = n.nodeValue ?? "";
    const rec = texts.get(n);
    if (rec && cur === rec.applied) return;           // déjà traduit par nous
    const t = tr(cur);
    if (t !== cur) { texts.set(n, { orig: cur, applied: t }); n.nodeValue = t; } else texts.delete(n);
  }
  function doAttr(el: Element, name: string) {
    const cur = el.getAttribute(name); if (cur === null) return;
    const rec = attrs.get(el)?.[name];
    if (rec && cur === rec.applied) return;
    const t = tr(cur);
    const r = attrs.get(el) ?? {};
    if (t !== cur) { r[name] = { orig: cur, applied: t }; attrs.set(el, r); el.setAttribute(name, t); } else if (r[name]) { delete r[name]; }
  }
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) return doText(node as Text);
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    if (SKIP_TAGS.has(el.tagName.toUpperCase()) || el.getAttribute("translate") === "no") return;
    for (const a of ATTRS) if (el.hasAttribute(a)) doAttr(el, a);
    el.childNodes.forEach(walk);
  }

  walk(document.documentElement);

  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") doText(m.target as Text);
      else if (m.type === "attributes") doAttr(m.target as Element, m.attributeName!);
      else m.addedNodes.forEach(walk);
    }
  });
  obs.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });

  /** Restaure le français partout où nous avons modifié un nœud. */
  return function stop() {
    obs.disconnect();
    (function restore(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) { const r = texts.get(node as Text); if (r && (node as Text).nodeValue === r.applied) (node as Text).nodeValue = r.orig; return; }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as Element; const r = attrs.get(el);
      if (r) for (const [name, rec] of Object.entries(r)) if (el.getAttribute(name) === rec.applied) el.setAttribute(name, rec.orig);
      el.childNodes.forEach(restore);
    })(document.documentElement);
  };
}
