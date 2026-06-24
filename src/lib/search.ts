// src/lib/search.ts
// Multi-stage search engine cho ICD-10 tiếng Việt
import type { ICDRecord } from '../types/icd'
import { expandQuery } from './synonyms'

let allRecords: ICDRecord[] = []

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
  allRecords = records
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

function scoreEntry(entry: IndexEntry, normQuery: string, rawQuery: string): number {
  let score = 0
  const q = normQuery
  const rawQ = rawQuery.toLowerCase().trim()

  // ─── Stage 1: Code match (absolute priority) ─────────────────────────────
  if (entry.normCode === rawQ) return 2000                          // perfect exact code — always first
  if (entry.normCodeNoDot === rawQ.replace(/\./g, '') && !rawQ.includes('.')) return 1900  // exact without dot
  // Subcodes (Z34.0, Z34.1) when user types parent (Z34) — score lower than exact parent
  if (entry.normCode.startsWith(rawQ + '.')) score += 800           // e.g. "z34" → z34.0, z34.1
  if (entry.normCode.startsWith(rawQ)) score += 750                 // prefix other
  if (entry.normCode.includes(rawQ)) score += 350                   // contains

  // ─── Stage 2: Vietnamese name ────────────────────────────────────────────
  if (entry.normViet === q) return score + 1800                     // exact name match
  if (entry.normViet.startsWith(q + ' ') || entry.normViet.startsWith(q)) {
    score += 700                                                      // starts with query
  }

  // Multi-word scoring: strict — ALL words must be present for high score
  const words = q.split(/\s+/).filter(w => w.length >= 2)
  if (words.length >= 2) {
    // Tokenize the record name for word-boundary matching
    const vietTokens = entry.normViet.split(/[\s\-\/,;.()]+/).filter(t => t.length > 0)
    const anhTokens = entry.normAnh.split(/[\s\-\/,;.()]+/).filter(t => t.length > 0)

    let wordMatchCount = 0
    for (const word of words) {
      // Token-level match: word must appear as complete token or prefix
      // Require minimum 2 chars to avoid 'o', 'a' etc. causing false matches
      const inViet = vietTokens.some(t =>
        t.length >= 2 && (
          t === word ||                         // exact token match
          (t.length >= 3 && t.startsWith(word)) ||   // token starts with query word
          (word.length >= 3 && word.startsWith(t))   // query word starts with token
        )
      )
      const inAnh = anhTokens.some(t =>
        t.length >= 2 && (t === word || t.startsWith(word))
      )
      if (inViet || inAnh) wordMatchCount++
    }

    const allWordsPresent = wordMatchCount === words.length

    if (allWordsPresent) {
      // ALL words found → high confidence, rank near top
      score += 500 + wordMatchCount * 60
    } else if (wordMatchCount > 0 && words.length > 2) {
      // For 3+ word queries: allow partial with very low score (user might be narrowing down)
      // e.g. "bệnh giang mai tim mạch" → 3/4 words is still useful
      score += wordMatchCount * 3
    }
    // For 2-word query: partial (1/2) = score 0 = excluded from results entirely
    // This is intentional: "khám thai" should NOT return S01.4 (thái dương)

  } else {
    // Single word query → normal substring scoring
    if (entry.normViet.includes(q)) {
      // Prefer token-level exact match over substring
      const isTokenMatch = entry.normViet.split(/[\s\-\/,;.()]+/).some(t => t === q)
      score += isTokenMatch ? 550 : 400
    }
  }

  // ─── Stage 3: English name ───────────────────────────────────────────────
  if (entry.normAnh === q) score += 400
  else if (entry.normAnh.startsWith(q)) score += 300
  else if (entry.normAnh.includes(q)) score += 180

  // ─── Stage 4: Coding guidance ────────────────────────────────────────────
  if (entry.normHuongDan.includes(q)) score += 80

  // ─── Stage 5: Synonym expansion (user term → ICD official term) ──────────
  // e.g. "khám thai" → "theo doi thai ky", "ung thư" → "u ac tinh"
  const expandedTerms = expandQuery(q)
  for (const icdTerm of expandedTerms) {
    if (entry.normViet.includes(icdTerm)) {
      score += 400   // strong signal: query synonym found in ICD name
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
  limit = 30
): Promise<{ results: ICDRecord[]; hasStrongMatch: boolean }> {
  if (!query.trim() || index.length === 0) {
    return { results: [], hasStrongMatch: false }
  }

  const rawQuery = query.trim()
  const normQuery = normalize(rawQuery)

  const scored: Array<{ score: number; rec: ICDRecord }> = []

  for (const entry of index) {
    const score = scoreEntry(entry, normQuery, rawQuery)
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
