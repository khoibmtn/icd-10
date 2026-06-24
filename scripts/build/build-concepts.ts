// scripts/build/build-concepts.ts
// Manual seed: 10 clinical concepts for PoC
import type { ClinicalConcept } from '../../src/types/icd.js'

export function buildConcepts(): ClinicalConcept[] {
  const now = new Date().toISOString()

  return [
    {
      id: 'concept_anc',
      concept: 'khám thai định kỳ',
      aliases: [
        { text: 'khám thai định kỳ', type: 'clinical', weight: 0.95, status: 'active' },
        { text: 'ANC', type: 'abbreviation', weight: 0.60, status: 'active' },
        { text: 'QLTN', type: 'hospital', weight: 0.50, status: 'active' },
        { text: 'khám thai thường quy', type: 'clinical', weight: 0.85, status: 'active' },
        { text: 'khám thai', type: 'clinical', weight: 0.70, status: 'active' },
      ],
      candidateCodes: [
        { code: 'Z34', score: 0.90, exclusions: ['nguy cơ cao', 'bệnh lý sản khoa'] },
        { code: 'Z35', score: 0.40, conditions: ['nguy cơ cao'] },
        { code: 'Z36', score: 0.30, conditions: ['sàng lọc', 'trước sinh'] },
      ],
      status: 'active', createdAt: now, updatedAt: now,
    },
    {
      id: 'concept_highriskanc',
      concept: 'thai nguy cơ cao',
      aliases: [
        { text: 'thai nguy cơ cao', type: 'clinical', weight: 0.95, status: 'active' },
        { text: 'high risk pregnancy', type: 'official', weight: 0.80, status: 'active' },
        { text: 'thai nguy co cao', type: 'clinical', weight: 0.85, status: 'active' },
      ],
      candidateCodes: [
        { code: 'Z35', score: 0.95 },
        { code: 'Z34', score: 0.10, conditions: ['bình thường'] },
      ],
      status: 'active', createdAt: now, updatedAt: now,
    },
    {
      id: 'concept_firstpregnancy',
      concept: 'khám thai lần đầu',
      aliases: [
        { text: 'khám thai lần đầu', type: 'clinical', weight: 0.95, status: 'active' },
        { text: 'thai lần đầu', type: 'clinical', weight: 0.85, status: 'active' },
        { text: 'thai kỳ đầu tiên', type: 'clinical', weight: 0.80, status: 'active' },
        { text: 'G1P0', type: 'hospital', weight: 0.65, status: 'active' },
      ],
      candidateCodes: [
        { code: 'Z34.0', score: 0.95 },
        { code: 'Z34', score: 0.50 },
      ],
      status: 'active', createdAt: now, updatedAt: now,
    },
    {
      id: 'concept_tngt',
      concept: 'tai nạn giao thông',
      aliases: [
        { text: 'tai nạn giao thông', type: 'clinical', weight: 0.95, status: 'active' },
        { text: 'TNGT', type: 'abbreviation', weight: 0.80, status: 'active' },
        { text: 'tai nạn xe máy', type: 'clinical', weight: 0.70, status: 'active' },
        { text: 'tai nạn ô tô', type: 'clinical', weight: 0.70, status: 'active' },
        { text: 'tai nan giao thong', type: 'clinical', weight: 0.85, status: 'active' },
      ],
      candidateCodes: [
        { code: 'V23', score: 0.80, conditions: ['xe máy'] },
        { code: 'V40', score: 0.80, conditions: ['ô tô'] },
        { code: 'V89', score: 0.50 },
      ],
      status: 'active', createdAt: now, updatedAt: now,
    },
    {
      id: 'concept_ctsn',
      concept: 'chấn thương sọ não',
      aliases: [
        { text: 'chấn thương sọ não', type: 'clinical', weight: 0.95, status: 'active' },
        { text: 'CTSN', type: 'abbreviation', weight: 0.85, status: 'active' },
        { text: 'chấn thương đầu', type: 'clinical', weight: 0.70, status: 'active' },
        { text: 'chan thuong so nao', type: 'clinical', weight: 0.85, status: 'active' },
        { text: 'chấn thương não', type: 'clinical', weight: 0.80, status: 'active' },
      ],
      candidateCodes: [
        { code: 'S06', score: 0.90 },
        { code: 'S02', score: 0.50, conditions: ['gãy xương sọ'] },
        { code: 'S00', score: 0.30 },
      ],
      status: 'active', createdAt: now, updatedAt: now,
    },
    {
      id: 'concept_dtd2',
      concept: 'đái tháo đường type 2',
      aliases: [
        { text: 'đái tháo đường type 2', type: 'clinical', weight: 0.95, status: 'active' },
        { text: 'ĐTĐ type 2', type: 'abbreviation', weight: 0.85, status: 'active' },
        { text: 'tiểu đường type 2', type: 'clinical', weight: 0.80, status: 'active' },
        { text: 'diabetes type 2', type: 'official', weight: 0.75, status: 'active' },
        { text: 'dai thao duong type 2', type: 'clinical', weight: 0.85, status: 'active' },
      ],
      candidateCodes: [
        { code: 'E11', score: 0.95 },
        { code: 'E10', score: 0.10 },
      ],
      status: 'active', createdAt: now, updatedAt: now,
    },
    {
      id: 'concept_ckd',
      concept: 'suy thận mạn',
      aliases: [
        { text: 'suy thận mạn', type: 'clinical', weight: 0.95, status: 'active' },
        { text: 'STM', type: 'abbreviation', weight: 0.80, status: 'active' },
        { text: 'CKD', type: 'abbreviation', weight: 0.75, status: 'active' },
        { text: 'bệnh thận mạn', type: 'clinical', weight: 0.85, status: 'active' },
        { text: 'suy than man', type: 'clinical', weight: 0.85, status: 'active' },
      ],
      candidateCodes: [
        { code: 'N18', score: 0.95 },
      ],
      status: 'active', createdAt: now, updatedAt: now,
    },
    {
      id: 'concept_gianmai',
      concept: 'giang mai',
      aliases: [
        { text: 'giang mai', type: 'clinical', weight: 0.95, status: 'active' },
        { text: 'syphilis', type: 'official', weight: 0.80, status: 'active' },
        { text: 'giang mai tim mạch', type: 'clinical', weight: 0.70, status: 'active' },
      ],
      candidateCodes: [
        { code: 'A52.0', score: 0.85, conditions: ['tim mạch'] },
        { code: 'A52', score: 0.70 },
        { code: 'A51', score: 0.50, conditions: ['sớm'] },
      ],
      status: 'active', createdAt: now, updatedAt: now,
    },
    {
      id: 'concept_dtd1',
      concept: 'đái tháo đường type 1',
      aliases: [
        { text: 'đái tháo đường type 1', type: 'clinical', weight: 0.95, status: 'active' },
        { text: 'ĐTĐ type 1', type: 'abbreviation', weight: 0.85, status: 'active' },
        { text: 'tiểu đường type 1', type: 'clinical', weight: 0.80, status: 'active' },
        { text: 'diabetes type 1', type: 'official', weight: 0.75, status: 'active' },
      ],
      candidateCodes: [
        { code: 'E10', score: 0.95 },
        { code: 'E11', score: 0.10 },
      ],
      status: 'active', createdAt: now, updatedAt: now,
    },
    {
      id: 'concept_ungthuminh',
      concept: 'ung thư miệng',
      aliases: [
        { text: 'ung thư miệng', type: 'clinical', weight: 0.90, status: 'active' },
        { text: 'ung thư khoang miệng', type: 'clinical', weight: 0.85, status: 'active' },
        { text: 'oral cancer', type: 'official', weight: 0.75, status: 'active' },
        { text: 'ung thu mieng', type: 'clinical', weight: 0.85, status: 'active' },
      ],
      candidateCodes: [
        { code: 'C06', score: 0.80 },
        { code: 'C02', score: 0.60, conditions: ['lưỡi'] },
        { code: 'C00', score: 0.60, conditions: ['môi'] },
      ],
      status: 'active', createdAt: now, updatedAt: now,
    },
  ]
}
