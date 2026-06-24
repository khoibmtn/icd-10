// src/types/icd.ts

export interface SchemaHeader {
  schemaVersion: string;
  generatedAt: string;
  sourceFiles: string[];
  recordCount: number;
}

export interface BuildOutput<T> {
  meta: SchemaHeader;
  data: T[];
}

export interface ICDRecord {
  maBenh: string;
  maBenhKhongDau: string;
  tenTiengViet: string;
  tenTiengAnh: string;
  huongDanMaHoaTiengViet: string | null;
  huongDanMaHoaTiengAnh: string | null;
  chuongStt: string;
  chuongPhamViMa: string;
  chuongTenViet: string;
  chuongTenAnh: string;
  khoiMa: string;
  khoiTenViet: string;
  khoiTenAnh: string;
  nhomMa: string;
  nhomTenViet: string;
  nhomTenAnh: string;
  dieuKienSuDung: {
    khongDungLaBenhChinh: boolean;
    khongKhuyenKhichDungLaBenhChinh: boolean;
    khongSuDungViCoMaCuTheHon: boolean;
    chiSuDungMaHoaNguyenNhanTuVong: boolean;
    chiCoONuGioi: boolean;
    chiCoONamGioi: boolean;
  };
}

export interface ICDHierarchy {
  code: string;
  parentCode: string | null;
  childCodes: string[];
  siblingCodes: string[];
  level: 'chapter' | 'block' | 'subblock' | 'category' | 'subcategory';
  chapterRoman: string;
  blockRange: string;
}

export interface SourceReference {
  source: 'icd10_flat' | 'appendix' | 'guideline' | 'concept_dictionary';
  confidence: 'exact' | 'derived';
  citationLevel: 'official' | 'compiled' | 'inferred';
  file: string;
  section?: string;
  extractedText?: string;
}

export interface CodingRelation {
  source: string;
  target: string;
  relationType: 'dagger_asterisk' | 'code_first' | 'use_additional';
  provenance: SourceReference;
}

export interface InformationalRelation {
  source: string;
  target: string;
  relationType: 'includes' | 'excludes';
  description?: string;
  provenance: SourceReference;
}

export interface ICDRule {
  code: string;
  ruleType:
    | 'khongDungLaBenhChinh'
    | 'khongKhuyenKhichDungLaBenhChinh'
    | 'khongSuDungViCoMaCuTheHon'
    | 'chiSuDungMaHoaNguyenNhanTuVong'
    | 'chiCoONuGioi'
    | 'chiCoONamGioi';
  severity: 'error' | 'warning' | 'info';
  message: string;
  provenance: SourceReference;
}

export interface ICDVersion {
  code: string;
  status: 'active' | 'deprecated' | 'cancelled';
  effectiveFrom: string;
  effectiveTo?: string;
  replacedBy?: string[];
  legalBasis: string;
}

export interface Alias {
  text: string;
  type: 'official' | 'clinical' | 'abbreviation' | 'hospital';
  weight: number;
  status: 'active' | 'deprecated';
}

export interface CandidateCode {
  code: string;
  score: number;
  conditions?: string[];
  exclusions?: string[];
}

export interface ClinicalConcept {
  id: string;
  concept: string;
  aliases: Alias[];
  candidateCodes: CandidateCode[];
  status: 'active' | 'deprecated';
  createdAt: string;
  updatedAt: string;
}

export interface ExplainDecision {
  query: string;
  selectedCodes: {
    code: string;
    confidence: number;
    reasons: string[];
    provenance: SourceReference[];
  }[];
  rejectedCodes: {
    code: string;
    confidence: number;
    reason: string;
  }[];
  rulesApplied: string[];
  mode: 'template' | 'llm';
}
