// src/lib/db.ts
import Dexie, { type Table } from 'dexie'
import type { ICDRecord, ICDHierarchy, ICDRule, CodingRelation, InformationalRelation, ClinicalConcept } from '../types/icd'

export class ICDDatabase extends Dexie {
  records!: Table<ICDRecord>
  hierarchy!: Table<ICDHierarchy>
  rules!: Table<ICDRule & { _id?: number }>
  codingRelations!: Table<CodingRelation & { _id?: number }>
  infoRelations!: Table<InformationalRelation & { _id?: number }>
  concepts!: Table<ClinicalConcept>

  constructor() {
    super('icd10-vietnam-v1')
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

export async function seedDatabase(): Promise<void> {
  const count = await icdDb.records.count()
  if (count > 0) return // already seeded

  const [searchData, hierarchyData, rulesData, relData, infoData, conceptsData] = await Promise.all([
    fetch('/build/search_index.json').then(r => r.json()),
    fetch('/build/hierarchy.json').then(r => r.json()),
    fetch('/build/rules.json').then(r => r.json()),
    fetch('/build/coding_relations.json').then(r => r.json()),
    fetch('/build/info_relations.json').then(r => r.json()),
    fetch('/build/concepts.json').then(r => r.json()),
  ])

  await Promise.all([
    icdDb.records.bulkPut(searchData.data),
    icdDb.hierarchy.bulkPut(hierarchyData.data),
    icdDb.rules.bulkPut(rulesData.data),
    icdDb.codingRelations.bulkPut(relData.data),
    icdDb.infoRelations.bulkPut(infoData.data),
    icdDb.concepts.bulkPut(conceptsData.data),
  ])
}

export async function getRecord(code: string): Promise<ICDRecord | undefined> {
  return icdDb.records.get(code)
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
