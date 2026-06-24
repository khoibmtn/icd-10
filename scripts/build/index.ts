// scripts/build/index.ts
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { extractPocDataset } from './extract-poc-dataset.js'
import { buildHierarchy } from './build-hierarchy.js'
import { buildRules } from './build-rules.js'
import { buildCodingRelations, buildInfoRelations } from './build-relations.js'
import { buildConcepts } from './build-concepts.js'

const OUT_DIR = resolve(new URL('.', import.meta.url).pathname, '../../public/build')

function writeJson(filename: string, data: unknown[]) {
  const payload = {
    meta: {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      sourceFiles: ['icd10_flat.json'],
      recordCount: data.length,
    },
    data,
  }
  writeFileSync(resolve(OUT_DIR, filename), JSON.stringify(payload, null, 2), 'utf-8')
  console.log(`✅ ${filename} — ${data.length} records`)
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  console.log('🔨 Starting ICD-10 PoC Build Pipeline...\n')

  const records = await extractPocDataset()
  console.log(`📦 Extracted ${records.length} PoC records from 5 groups\n`)

  writeJson('search_index.json', records)
  writeJson('hierarchy.json', buildHierarchy(records))
  writeJson('rules.json', buildRules(records))
  writeJson('coding_relations.json', buildCodingRelations())
  writeJson('info_relations.json', buildInfoRelations())
  writeJson('concepts.json', buildConcepts())

  console.log('\n✅ Build pipeline complete → public/build/')
  console.log(`📁 Output: ${OUT_DIR}`)
}

main().catch(err => {
  console.error('❌ Build failed:', err)
  process.exit(1)
})
