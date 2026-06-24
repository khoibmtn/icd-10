// scripts/build/extract-poc-dataset.ts
// Full dataset: tất cả 15,845 mã ICD-10 Việt Nam
// (không còn giới hạn PoC prefix — đủ coverage cho production)
import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { ICDRecord } from '../../src/types/icd.js'

function normalizeBool(val: unknown): boolean {
  if (val === null || val === undefined || val === '' || val === false) return false
  return true
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

    // Strip dagger † and asterisk * symbols from code (they are metadata, not part of the code)
    const maBenh = rawMaBenh.replace(/[†*]/g, '').trim()
    if (!maBenh) continue

    // All records included — no prefix filter
    const chuong = r.chuong as Record<string, unknown> | undefined
    const khoi = r.khoi as Record<string, unknown> | undefined
    const nhom = r.nhomBenh3KyTu as Record<string, unknown> | undefined
    const dieu = benh?.dieuKienSuDung as Record<string, unknown> | undefined

    records.push({
      maBenh: String(maBenh),
      maBenhKhongDau: String(benh?.maBenhKhongDau || maBenh).replace(/[†*]/g, '').trim(),
      tenTiengViet: String(benh?.tenTiengViet || ''),
      tenTiengAnh: String(benh?.tenTiengAnh || ''),
      huongDanMaHoaTiengViet: (benh?.huongDanMaHoaTiengViet as string) || null,
      huongDanMaHoaTiengAnh: (benh?.huongDanMaHoaTiengAnh as string) || null,
      chuongStt: String(chuong?.stt || ''),
      chuongPhamViMa: String(chuong?.phamViMa || ''),
      chuongTenViet: String(chuong?.tenTiengViet || ''),
      chuongTenAnh: String(chuong?.tenTiengAnh || ''),
      khoiMa: String(khoi?.ma || ''),
      khoiTenViet: String(khoi?.tenTiengViet || ''),
      khoiTenAnh: String(khoi?.tenTiengAnh || ''),
      nhomMa: String(nhom?.ma || ''),
      nhomTenViet: String(nhom?.tenTiengViet || ''),
      nhomTenAnh: String(nhom?.tenTiengAnh || ''),
      dieuKienSuDung: {
        khongDungLaBenhChinh: normalizeBool(dieu?.khongDungLaBenhChinh),
        khongKhuyenKhichDungLaBenhChinh: normalizeBool(dieu?.khongKhuyenKhichDungLaBenhChinh),
        khongSuDungViCoMaCuTheHon: normalizeBool(dieu?.khongSuDungViCoMaCuTheHon),
        chiSuDungMaHoaNguyenNhanTuVong: normalizeBool(dieu?.chiSuDungMaHoaNguyenNhanTuVong),
        chiCoONuGioi: normalizeBool(dieu?.chiCoONuGioi),
        chiCoONamGioi: normalizeBool(dieu?.chiCoONamGioi),
      },
    })
  }

  return records
}
