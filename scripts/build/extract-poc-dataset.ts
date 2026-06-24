// scripts/build/extract-poc-dataset.ts
// Full dataset: tất cả 15,845 mã ICD-10 Việt Nam
import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { ICDRecord } from '../../src/types/icd.js'

function normalizeBool(val: unknown): boolean {
  if (val === null || val === undefined || val === '' || val === false) return false
  return true
}

/** Parse the coding symbol († or *) from the raw maBenh field.
 *  Raw examples: "A17.0†", "G01*", "A17.0", "D63*"
 */
function parseCodingSymbol(rawCode: string): '†' | '*' | null {
  if (rawCode.includes('†')) return '†'
  if (rawCode.includes('*')) return '*'
  return null
}

/** Parse companion code from disease name.
 *  Dagger (†) codes have asterisk companion in parentheses in name:
 *    "Viêm màng não do bệnh lao (G01*)" → "G01"
 *  Asterisk (*) codes have dagger companion in parentheses in name:
 *    "Sa sút trí tuệ do bệnh Alzheimer (G30.-†)" → "G30"
 *    "Thiếu máu do bệnh u tân sinh (C00.- - D48.-†)" → "C00" (first code)
 */
function parseCompanionCode(name: string): string | null {
  // Match pattern: (CODES*) or (CODES†) at end of name
  // e.g. (G01*), (G30.-†), (C00.- - D48.-†), (M01.3-*)
  const match = name.match(/\(([A-Z]\d{2}[^)]*?)[\*†]\)/)
  if (!match) return null

  // Extract just the first code (ignore ranges like "C00.- - D48.-")
  const codeStr = match[1].trim()
  // Take only the clean base code (stop at -, space, or dot-dash)
  const baseMatch = codeStr.match(/^([A-Z]\d{2}(?:\.\d+)?)/)
  return baseMatch ? baseMatch[1] : null
}

export async function extractPocDataset(): Promise<ICDRecord[]> {
  // Use process.cwd() for Vitest compatibility (import.meta.url resolves differently in test runner)
  const rawPath = resolve(process.cwd(), 'icd10_flat.json')
  const raw: unknown[] = JSON.parse(readFileSync(rawPath, 'utf-8'))

  const records: ICDRecord[] = []

  for (const row of raw) {
    const r = row as Record<string, unknown>
    const benh = r.benh as Record<string, unknown> | undefined
    const rawMaBenh = benh?.maBenh as string | undefined

    if (!rawMaBenh || rawMaBenh === 'MÃ BỆNH' || !rawMaBenh.trim()) continue

    // Extract symbol BEFORE stripping (preserve semantic metadata)
    const codingSymbol = parseCodingSymbol(rawMaBenh)

    // Clean code = strip dagger/asterisk for DB key (indexing, lookups, hierarchy)
    const maBenh = rawMaBenh.replace(/[†*]/g, '').trim()
    if (!maBenh) continue

    const tenViet = String(benh?.tenTiengViet || '')
    const tenAnh  = String(benh?.tenTiengAnh || '')

    // Parse companion code from Vietnamese name (preferred) or English name
    const companionCode = parseCompanionCode(tenViet) || parseCompanionCode(tenAnh)

    const chuong = r.chuong as Record<string, unknown> | undefined
    const khoi = r.khoi as Record<string, unknown> | undefined
    const nhom = r.nhomBenh3KyTu as Record<string, unknown> | undefined
    const dieu = benh?.dieuKienSuDung as Record<string, unknown> | undefined

    // Asterisk (*) codes are ALWAYS non-primary diagnosis by ICD-10 standard
    // (even if dieuKienSuDung.khongDungLaBenhChinh is not explicitly set)
    const isStarCode = codingSymbol === '*'

    records.push({
      maBenh: String(maBenh),
      maBenhKhongDau: String(benh?.maBenhKhongDau || maBenh).replace(/[†*]/g, '').trim(),
      tenTiengViet: tenViet,
      tenTiengAnh:  tenAnh,
      huongDanMaHoaTiengViet: (benh?.huongDanMaHoaTiengViet as string) || null,
      huongDanMaHoaTiengAnh:  (benh?.huongDanMaHoaTiengAnh  as string) || null,
      chuongStt:       String(chuong?.stt || ''),
      chuongPhamViMa:  String(chuong?.phamViMa || ''),
      chuongTenViet:   String(chuong?.tenTiengViet || ''),
      chuongTenAnh:    String(chuong?.tenTiengAnh || ''),
      khoiMa:          String(khoi?.ma || ''),
      khoiTenViet:     String(khoi?.tenTiengViet || ''),
      khoiTenAnh:      String(khoi?.tenTiengAnh || ''),
      nhomMa:          String(nhom?.ma || ''),
      nhomTenViet:     String(nhom?.tenTiengViet || ''),
      nhomTenAnh:      String(nhom?.tenTiengAnh || ''),
      dieuKienSuDung: {
        khongDungLaBenhChinh:             isStarCode || normalizeBool(dieu?.khongDungLaBenhChinh),
        khongKhuyenKhichDungLaBenhChinh:  normalizeBool(dieu?.khongKhuyenKhichDungLaBenhChinh),
        khongSuDungViCoMaCuTheHon:         normalizeBool(dieu?.khongSuDungViCoMaCuTheHon),
        chiSuDungMaHoaNguyenNhanTuVong:    normalizeBool(dieu?.chiSuDungMaHoaNguyenNhanTuVong),
        chiCoONuGioi:                      normalizeBool(dieu?.chiCoONuGioi),
        chiCoONamGioi:                     normalizeBool(dieu?.chiCoONamGioi),
      },
      codingSymbol,
      companionCode,
    })
  }

  return records
}
