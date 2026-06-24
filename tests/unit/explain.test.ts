// tests/unit/explain.test.ts
import { describe, it, expect } from 'vitest'
import { explainCode, explainConcept } from '../../src/lib/explain'
import type { ICDRule, ClinicalConcept } from '../../src/types/icd'

// Minimal test data — not reading from /build to keep tests self-contained
const mockRules: ICDRule[] = [
  {
    code: 'Z34',
    ruleType: 'khongSuDungViCoMaCuTheHon',
    severity: 'warning',
    message: 'Mã Z34 không nên dùng vì có mã 4-5 ký tự cụ thể hơn.',
    provenance: {
      source: 'icd10_flat',
      confidence: 'exact',
      citationLevel: 'official',
      file: 'icd10_flat.json',
    },
  },
  {
    code: 'Z34.0',
    ruleType: 'chiCoONuGioi',
    severity: 'warning',
    message: 'Mã Z34.0 chỉ áp dụng cho người bệnh nữ.',
    provenance: {
      source: 'icd10_flat',
      confidence: 'exact',
      citationLevel: 'official',
      file: 'icd10_flat.json',
    },
  },
]

const mockConcepts: ClinicalConcept[] = [
  {
    id: 'concept_anc',
    concept: 'khám thai định kỳ',
    aliases: [
      { text: 'khám thai định kỳ', type: 'clinical', weight: 0.95, status: 'active' },
      { text: 'ANC', type: 'abbreviation', weight: 0.60, status: 'active' },
    ],
    candidateCodes: [
      { code: 'Z34', score: 0.90, exclusions: ['nguy cơ cao'] },
      { code: 'Z35', score: 0.40, conditions: ['nguy cơ cao'] },
    ],
    status: 'active',
    createdAt: '2026-06-24T00:00:00Z',
    updatedAt: '2026-06-24T00:00:00Z',
  },
]

describe('Explain Engine', () => {
  describe('explainCode()', () => {
    it('returns template mode (no LLM)', async () => {
      const result = await explainCode('Z34', mockRules, mockConcepts)
      expect(result.mode).toBe('template')
    })

    it('selects the queried code with confidence 1.0', async () => {
      const result = await explainCode('Z34', mockRules, mockConcepts)
      expect(result.selectedCodes).toHaveLength(1)
      expect(result.selectedCodes[0].code).toBe('Z34')
      expect(result.selectedCodes[0].confidence).toBe(1.0)
    })

    it('includes rule messages in reasons', async () => {
      const result = await explainCode('Z34', mockRules, mockConcepts)
      expect(result.selectedCodes[0].reasons).toContain('Mã Z34 không nên dùng vì có mã 4-5 ký tự cụ thể hơn.')
    })

    it('lists applied rules', async () => {
      const result = await explainCode('Z34', mockRules, mockConcepts)
      expect(result.rulesApplied).toContain('khongSuDungViCoMaCuTheHon')
    })

    it('provenance is traceable — every selected code has provenance', async () => {
      const result = await explainCode('Z34', mockRules, mockConcepts)
      for (const sel of result.selectedCodes) {
        expect(sel.provenance.length).toBeGreaterThan(0)
        expect(sel.provenance[0].source).toBeTruthy()
        expect(sel.provenance[0].citationLevel).toBeTruthy()
      }
    })

    it('returns empty rules for unknown code (still traceable)', async () => {
      const result = await explainCode('UNKNOWN', mockRules, mockConcepts)
      expect(result.selectedCodes[0].provenance[0].source).toBe('icd10_flat')
    })
  })

  describe('explainConcept()', () => {
    it('returns template mode', async () => {
      const result = await explainConcept('khám thai định kỳ', mockRules, mockConcepts)
      expect(result.mode).toBe('template')
    })

    it('matches "khám thai định kỳ" to Z34', async () => {
      const result = await explainConcept('khám thai định kỳ', mockRules, mockConcepts)
      expect(result.selectedCodes.length).toBeGreaterThan(0)
      expect(result.selectedCodes[0].code).toBe('Z34')
    })

    it('matches abbreviation "ANC" to Z34', async () => {
      const result = await explainConcept('ANC', mockRules, mockConcepts)
      expect(result.selectedCodes[0].code).toBe('Z34')
    })

    it('provides rejected codes with reasons', async () => {
      const result = await explainConcept('khám thai định kỳ', mockRules, mockConcepts)
      expect(result.rejectedCodes).toBeInstanceOf(Array)
      expect(result.rejectedCodes.length).toBeGreaterThan(0)
      expect(result.rejectedCodes[0].code).toBe('Z35')
      expect(result.rejectedCodes[0].reason).toContain('nguy cơ cao')
    })

    it('returns empty for unknown concept', async () => {
      const result = await explainConcept('xyzxyz không tồn tại', mockRules, mockConcepts)
      expect(result.selectedCodes).toHaveLength(0)
    })

    it('provenance is derived when from concept dictionary', async () => {
      const result = await explainConcept('khám thai định kỳ', mockRules, mockConcepts)
      const prov = result.selectedCodes[0].provenance[0]
      expect(prov.source).toBe('concept_dictionary')
      expect(prov.confidence).toBe('derived')
      expect(prov.citationLevel).toBe('inferred')
    })
  })
})
