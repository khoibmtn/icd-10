// tests/unit/search.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { buildSearchIndex, search, searchByCode } from '../../src/lib/search'
import searchIndexData from '../../public/build/search_index.json'
import type { ICDRecord } from '../../src/types/icd'

const records = searchIndexData.data as ICDRecord[]

beforeAll(async () => {
  await buildSearchIndex(records)
})

describe('Search Engine — Code Mode', () => {
  it('finds Z34 by exact code — ranked first before subcodes', async () => {
    const { results } = await search('Z34')
    // Z34 exact match must come before Z34.0, Z34.1 etc.
    expect(results[0]?.maBenh).toBe('Z34')
  })

  it('finds Z34.0 by exact code', async () => {
    const { results } = await search('Z34.0')
    expect(results[0]?.maBenh).toBe('Z34.0')
  })

  it('finds codes starting with Z34 when searching "Z34"', async () => {
    const { results } = await search('Z34')
    const codes = results.map(r => r.maBenh)
    // All Z34.x codes should appear near the top
    expect(codes.some(c => c.startsWith('Z34'))).toBe(true)
  })

  it('finds A52.0 by exact code', async () => {
    const { results } = await search('A52.0')
    expect(results[0]?.maBenh).toBe('A52.0')
  })

  it('finds E11 by exact code — ranked first before E11.x subcodes', async () => {
    const { results } = await search('E11')
    expect(results[0]?.maBenh).toBe('E11')
  })
})

describe('Search Engine — Vietnamese Term Mode', () => {
  it('"khám thai" returns Z34-group codes, NOT cancer codes', async () => {
    const { results } = await search('khám thai')
    const topCodes = results.slice(0, 5).map(r => r.maBenh)

    // Should NOT contain C10.4 (ung thư) or S02.5 (gãy răng) or S01.4 (vết thương thái dương)
    expect(topCodes).not.toContain('C10.4')
    expect(topCodes).not.toContain('S02.5')
    expect(topCodes).not.toContain('S01.4')

    // Should contain Z34-family codes
    expect(results.some(r => r.maBenh.startsWith('Z34'))).toBe(true)
  })

  it('"khám thai" top result is a Z34 code', async () => {
    const { results } = await search('khám thai')
    expect(results[0]?.maBenh).toMatch(/^Z3/)
  })

  it('"thai kỳ bình thường" finds Z34', async () => {
    const { results } = await search('thai kỳ bình thường')
    expect(results.some(r => r.maBenh.startsWith('Z34'))).toBe(true)
  })

  it('"giang mai" returns giang mai-related codes (A5x or I98)', async () => {
    const { results } = await search('giang mai')
    // I98.0 = "Giang mai tim mạch" starts with query = valid top result
    // A50-A52 also valid — all are giang mai codes
    const topCode = results[0]?.maBenh
    expect(['I98.0', ...results.filter(r => r.maBenh.startsWith('A5')).map(r => r.maBenh)]).toContain(topCode)
    // Must include A5x codes in results
    expect(results.some(r => r.maBenh.startsWith('A5'))).toBe(true)
    // Must NOT include completely unrelated codes in top 5
    const top5 = results.slice(0, 5).map(r => r.maBenh)
    expect(top5.some(c => c.startsWith('Z3'))).toBe(false)
    expect(top5.some(c => c.startsWith('S0'))).toBe(false)
  })

  it('"đái tháo đường" returns E1x codes', async () => {
    const { results } = await search('đái tháo đường')
    const codes = results.map(r => r.maBenh)
    expect(codes.some(c => c.startsWith('E1'))).toBe(true)
  })

  it('"suy thận mạn" returns N18', async () => {
    const { results } = await search('suy thận mạn')
    expect(results.some(r => r.maBenh.startsWith('N18'))).toBe(true)
  })

  it('"ung thư" returns C-codes', async () => {
    const { results } = await search('ung thư')
    const codes = results.map(r => r.maBenh)
    expect(codes.some(c => c.startsWith('C'))).toBe(true)
  })

  it('"chấn thương đầu" returns S-codes', async () => {
    const { results } = await search('chấn thương đầu')
    const codes = results.map(r => r.maBenh)
    expect(codes.some(c => c.startsWith('S'))).toBe(true)
  })
})

describe('Search Engine — Accent-insensitive (no diacritics)', () => {
  it('"kham thai" (no diacritics) still finds Z34 family', async () => {
    const { results } = await search('kham thai')
    expect(results.some(r => r.maBenh.startsWith('Z34'))).toBe(true)
  })

  it('"dai thao duong" (no diacritics) finds E11', async () => {
    const { results } = await search('dai thao duong')
    const codes = results.map(r => r.maBenh)
    expect(codes.some(c => c.startsWith('E1'))).toBe(true)
  })
})

describe('Search Engine — Performance', () => {
  it('search latency < 30ms', async () => {
    const start = performance.now()
    await search('khám thai')
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(30)
  })

  it('returns empty for empty query', async () => {
    const { results } = await search('')
    expect(results).toHaveLength(0)
  })

  it('searchByCode finds exact record', async () => {
    const rec = await searchByCode('Z34')
    expect(rec?.maBenh).toBe('Z34')
  })

  it('searchByCode returns null for unknown code', async () => {
    const rec = await searchByCode('ZZZZ')
    expect(rec).toBeNull()
  })
})
