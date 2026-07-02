// src/lib/db.ts
import Dexie, { type Table } from 'dexie'
import type { ICDRecord, ICDHierarchy, ICDRule, CodingRelation, InformationalRelation, ClinicalConcept } from '../types/icd'

// Bump this when data changes to force re-seed
const DB_NAME = 'icd10-vietnam-v4'
const EXPECTED_MIN_RECORDS = 10000  // full dataset: ~15844

export class ICDDatabase extends Dexie {
  records!: Table<ICDRecord>
  hierarchy!: Table<ICDHierarchy>
  rules!: Table<ICDRule & { _id?: number }>
  codingRelations!: Table<CodingRelation & { _id?: number }>
  infoRelations!: Table<InformationalRelation & { _id?: number }>
  concepts!: Table<ClinicalConcept>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      records: 'maBenh, maBenhKhongDau',
      hierarchy: 'code, parentCode',
      rules: '++_id, code, ruleType',
      codingRelations: '++_id, source, target, relationType',
      infoRelations: '++_id, source, target, relationType',
      concepts: 'id, concept',
    })
  }
}

export const icdDb = new ICDDatabase()

export async function seedDatabase(onProgress?: (msg: string) => void): Promise<void> {
  const count = await icdDb.records.count()

  // Re-seed if: empty OR stale (old PoC data with < EXPECTED_MIN_RECORDS)
  if (count >= EXPECTED_MIN_RECORDS) return

  if (count > 0) {
    onProgress?.('Phát hiện dữ liệu cũ — đang xóa và tải lại...')
    await Promise.all([
      icdDb.records.clear(),
      icdDb.hierarchy.clear(),
      icdDb.rules.clear(),
      icdDb.codingRelations.clear(),
      icdDb.infoRelations.clear(),
      icdDb.concepts.clear(),
    ])
  }

  onProgress?.('Tải dữ liệu từ máy chủ...')
  const [searchData, hierarchyData, rulesData, relData, infoData, conceptsData] = await Promise.all([
    fetch('/build/search_index.json').then(r => r.json()),
    fetch('/build/hierarchy.json').then(r => r.json()),
    fetch('/build/rules.json').then(r => r.json()),
    fetch('/build/coding_relations.json').then(r => r.json()),
    fetch('/build/info_relations.json').then(r => r.json()),
    fetch('/build/concepts.json').then(r => r.json()),
  ])

  onProgress?.('Lưu 15.844 mã vào IndexedDB...')
  await icdDb.records.bulkPut(searchData.data)

  onProgress?.('Lưu cấu trúc phân cấp...')
  await icdDb.hierarchy.bulkPut(hierarchyData.data)

  onProgress?.('Lưu quy tắc mã hóa...')
  await Promise.all([
    icdDb.rules.bulkPut(rulesData.data),
    icdDb.codingRelations.bulkPut(relData.data),
    icdDb.infoRelations.bulkPut(infoData.data),
    icdDb.concepts.bulkPut(conceptsData.data),
  ])
}

export async function getRecord(code: string): Promise<ICDRecord | undefined> {
  return icdDb.records.get(code)
}

/**
 * Get direct child records for a code (1 level deep).
 * Uses hierarchy.childCodes — avoids N+1 by using bulkGet.
 * For I20 → [I20.0, I20.1, I20.8, I20.9]
 * For M54 → [M54.0, M54.1, M54.2, ...] (direct children only, not grandchildren)
 */
export async function getChildRecords(code: string): Promise<ICDRecord[]> {
  const hier = await icdDb.hierarchy.get(code)
  if (!hier || !hier.childCodes || hier.childCodes.length === 0) return []

  // Direct children: childCodes whose parentCode matches this code
  // Filter to only 1-level-deep: starts with `code.` or starts with `code` and is next level
  const directChildren = hier.childCodes.filter(child => {
    // I20 → I20.0, I20.1 ✅  but not I20.01 if I20.0 already listed
    const after = child.slice(code.length)
    // after should be '.' followed by digits/letters (no further dot)
    return after.startsWith('.') && !after.slice(1).includes('.')
  })

  // Fallback: if no dotted children found (e.g. 3-char parent), take all children
  const toFetch = directChildren.length > 0 ? directChildren : hier.childCodes.slice(0, 30)

  const records = await icdDb.records.bulkGet(toFetch)
  return records.filter((r): r is ICDRecord => r !== undefined)
}

/**
 * Get sibling records (same parent group) for a code.
 * Uses hierarchy.siblingCodes — capped at 20.
 */
export async function getSiblingRecords(code: string): Promise<ICDRecord[]> {
  const hier = await icdDb.hierarchy.get(code)
  if (!hier || !hier.siblingCodes || hier.siblingCodes.length === 0) return []
  const records = await icdDb.records.bulkGet(hier.siblingCodes.slice(0, 20))
  return records.filter((r): r is ICDRecord => r !== undefined)
}

export async function getRulesForCode(code: string): Promise<(ICDRule & { _id?: number })[]> {
  return icdDb.rules.where('code').equals(code).toArray()
}

export async function getCodingRelations(code: string): Promise<(CodingRelation & { _id?: number })[]> {
  return icdDb.codingRelations.where('source').equals(code).toArray()
}

export async function getInfoRelations(code: string): Promise<(InformationalRelation & { _id?: number })[]> {
  return icdDb.infoRelations.where('source').equals(code).toArray()
}

export async function getHierarchy(code: string): Promise<ICDHierarchy | undefined> {
  return icdDb.hierarchy.get(code)
}

export async function getAllConcepts(): Promise<ClinicalConcept[]> {
  return icdDb.concepts.toArray()
}
