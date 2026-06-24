// scripts/build/build-rules.ts
import type { ICDRecord, ICDRule, SourceReference } from '../../src/types/icd.js'

const PROVENANCE_BASE: SourceReference = {
  source: 'icd10_flat',
  confidence: 'exact',
  citationLevel: 'official',
  file: 'icd10_flat.json',
}

const PROVENANCE_GUIDELINE: SourceReference = {
  source: 'guideline',
  confidence: 'exact',
  citationLevel: 'official',
  file: 'PL2_Huong_dan_nguyen_tac_ma_hoa_ICD10.docx',
  section: '7.1 — Hệ thống mã kép dấu găm và dấu sao',
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

    // ── Dual-coding rules (PL2 section 7.1) ────────────────────────────────

    if (rec.codingSymbol === '*') {
      // * codes MUST NOT be used as primary diagnosis (bệnh chính)
      // This is an ICD-10 standard rule, not just BYT recommendation
      // Note: khongDungLaBenhChinh is already set to true for * codes in extract-poc-dataset,
      // but we add a dedicated rule for richer display (different RULE_META in UI)
      if (!d.khongDungLaBenhChinh) {
        // Safety fallback: if dieuKienSuDung didn't auto-set it, add the rule explicitly
        rules.push({
          code: rec.maBenh,
          ruleType: 'maDauSaoKhongLaBenhChinh',
          severity: 'error',
          message: `Mã ${rec.maBenh}* có dấu sao (*) không được dùng làm bệnh chính. Phải ghi mã dấu găm (†) làm bệnh chính và mã ${rec.maBenh}* là bệnh kèm theo.`,
          provenance: PROVENANCE_GUIDELINE,
        })
      } else {
        // Always add a specific * rule so the UI can show the companion info
        rules.push({
          code: rec.maBenh,
          ruleType: 'maDauSaoKhongLaBenhChinh',
          severity: 'error',
          message: rec.companionCode
            ? `Mã ${rec.maBenh}* là mã biểu hiện bệnh, không được dùng làm bệnh chính. Bệnh chính phải ghi mã nguyên nhân có dấu găm (†)${rec.companionCode ? `, ví dụ: ${rec.companionCode}†` : ''}.`
            : `Mã ${rec.maBenh}* là mã biểu hiện bệnh, không được dùng làm bệnh chính.`,
          provenance: PROVENANCE_GUIDELINE,
        })
      }
    }

    if (rec.codingSymbol === '†' && rec.companionCode) {
      // † codes MUST be paired with the corresponding * code as secondary diagnosis
      rules.push({
        code: rec.maBenh,
        ruleType: 'maDauGamCanKemMaDauSao',
        severity: 'warning',
        message: `Mã ${rec.maBenh}† là mã nguyên nhân/bệnh sinh. Bắt buộc phải ghi thêm mã biểu hiện ${rec.companionCode}* là bệnh kèm theo.`,
        provenance: PROVENANCE_GUIDELINE,
      })
    }
  }

  return rules
}
