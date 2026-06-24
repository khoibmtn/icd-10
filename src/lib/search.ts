// src/lib/search.ts
// Multi-stage search engine cho ICD-10 tiếng Việt
// Stage 1: Code match  (exact/prefix) — highest priority
// Stage 2: Vietnamese name contains (substring, normalized)
// Stage 3: English name contains
// Stage 4: Coding guidance contains
// Orama fuzzy bị loại bỏ vì gây nhiều false positive với dấu tiếng Việt

import type { ICDRecord } from '../types/icd'

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

  // Multi-word scoring: every query word must appear in the name
  const words = q.split(/\s+/).filter(w => w.length >= 2)
  if (words.length > 0) {
    let wordMatchCount = 0
    let allWordsPresent = true
    for (const word of words) {
      if (entry.normViet.includes(word)) {
        wordMatchCount++
      } else {
        allWordsPresent = false
      }
    }

    // Only score if ALL words are present (prevents partial false matches)
    if (allWordsPresent) {
      score += 500 + wordMatchCount * 50  // all words found = strong signal
    } else if (wordMatchCount > 0) {
      score += wordMatchCount * 80        // partial — weaker signal
    }
  } else {
    // Single word
    if (entry.normViet.includes(q)) score += 500
  }

  // ─── Stage 3: English name ───────────────────────────────────────────────
  if (entry.normAnh === q) score += 400
  else if (entry.normAnh.startsWith(q)) score += 300
  else if (entry.normAnh.includes(q)) score += 180

  // ─── Stage 4: Coding guidance ────────────────────────────────────────────
  if (entry.normHuongDan.includes(q)) score += 80

  return score
}

// ─── Public search API ────────────────────────────────────────────────────────

export async function search(query: string, limit = 30): Promise<ICDRecord[]> {
  if (!query.trim() || index.length === 0) return []

  const rawQuery = query.trim()
  const normQuery = normalize(rawQuery)

  // Score every entry
  const scored: Array<{ score: number; rec: ICDRecord }> = []

  for (const entry of index) {
    const score = scoreEntry(entry, normQuery, rawQuery)
    if (score > 0) {
      scored.push({ score, rec: entry.rec })
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map(s => s.rec)
}

export async function searchByCode(code: string): Promise<ICDRecord | null> {
  const normCode = code.toLowerCase().trim()
  const entry = index.find(e => e.normCode === normCode)
  return entry ? entry.rec : null
}
