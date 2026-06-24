// scripts/build/build-rules.ts
import type { ICDRecord, ICDRule, SourceReference } from '../../src/types/icd.js'

const PROVENANCE_BASE: SourceReference = {
  source: 'icd10_flat',
  confidence: 'exact',
  citationLevel: 'official',
  file: 'icd10_flat.json',
}

export function buildRules(records: ICDRecord[]): ICDRule[] {
  const rules: ICDRule[] = []

  for (const rec of records) {
    const d = rec.dieuKienSuDung

    if (d.khongDungLaBenhChinh) {
      rules.push({
        code: rec.maBenh,
        ruleType: 'khongDungLaBenhChinh',
        severity: 'error',
        message: `Mã ${rec.maBenh} không được sử dụng làm bệnh chính.`,
        provenance: PROVENANCE_BASE,
      })
    }
    if (d.khongKhuyenKhichDungLaBenhChinh) {
      rules.push({
        code: rec.maBenh,
        ruleType: 'khongKhuyenKhichDungLaBenhChinh',
        severity: 'warning',
        message: `Mã ${rec.maBenh} không khuyến khích dùng làm bệnh chính.`,
        provenance: PROVENANCE_BASE,
      })
    }
    if (d.khongSuDungViCoMaCuTheHon) {
      rules.push({
        code: rec.maBenh,
        ruleType: 'khongSuDungViCoMaCuTheHon',
        severity: 'warning',
        message: `Mã ${rec.maBenh} không nên dùng vì có mã 4-5 ký tự cụ thể hơn.`,
        provenance: PROVENANCE_BASE,
      })
    }
    if (d.chiSuDungMaHoaNguyenNhanTuVong) {
      rules.push({
        code: rec.maBenh,
        ruleType: 'chiSuDungMaHoaNguyenNhanTuVong',
        severity: 'error',
        message: `Mã ${rec.maBenh} chỉ dùng để mã hóa nguyên nhân tử vong.`,
        provenance: PROVENANCE_BASE,
      })
    }
    if (d.chiCoONuGioi) {
      rules.push({
        code: rec.maBenh,
        ruleType: 'chiCoONuGioi',
        severity: 'warning',
        message: `Mã ${rec.maBenh} chỉ áp dụng cho người bệnh nữ.`,
        provenance: PROVENANCE_BASE,
      })
    }
    if (d.chiCoONamGioi) {
      rules.push({
        code: rec.maBenh,
        ruleType: 'chiCoONamGioi',
        severity: 'warning',
        message: `Mã ${rec.maBenh} chỉ áp dụng cho người bệnh nam.`,
        provenance: PROVENANCE_BASE,
      })
    }
  }

  return rules
}
