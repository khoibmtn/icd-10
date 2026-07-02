// src/lib/search.ts
// Multi-stage search engine cho ICD-10 tiếng Việt
import type { ICDRecord } from '../types/icd'
import { expandQuery } from './synonyms'



// ─── Vietnamese text normalization ────────────────────────────────────────────

/**
 * Remove Vietnamese diacritics and convert to lowercase.
 * Used for accent-insensitive comparison.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritical marks
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim()
}

// ─── Index ────────────────────────────────────────────────────────────────────

interface IndexEntry {
  rec: ICDRecord
  // Pre-computed normalized fields for fast comparison
  normCode: string        // e.g. "z34.0"
  normCodeNoDot: string   // e.g. "z340"
  normViet: string        // normalized tenTiengViet
  normAnh: string         // normalized tenTiengAnh
  normHuongDan: string    // normalized huongDanMaHoaTiengViet
}

let index: IndexEntry[] = []

export async function buildSearchIndex(records: ICDRecord[]): Promise<void> {
  index = records.map(rec => ({
    rec,
    normCode: rec.maBenh.toLowerCase(),
    normCodeNoDot: rec.maBenh.toLowerCase().replace(/\./g, ''),
    normViet: normalize(rec.tenTiengViet),
    normAnh: normalize(rec.tenTiengAnh),
    normHuongDan: normalize(rec.huongDanMaHoaTiengViet ?? ''),
  }))
}

export function isIndexReady(): boolean {
  return index.length > 0
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreEntry(entry: IndexEntry, normQuery: string, rawQuery: string, wholeWord = false): number {
  let score = 0
  const q = normQuery
  const rawQ = rawQuery.toLowerCase().trim()

  // Detect if user is searching by code (e.g. "G63", "I20.1", "M54")
  // Pattern: starts with letter(s) followed by digits, optionally with dots
  const isCodeQuery = /^[a-z]\d/i.test(rawQ)

  // ─── Stage 1: Code match (absolute priority) ─────────────────────────────
  if (entry.normCode === rawQ) return 2000
  if (entry.normCodeNoDot === rawQ.replace(/\./g, '') && !rawQ.includes('.')) return 1900
  if (entry.normCode.startsWith(rawQ + '.')) score += 800
  if (entry.normCode.startsWith(rawQ)) score += 750
  if (entry.normCode.includes(rawQ)) score += 350

  // ── If query looks like a code, ONLY use code matching ───────────────────
  // Prevents 'G63' from returning M05.3 just because its guidance text
  // mentions 'G63' as an excludes/includes note.
  if (isCodeQuery) return score

  // ─── Stage 2: Vietnamese name ────────────────────────────────────────────
  if (entry.normViet === q) return score + 1800                     // exact name match
  if (!wholeWord && (entry.normViet.startsWith(q + ' ') || entry.normViet.startsWith(q))) {
    score += 700                                                      // starts with query
  }

  // Multi-word scoring: strict — ALL words must be present for high score
  // If wholeWord is true, we don't filter out 1-char words.
  const words = q.split(/\s+/).filter(w => wholeWord ? w.length >= 1 : w.length >= 2)
  
  if (words.length >= 2) {
    // Tokenize the record name for word-boundary matching
    const vietTokens = entry.normViet.split(/[\s\-\/,;.()]+/).filter(t => t.length > 0)
    const anhTokens = entry.normAnh.split(/[\s\-\/,;.()]+/).filter(t => t.length > 0)

    let wordMatchCount = 0
    for (const word of words) {
      // Token-level match: require minimum chars to avoid false positives
      // For 2-char words: ONLY exact token match (never prefix-match)
      // For 3+ char words: allow prefix/start matching
      const minPrefixLen = 3

      const inViet = vietTokens.some(t => {
        if (t === word) return true
        if (!wholeWord) {
           return (word.length >= minPrefixLen && t.startsWith(word)) ||
                  (word.length >= minPrefixLen && t.length >= minPrefixLen && word.startsWith(t))
        }
        return false
      })

      // English: never allow 2-char word to prefix-match longer tokens
      // "me" must match EXACTLY as token, not "metapneumovirus".startsWith("me")
      const inAnh = anhTokens.some(t => {
        if (t === word) return true
        if (!wholeWord) {
          return (word.length >= minPrefixLen && t.startsWith(word))
        }
        return false
      })
      if (inViet || inAnh) wordMatchCount++
    }

    const allWordsPresent = wordMatchCount === words.length

    if (allWordsPresent) {
      score += 500 + wordMatchCount * 60
    } else if (wordMatchCount > 0 && words.length > 2) {
      // 3+ word queries: allow partial with very low score
      score += wordMatchCount * 3
    }
    // 2-word query: partial (1/2) = score 0 = excluded

  } else {
    // Single word query
    const vietTokens = entry.normViet.split(/[\s\-\/,;.()]+/).filter(t => t.length > 0)
    const isTokenMatch = vietTokens.some(t => t === q)

    if (wholeWord) {
      // Whole-word mode: only match if query is a standalone token
      if (isTokenMatch) score += 550
    } else {
      // Contains mode (default): substring match allowed
      if (entry.normViet.includes(q)) {
        score += isTokenMatch ? 550 : 400
      }
    }
  }

  // ─── Stage 3: English name ───────────────────────────────────────────────
  // For multi-word queries: ONLY score if already has meaningful score from Stage 2
  // This prevents 'me' in 'mellitus' giving J12.3 a free English-name bonus
  const isMultiWord = words.length >= 2
  if (!isMultiWord || score > 0) {
    if (entry.normAnh === q) score += 400
    else if (!wholeWord && entry.normAnh.startsWith(q)) score += 300
    else if (!isMultiWord && !wholeWord && entry.normAnh.includes(q)) score += 180  // substring only when not wholeWord
    else if (wholeWord) {
      const anhTokens = entry.normAnh.split(/[\s\-\/,;.()]+/).filter(t => t.length > 0)
      if (anhTokens.some(t => t === q)) score += 300
    }
  }

  // ─── Stage 4: Coding guidance ────────────────────────────────────────────
  // Same gate: only add guidance score if already relevant
  if (!isMultiWord || score > 0) {
    if (wholeWord) {
      // Whole-word: check tokens in guidance
      const hdTokens = entry.normHuongDan.split(/[\s\-\/,;.()]+/).filter(t => t.length > 0)
      if (hdTokens.some(t => t === q)) score += 80
    } else {
      if (entry.normHuongDan.includes(q)) score += 80
    }
  }

  // ─── Stage 5: Synonym expansion ──────────────────────────────────────────
  const expandedTerms = expandQuery(q)
  for (const icdTerm of expandedTerms) {
    if (entry.normViet.includes(icdTerm)) {
      score += 400
      break
    }
    if (entry.normAnh.includes(icdTerm)) {
      score += 200
      break
    }
  }

  return score
}

// ─── Public search API ────────────────────────────────────────────────────────

export async function search(
  query: string,
  limit = 30,
  wholeWord = false,
): Promise<{ results: ICDRecord[]; hasStrongMatch: boolean }> {
  if (!query.trim() || index.length === 0) {
    return { results: [], hasStrongMatch: false }
  }

  const rawQuery = query.trim()
  const normQuery = normalize(rawQuery)

  const scored: Array<{ score: number; rec: ICDRecord }> = []

  for (const entry of index) {
    const score = scoreEntry(entry, normQuery, rawQuery, wholeWord)
    if (score > 0) {
      scored.push({ score, rec: entry.rec })
    }
  }

  scored.sort((a, b) => b.score - a.score)

  // "Strong match" = at least one result with score >= 100 (code match or all-words-match)
  const hasStrongMatch = scored.length > 0 && scored[0].score >= 100

  return {
    results: scored.slice(0, limit).map(s => s.rec),
    hasStrongMatch,
  }
}

export async function searchByCode(code: string): Promise<ICDRecord | null> {
  const normCode = code.toLowerCase().trim()
  const entry = index.find(e => e.normCode === normCode)
  return entry ? entry.rec : null
}
