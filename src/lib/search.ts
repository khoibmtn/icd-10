// src/lib/search.ts
import { create, insert, search as oramaSearch, count } from '@orama/orama'
import type { ICDRecord } from '../types/icd'

type SearchDb = Awaited<ReturnType<typeof create>>

let db: SearchDb | null = null

export async function buildSearchIndex(records: ICDRecord[]): Promise<void> {
  db = await create({
    schema: {
      maBenh: 'string',
      maBenhKhongDau: 'string',
      tenTiengViet: 'string',
      tenTiengAnh: 'string',
      huongDanMaHoaTiengViet: 'string',
    } as const,
  })

  for (const rec of records) {
    await insert(db, {
      maBenh: rec.maBenh,
      maBenhKhongDau: rec.maBenhKhongDau,
      tenTiengViet: rec.tenTiengViet,
      tenTiengAnh: rec.tenTiengAnh,
      huongDanMaHoaTiengViet: rec.huongDanMaHoaTiengViet ?? '',
    })
  }
}

export function isIndexReady(): boolean {
  return db !== null
}

export async function search(query: string, limit = 20): Promise<ICDRecord[]> {
  if (!db) throw new Error('Search index not initialized. Call buildSearchIndex() first.')

  const results = await oramaSearch(db, {
    term: query,
    limit,
    tolerance: 1, // fuzzy — allows 1 typo
  })

  return results.hits.map(h => h.document as unknown as ICDRecord)
}

export async function searchByCode(code: string): Promise<ICDRecord | null> {
  if (!db) throw new Error('Search index not initialized.')

  const results = await oramaSearch(db, {
    term: code,
    where: { maBenh: code },
    limit: 1,
  })

  return results.hits.length > 0 ? (results.hits[0].document as unknown as ICDRecord) : null
}
