// tests/regression/regression.test.ts
// Go/No-Go validation suite for Phase 0 PoC
import { describe, it, expect, beforeAll } from 'vitest'
import { extractPocDataset } from '../../scripts/build/extract-poc-dataset'
import { buildRules } from '../../scripts/build/build-rules'
import { buildCodingRelations } from '../../scripts/build/build-relations'
import { buildConcepts } from '../../scripts/build/build-concepts'
import { explainCode, explainConcept } from '../../src/lib/explain'
import type { ICDRecord, ICDRule, ClinicalConcept, CodingRelation } from '../../src/types/icd'

let records: ICDRecord[] = []
let rules: ICDRule[] = []
let concepts: ClinicalConcept[] = []
let codingRelations: CodingRelation[] = []

beforeAll(async () => {
  records = await extractPocDataset()
  rules = buildRules(records)
  concepts = buildConcepts()
  codingRelations = buildCodingRelations()
})

// ─── Group 1: Khám thai ─────────────────────────────────────────────────────

describe('Group 1: Khám thai (Z30–Z39)', () => {
  it('Z34 is in dataset', () => {
    expect(records.some(r => r.maBenh === 'Z34')).toBe(true)
  })

  it('Z34.0 is in dataset', () => {
    expect(records.some(r => r.maBenh === 'Z34.0')).toBe(true)
  })

  it('Z35 is in dataset', () => {
    expect(records.some(r => r.maBenh === 'Z35')).toBe(true)
  })

  it('Z34 has khongSuDungViCoMaCuTheHon rule', () => {
    const rule = rules.find(r => r.code === 'Z34' && r.ruleType === 'khongSuDungViCoMaCuTheHon')
    expect(rule).toBeDefined()
    expect(rule!.severity).toBe('warning')
    // Provenance must be traceable
    expect(rule!.provenance.source).toBe('icd10_flat')
    expect(rule!.provenance.citationLevel).toBe('official')
    expect(rule!.provenance.confidence).toBe('exact')
  })

  it('concept "khám thai định kỳ" resolves to Z34, not Z35', async () => {
    const result = await explainConcept('khám thai định kỳ', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('Z34')
    expect(result.rejectedCodes.some(r => r.code === 'Z35')).toBe(true)
  })

  it('concept "ANC" resolves to Z34', async () => {
    const result = await explainConcept('ANC', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('Z34')
    expect(result.mode).toBe('template')
  })

  it('concept "thai nguy cơ cao" resolves to Z35', async () => {
    const result = await explainConcept('thai nguy cơ cao', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('Z35')
  })

  it('concept "khám thai lần đầu" resolves to Z34.0', async () => {
    const result = await explainConcept('khám thai lần đầu', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('Z34.0')
  })
})

// ─── Group 3: Giang mai — Dagger/Asterisk ────────────────────────────────────

describe('Group 3: Giang mai Dagger/Asterisk (A50–A52, I98)', () => {
  it('A52.0 is in dataset', () => {
    expect(records.some(r => r.maBenh === 'A52.0')).toBe(true)
  })

  it('A52.0 has dagger_asterisk relation to I98.0', () => {
    const rel = codingRelations.find(
      r => r.source === 'A52.0' && r.target === 'I98.0' && r.relationType === 'dagger_asterisk'
    )
    expect(rel).toBeDefined()
    // Provenance must be traceable
    expect(rel!.provenance.source).toBeTruthy()
    expect(rel!.provenance.citationLevel).toBeTruthy()
  })

  it('explainCode A52.0 returns provenance', async () => {
    const result = await explainCode('A52.0', rules, concepts)
    expect(result.selectedCodes[0].provenance.length).toBeGreaterThan(0)
    expect(result.mode).toBe('template')
  })

  it('concept "giang mai tim mạch" resolves to A52.0', async () => {
    const result = await explainConcept('giang mai tim mạch', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('A52.0')
  })
})

// ─── Group 4: ĐTĐ + Thận — Combination coding ────────────────────────────────

describe('Group 4: ĐTĐ + Thận Combination (E10–E14, N18)', () => {
  it('E11 is in dataset', () => {
    expect(records.some(r => r.maBenh === 'E11')).toBe(true)
  })

  it('N18 is in dataset', () => {
    expect(records.some(r => r.maBenh === 'N18')).toBe(true)
  })

  it('E11 has use_additional relation to N18', () => {
    const rel = codingRelations.find(
      r => r.source === 'E11' && r.target === 'N18' && r.relationType === 'use_additional'
    )
    expect(rel).toBeDefined()
    expect(rel!.provenance.source).toBeTruthy()
  })

  it('concept "đái tháo đường type 2" resolves to E11', async () => {
    const result = await explainConcept('đái tháo đường type 2', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('E11')
    expect(result.mode).toBe('template')
  })

  it('concept "ĐTĐ type 2" (abbreviation) resolves to E11', async () => {
    const result = await explainConcept('ĐTĐ type 2', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('E11')
  })

  it('concept "suy thận mạn" resolves to N18', async () => {
    const result = await explainConcept('suy thận mạn', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('N18')
  })

  it('concept "CKD" (abbreviation) resolves to N18', async () => {
    const result = await explainConcept('CKD', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('N18')
  })
})

// ─── Group 2: Chấn thương + TNGT ────────────────────────────────────────────

describe('Group 2: Chấn thương + TNGT (S, V codes)', () => {
  it('S06 is in dataset', () => {
    expect(records.some(r => r.maBenh.startsWith('S06'))).toBe(true)
  })

  it('V23 is in dataset', () => {
    expect(records.some(r => r.maBenh.startsWith('V23'))).toBe(true)
  })

  it('concept "CTSN" resolves to S06', async () => {
    const result = await explainConcept('CTSN', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('S06')
  })

  it('concept "TNGT" resolves to V-codes', async () => {
    const result = await explainConcept('TNGT', rules, concepts)
    expect(['V23', 'V40', 'V89']).toContain(result.selectedCodes[0].code)
  })
})

// ─── Group 5: Ung thư ───────────────────────────────────────────────────────

describe('Group 5: Ung thư (C00–C10)', () => {
  it('C codes are in dataset', () => {
    expect(records.some(r => r.maBenh.startsWith('C0'))).toBe(true)
  })

  it('concept "ung thư miệng" resolves to C06', async () => {
    const result = await explainConcept('ung thư miệng', rules, concepts)
    expect(result.selectedCodes[0].code).toBe('C06')
  })
})

// ─── Cross-cutting: Go/No-Go Criteria ───────────────────────────────────────

describe('Go/No-Go: Provenance 100% traceability', () => {
  it('ALL rules have provenance with source, citationLevel, confidence', () => {
    for (const rule of rules) {
      expect(rule.provenance.source).toBeTruthy()
      expect(rule.provenance.citationLevel).toBeTruthy()
      expect(rule.provenance.confidence).toBeTruthy()
      expect(rule.provenance.file).toBeTruthy()
    }
  })

  it('ALL coding relations have provenance', () => {
    for (const rel of codingRelations) {
      expect(rel.provenance.source).toBeTruthy()
      expect(rel.provenance.citationLevel).toBeTruthy()
    }
  })
})

describe('Go/No-Go: Explain Engine ≥90% template mode (no LLM)', () => {
  const TEST_QUERIES = [
    { q: 'khám thai định kỳ', expected: 'Z34' },
    { q: 'ANC', expected: 'Z34' },
    { q: 'thai nguy cơ cao', expected: 'Z35' },
    { q: 'khám thai lần đầu', expected: 'Z34.0' },
    { q: 'CTSN', expected: 'S06' },
    { q: 'đái tháo đường type 2', expected: 'E11' },
    { q: 'ĐTĐ type 2', expected: 'E11' },
    { q: 'suy thận mạn', expected: 'N18' },
    { q: 'CKD', expected: 'N18' },
    { q: 'ung thư miệng', expected: 'C06' },
  ]

  it('all test queries use template mode (no LLM calls)', async () => {
    for (const { q } of TEST_QUERIES) {
      const result = await explainConcept(q, rules, concepts)
      expect(result.mode).toBe('template')
    }
  })

  it('≥90% of queries return correct expected code', async () => {
    let correct = 0
    for (const { q, expected } of TEST_QUERIES) {
      const result = await explainConcept(q, rules, concepts)
      if (result.selectedCodes.some(c => c.code === expected)) correct++
    }
    const rate = correct / TEST_QUERIES.length
    console.log(`Explain accuracy: ${correct}/${TEST_QUERIES.length} = ${(rate * 100).toFixed(0)}%`)
    expect(rate).toBeGreaterThanOrEqual(0.9)
  })
})

describe('Go/No-Go: Rules 100% accurate on PoC', () => {
  it('Z34 has khongSuDungViCoMaCuTheHon rule (expected from data)', () => {
    const z34 = records.find(r => r.maBenh === 'Z34')
    expect(z34?.dieuKienSuDung.khongSuDungViCoMaCuTheHon).toBe(true)
    const rule = rules.find(r => r.code === 'Z34' && r.ruleType === 'khongSuDungViCoMaCuTheHon')
    expect(rule).toBeDefined()
  })

  it('every record with chiCoONuGioi=true has corresponding rule', () => {
    const femaleRecords = records.filter(r => r.dieuKienSuDung.chiCoONuGioi)
    for (const rec of femaleRecords) {
      const rule = rules.find(r => r.code === rec.maBenh && r.ruleType === 'chiCoONuGioi')
      expect(rule).toBeDefined()
    }
  })

  it('every record with khongDungLaBenhChinh=true has corresponding error rule', () => {
    const notPrincipal = records.filter(r => r.dieuKienSuDung.khongDungLaBenhChinh)
    for (const rec of notPrincipal) {
      const rule = rules.find(r => r.code === rec.maBenh && r.ruleType === 'khongDungLaBenhChinh')
      expect(rule).toBeDefined()
      expect(rule!.severity).toBe('error')
    }
  })
})
