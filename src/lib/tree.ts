// src/lib/tree.ts
// Build the ICD-10 tree structure from flat records
import type { ICDRecord } from '../types/icd'

export interface TreeChapter {
  id: string           // roman numeral: "I"
  range: string        // "A00-B99"
  label: string        // Vietnamese name
  blocks: TreeBlock[]
}

export interface TreeBlock {
  id: string           // "A00-A09"
  label: string
  chapterId: string
  groups: TreeGroup[]
}

export interface TreeGroup {
  id: string           // "A00"
  label: string
  blockId: string
  codingSymbol?: string | null
  codes: TreeCode[]
}

export interface TreeCode {
  id: string           // "A00.0"
  label: string
  codingSymbol?: string | null
}

export function buildTree(records: ICDRecord[]): TreeChapter[] {

  const chapterMap = new Map<string, TreeChapter>()
  const blockMap = new Map<string, TreeBlock>()
  const groupMap = new Map<string, TreeGroup>()

  for (const rec of records) {
    // Chapter
    if (!chapterMap.has(rec.chuongStt)) {
      chapterMap.set(rec.chuongStt, {
        id: rec.chuongStt,
        range: rec.chuongPhamViMa,
        label: rec.chuongTenViet,
        blocks: [],
      })
    }

    // Block
    if (!blockMap.has(rec.khoiMa)) {
      const block: TreeBlock = {
        id: rec.khoiMa,
        label: rec.khoiTenViet,
        chapterId: rec.chuongStt,
        groups: [],
      }
      blockMap.set(rec.khoiMa, block)
      chapterMap.get(rec.chuongStt)!.blocks.push(block)
    }

    // Group (3-char code)
    const groupCode = rec.nhomMa || rec.maBenh
    if (!groupMap.has(groupCode)) {
      const group: TreeGroup = {
        id: groupCode,
        label: rec.nhomTenViet || rec.tenTiengViet,
        blockId: rec.khoiMa,
        codingSymbol: rec.maBenh === groupCode ? rec.codingSymbol : null,
        codes: [],
      }
      groupMap.set(groupCode, group)
      blockMap.get(rec.khoiMa)!.groups.push(group)
    }

    // Code (only add subcategory codes, not the group itself)
    if (rec.maBenh !== groupCode) {
      groupMap.get(groupCode)!.codes.push({
        id: rec.maBenh,
        label: rec.tenTiengViet,
        codingSymbol: rec.codingSymbol,
      })
    }
  }

  // Sort blocks within chapters, groups within blocks, codes within groups
  for (const ch of chapterMap.values()) {
    ch.blocks.sort((a, b) => a.id.localeCompare(b.id))
    for (const bl of ch.blocks) {
      bl.groups.sort((a, b) => a.id.localeCompare(b.id))
      for (const gr of bl.groups) {
        gr.codes.sort((a, b) => a.id.localeCompare(b.id))
      }
    }
  }

  // Sort chapters by their roman numeral order
  const romanOrder = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII']
  const result = Array.from(chapterMap.values()).sort((a, b) =>
    romanOrder.indexOf(a.id) - romanOrder.indexOf(b.id)
  )

  return result
}

/**
 * Given a code (e.g. "A15.0" or "A00-A09"), find the path to expand in the tree.
 * Returns { chapterId, blockId?, groupId?, codeId? }
 */
export function findTreePath(tree: TreeChapter[], target: string): {
  chapterId: string | null
  blockId: string | null
  groupId: string | null
  codeId: string | null
} {
  const result = { chapterId: null as string | null, blockId: null as string | null, groupId: null as string | null, codeId: null as string | null }

  for (const ch of tree) {
    // Match chapter
    if (ch.id === target || ch.range === target) {
      result.chapterId = ch.id
      return result
    }

    for (const bl of ch.blocks) {
      // Match block
      if (bl.id === target) {
        result.chapterId = ch.id
        result.blockId = bl.id
        return result
      }

      for (const gr of bl.groups) {
        // Match group
        if (gr.id === target) {
          result.chapterId = ch.id
          result.blockId = bl.id
          result.groupId = gr.id
          return result
        }

        // Match code
        for (const code of gr.codes) {
          if (code.id === target) {
            result.chapterId = ch.id
            result.blockId = bl.id
            result.groupId = gr.id
            result.codeId = code.id
            return result
          }
        }
      }
    }
  }

  return result
}
