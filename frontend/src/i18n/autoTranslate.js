// ─────────────────────────────────────────────────────────────
// Global auto-translator for CivicReport
// Watches the whole page and swaps known English UI text for
// Kannada / Hindi using src/i18n/dictionary.js.
// No page files need to be edited.
// ─────────────────────────────────────────────────────────────
import { DICTIONARY, PATTERNS } from './dictionary'

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'label']
const SKIP_SELECTOR = 'script, style, noscript, textarea, code, pre, [contenteditable="true"], [data-no-translate], .notranslate'
const HAS_WORD = /[A-Za-z]{2,}/

const textState = new WeakMap()   // text node -> { original, applied }
const attrState = new WeakMap()   // element  -> { attr: { original, applied } }
const missing = new Set()
const tables = {}                 // 'kn' | 'hi' -> Map(lowercase English -> translation)
let currentLang = 'en'

const norm = (s) => s.replace(/\s+/g, ' ').trim()

function buildTables() {
  tables.kn = new Map()
  tables.hi = new Map()
  for (const [en, kn, hi] of DICTIONARY) {
    const key = norm(en).toLowerCase()
    tables.kn.set(key, kn)
    tables.hi.set(key, hi)
  }
}

function lookupExact(text, lang) {
  const hit = tables[lang]?.get(norm(text).toLowerCase())
  return hit === undefined ? null : hit
}

// Translate one piece of text. Returns null if we don't know it.
function translate(raw, lang) {
  const text = norm(raw)
  if (!text) return null

  const lead = raw.match(/^\s*/)[0]
  const trail = raw.match(/\s*$/)[0]
  const wrap = (s) => lead + s + trail

  // 1. Exact match
  let hit = lookupExact(text, lang)
  if (hit !== null) return wrap(hit)

  // 2. Strip emoji / arrows / symbols around the words: "📍 Report an Issue →"
  const m = text.match(/^([^A-Za-z]*)([A-Za-z](?:.*[A-Za-z])?)([^A-Za-z]*)$/s)
  if (m) {
    const [, pre, core, post] = m
    hit = lookupExact(core + post.trim(), lang)
    if (hit !== null) return wrap(pre + hit)
    hit = lookupExact(core, lang)
    if (hit !== null) return wrap(pre + hit + post)
  }

  // 3. Patterns with changing parts (dates, messages with numbers)
  const tr = (s) => lookupExact(s, lang) ?? s
  for (const p of PATTERNS) {
    const pm = text.match(p.re)
    if (pm && p[lang]) return wrap(p[lang](pm, tr))
  }
  return null
}

function recordMissing(text) {
  if (!import.meta.env.DEV) return
  const t = norm(text)
  if (t && t.length < 200 && HAS_WORD.test(t)) missing.add(t)
}

function resolveTarget(original) {
  if (currentLang === 'en') return original
  const tr = translate(original, currentLang)
  if (tr === null) { recordMissing(original); return original }
  return tr
}

function processText(node) {
  const parent = node.parentElement
  if (!parent || parent.closest(SKIP_SELECTOR)) return
  const value = node.nodeValue
  let st = textState.get(node)
  // If the text isn't our own translation, React (or the user) changed it → new original
  if (!st || value !== st.applied) {
    st = { original: value, applied: null }
    textState.set(node, st)
  }
  const target = resolveTarget(st.original)
  st.applied = target === st.original ? null : target
  if (node.nodeValue !== target) node.nodeValue = target
}

function processAttrs(el) {
  if (el.closest(SKIP_SELECTOR)) return
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue
    const value = el.getAttribute(a)
    let map = attrState.get(el)
    if (!map) { map = {}; attrState.set(el, map) }
    let st = map[a]
    if (!st || value !== st.applied) { st = { original: value, applied: null }; map[a] = st }
    const target = resolveTarget(st.original)
    st.applied = target === st.original ? null : target
    if (value !== target) el.setAttribute(a, target)
  }
}

function walk(root) {
  if (!root) return
  if (root.nodeType === Node.TEXT_NODE) { processText(root); return }
  if (root.nodeType !== Node.ELEMENT_NODE) return
  processAttrs(root)
  root.querySelectorAll(ATTRS.map((a) => `[${a}]`).join(',')).forEach(processAttrs)
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let n
  while ((n = tw.nextNode())) processText(n)
}

export function startAutoTranslate(i18n) {
  buildTables()
  currentLang = (i18n.resolvedLanguage || 'en').slice(0, 2)

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') processText(m.target)
      else if (m.type === 'attributes') processAttrs(m.target)
      else m.addedNodes.forEach(walk)
    }
  })
  observer.observe(document.body, {
    subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ATTRS,
  })
  walk(document.body)

  i18n.on('languageChanged', (lng) => {
    currentLang = (lng || 'en').slice(0, 2)
    missing.clear()
    walk(document.body)
  })

  // Dev helper: type showMissingTranslations() in the browser console
  if (import.meta.env.DEV) {
    window.showMissingTranslations = () => {
      const list = [...missing]
      console.table(list)
      navigator.clipboard?.writeText(JSON.stringify(list, null, 2)).catch(() => {})
      return list
    }
  }
}
