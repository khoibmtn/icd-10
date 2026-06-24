// scripts/build/build-relations.ts
// Manually curated dagger/asterisk + coding relations for PoC
// Source: WHO ICD-10 standard + Phụ lục hướng dẫn mã hóa Bộ Y tế VN
import type { CodingRelation, InformationalRelation, SourceReference } from '../../src/types/icd.js'

const OFFICIAL: SourceReference = {
  source: 'icd10_flat',
  confidence: 'exact',
  citationLevel: 'official',
  file: 'icd10_flat.json',
}

// Known dagger(†)/asterisk(*) pairs in PoC dataset
// Dagger = cause (etiological), Asterisk = manifestation
const DAGGER_ASTERISK_PAIRS = [
  { source: 'A52.0', target: 'I98.0' },  // Giang mai tim mạch → Tim mạch do giang mai
  { source: 'A50.4', target: 'G94.8' },  // Giang mai thần kinh muộn
  { source: 'E10.2', target: 'H36.0' },  // ĐTĐ type 1 + bệnh võng mạc
  { source: 'E11.2', target: 'H36.0' },  // ĐTĐ type 2 + bệnh võng mạc
  { source: 'E11.3', target: 'H36.0' },  // ĐTĐ type 2 + bệnh mắt
]

// Use additional code pairs
const USE_ADDITIONAL_PAIRS = [
  { source: 'N18', target: 'E11' },  // CKD — use additional for underlying diabetes
  { source: 'E11', target: 'N18' },  // DM type 2 — use additional for CKD stage
  { source: 'S06', target: 'V01' },  // CTSN — use additional for external cause
  { source: 'S06', target: 'V23' },  // CTSN + tai nạn xe máy
]

export function buildCodingRelations(): CodingRelation[] {
  const relations: CodingRelation[] = []

  for (const pair of DAGGER_ASTERISK_PAIRS) {
    relations.push({
      source: pair.source,
      target: pair.target,
      relationType: 'dagger_asterisk',
      provenance: OFFICIAL,
    })
  }

  for (const pair of USE_ADDITIONAL_PAIRS) {
    relations.push({
      source: pair.source,
      target: pair.target,
      relationType: 'use_additional',
      provenance: OFFICIAL,
    })
  }

  return relations
}

export function buildInfoRelations(): InformationalRelation[] {
  // Seeded with known excludes for PoC groups
  // Will be expanded with NLP parser in Phase 1
  return [
    {
      source: 'Z34',
      target: 'Z35',
      relationType: 'excludes',
      description: 'Thai kỳ bình thường (Z34) loại trừ thai nguy cơ cao (Z35)',
      provenance: { ...OFFICIAL, confidence: 'derived', citationLevel: 'compiled' },
    },
    {
      source: 'E11',
      target: 'E10',
      relationType: 'excludes',
      description: 'ĐTĐ type 2 loại trừ ĐTĐ type 1 (E10)',
      provenance: { ...OFFICIAL, confidence: 'derived', citationLevel: 'compiled' },
    },
  ]
}
