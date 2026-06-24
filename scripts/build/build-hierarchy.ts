// scripts/build/build-hierarchy.ts
import type { ICDRecord, ICDHierarchy } from '../../src/types/icd.js'

export function buildHierarchy(records: ICDRecord[]): ICDHierarchy[] {
  const map = new Map<string, ICDHierarchy>()

  for (const rec of records) {
    const code = rec.maBenh
    const nhom = rec.nhomMa  // 3-char group e.g. Z34

    // Register 3-char group parent node
    if (nhom && !map.has(nhom)) {
      map.set(nhom, {
        code: nhom,
        parentCode: rec.khoiMa || null,
        childCodes: [],
        siblingCodes: [],
        level: 'category',
        chapterRoman: rec.chuongStt,
        blockRange: rec.khoiMa,
      })
    }

    // Register this code
    if (!map.has(code)) {
      const isCategory = code.length === 3 && code === nhom
      map.set(code, {
        code,
        parentCode: isCategory ? (rec.khoiMa || null) : (nhom || rec.khoiMa || null),
        childCodes: [],
        siblingCodes: [],
        level: isCategory ? 'category' : 'subcategory',
        chapterRoman: rec.chuongStt,
        blockRange: rec.khoiMa,
      })
    }

    // Register as child of nhom
    if (nhom && nhom !== code) {
      const parent = map.get(nhom)!
      if (!parent.childCodes.includes(code)) {
        parent.childCodes.push(code)
      }
    }
  }

  // Populate siblings
  for (const node of map.values()) {
    if (node.parentCode) {
      const parent = map.get(node.parentCode)
      if (parent) {
        node.siblingCodes = parent.childCodes.filter(c => c !== node.code)
      }
    }
  }

  return Array.from(map.values())
}
