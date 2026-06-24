// tests/unit/build-pipeline.test.ts
import { describe, it, expect } from 'vitest'
import { extractPocDataset } from '../../scripts/build/extract-poc-dataset'

describe('extractPocDataset', () => {
  it('extracts all 15000+ ICD-10 records (full dataset, not PoC subset)', async () => {
    const records = await extractPocDataset()
    expect(records.length).toBeGreaterThan(10000)  // full dataset: ~15844
    expect(records.length).toBe(15844)
    // Also covers specific PoC groups
    expect(records.some(r => r.maBenh.startsWith('R07'))).toBe(true)  // đau ngực
    expect(records.some(r => r.maBenh.startsWith('I20'))).toBe(true)  // cơn đau thắt ngực
    expect(records.some(r => r.maBenh.startsWith('M54'))).toBe(true)  // đau lưng
  })

  it('contains Z34 (Group 1: khám thai)', async () => {
    const records = await extractPocDataset()
    expect(records.some(r => r.maBenh === 'Z34')).toBe(true)
  })

  it('contains A52 codes (Group 3: dagger/asterisk)', async () => {
    const records = await extractPocDataset()
    expect(records.some(r => r.maBenh.startsWith('A52'))).toBe(true)
  })

  it('contains E11 codes (Group 4: combination)', async () => {
    const records = await extractPocDataset()
    expect(records.some(r => r.maBenh.startsWith('E11'))).toBe(true)
  })

  it('contains V-codes (Group 2: TNGT)', async () => {
    const records = await extractPocDataset()
    expect(records.some(r => r.maBenh.startsWith('V'))).toBe(true)
  })

  it('contains C-codes (Group 5: ung thư)', async () => {
    const records = await extractPocDataset()
    expect(records.some(r => r.maBenh.startsWith('C0'))).toBe(true)
  })

  it('normalizes dieuKienSuDung flags to boolean', async () => {
    const records = await extractPocDataset()
    const z34 = records.find(r => r.maBenh === 'Z34')
    expect(z34).toBeDefined()
    expect(typeof z34!.dieuKienSuDung.khongSuDungViCoMaCuTheHon).toBe('boolean')
    expect(z34!.dieuKienSuDung.khongSuDungViCoMaCuTheHon).toBe(true)
  })

  it('all records have required string fields', async () => {
    const records = await extractPocDataset()
    for (const rec of records) {
      expect(typeof rec.maBenh).toBe('string')
      expect(rec.maBenh.length).toBeGreaterThan(0)
      expect(typeof rec.tenTiengViet).toBe('string')
    }
  })
})
