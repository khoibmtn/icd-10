// scripts/build/extract-poc-dataset.ts
import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { ICDRecord } from '../../src/types/icd.js'

// PoC dataset: 5 groups covering all relation types
const POC_CODE_PREFIXES = [
  // Group 1: Khám thai (Hierarchy + Concepts + Basic rules)
  'Z30','Z31','Z32','Z33','Z34','Z35','Z36','Z37','Z38','Z39',
  // Group 2: Chấn thương + Nguyên nhân ngoài (Combination coding)
  'S00','S01','S02','S06','S09',
  'V01','V02','V03','V10','V19','V20','V23','V40','V60','V89','V99',
  // Group 3: Giang mai (Dagger † / Asterisk *)
  'A50','A51','A52','I98',
  // Group 4: ĐTĐ + Thận (code_first + use_additional)
  'E10','E11','E12','E13','E14','N18',
  // Group 5: Ung thư miệng (Excludes, Informational)
  'C00','C01','C02','C03','C04','C05','C06','C07','C08','C09','C10',
]

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

    const matchesPrefix = POC_CODE_PREFIXES.some(prefix =>
      maBenh.startsWith(prefix)
    )
    if (!matchesPrefix) continue

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
