// src/components/TreeView.tsx
import { useState, useEffect, useRef } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { TreeChapter, TreeBlock, TreeGroup, TreeCode } from '../lib/tree'

interface TreeViewProps {
  tree: TreeChapter[]
  selectedCode: string | null
  expandTarget: string | null
  onSelect: (code: string) => void
  onExpandHandled: () => void
}

/** Find ancestor IDs for a given code in the tree */
function findAncestors(tree: TreeChapter[], target: string | null): Set<string> {
  const set = new Set<string>()
  if (!target) return set
  for (const ch of tree) {
    for (const bl of ch.blocks) {
      for (const gr of bl.groups) {
        if (gr.id === target) {
          set.add(ch.id); set.add(bl.id); return set
        }
        for (const code of gr.codes) {
          if (code.id === target) {
            set.add(ch.id); set.add(bl.id); set.add(gr.id); return set
          }
        }
      }
    }
  }
  return set
}

export function TreeView({ tree, selectedCode, expandTarget, onSelect, onExpandHandled }: TreeViewProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)

  // Ancestor IDs of the selected code (for subtle parent highlighting)
  const ancestors = findAncestors(tree, selectedCode)

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleBlock = (id: string) => {
    setExpandedBlocks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // Auto-expand to target
  useEffect(() => {
    if (!expandTarget) return

    let found = false
    for (const ch of tree) {
      if (ch.id === expandTarget || ch.range === expandTarget) {
        setExpandedChapters(prev => new Set(prev).add(ch.id))
        found = true; break
      }
      for (const bl of ch.blocks) {
        if (bl.id === expandTarget) {
          setExpandedChapters(prev => new Set(prev).add(ch.id))
          found = true; break
        }
        for (const gr of bl.groups) {
          if (gr.id === expandTarget) {
            setExpandedChapters(prev => new Set(prev).add(ch.id))
            setExpandedBlocks(prev => new Set(prev).add(bl.id))
            found = true; break
          }
          for (const code of gr.codes) {
            if (code.id === expandTarget) {
              setExpandedChapters(prev => new Set(prev).add(ch.id))
              setExpandedBlocks(prev => new Set(prev).add(bl.id))
              setExpandedGroups(prev => new Set(prev).add(gr.id))
              found = true; break
            }
          }
          if (found) break
        }
        if (found) break
      }
      if (found) break
    }

    onExpandHandled()

    setTimeout(() => {
      const el = document.getElementById(`tree-${expandTarget}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [expandTarget, tree, onExpandHandled])

  return (
    <div ref={scrollRef} className="flex flex-col text-sm">
      {tree.map(ch => (
        <ChapterNode
          key={ch.id}
          chapter={ch}
          expanded={expandedChapters.has(ch.id)}
          expandedBlocks={expandedBlocks}
          expandedGroups={expandedGroups}
          selectedCode={selectedCode}
          isAncestor={ancestors.has(ch.id)}
          ancestors={ancestors}
          onToggleChapter={() => toggleChapter(ch.id)}
          onToggleBlock={toggleBlock}
          onToggleGroup={toggleGroup}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

// Shared selected style
const SELECTED_CLS = 'bg-amber-50 border-l-2 border-l-amber-400'
const ANCESTOR_CLS = 'bg-amber-50/50'

function ChapterNode({ chapter: ch, expanded, expandedBlocks, expandedGroups, selectedCode, isAncestor, ancestors, onToggleChapter, onToggleBlock, onToggleGroup, onSelect }: {
  chapter: TreeChapter
  expanded: boolean
  expandedBlocks: Set<string>
  expandedGroups: Set<string>
  selectedCode: string | null
  isAncestor: boolean
  ancestors: Set<string>
  onToggleChapter: () => void
  onToggleBlock: (id: string) => void
  onToggleGroup: (id: string) => void
  onSelect: (code: string) => void
}) {
  return (
    <div>
      <div
        id={`tree-${ch.id}`}
        onClick={onToggleChapter}
        className={`flex items-center gap-1.5 px-2 py-2 cursor-pointer transition-colors rounded-sm font-semibold text-foreground hover:bg-muted/80
          ${isAncestor ? ANCESTOR_CLS : ''}`}
      >
        {expanded ? <ChevronDown size={14} className="text-muted-foreground shrink-0" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
        <span className={`text-xs font-bold shrink-0 ${isAncestor ? 'text-amber-700' : 'text-muted-foreground'}`}>{ch.id}:</span>
        <span className="text-xs truncate">{ch.label}</span>
      </div>
      {expanded && (
        <div className="ml-3 border-l border-border/50">
          {ch.blocks.map(bl => (
            <BlockNode
              key={bl.id}
              block={bl}
              expanded={expandedBlocks.has(bl.id)}
              expandedGroups={expandedGroups}
              selectedCode={selectedCode}
              isAncestor={ancestors.has(bl.id)}
              ancestors={ancestors}
              onToggle={() => onToggleBlock(bl.id)}
              onToggleGroup={onToggleGroup}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BlockNode({ block: bl, expanded, expandedGroups, selectedCode, isAncestor, ancestors, onToggle, onToggleGroup, onSelect }: {
  block: TreeBlock
  expanded: boolean
  expandedGroups: Set<string>
  selectedCode: string | null
  isAncestor: boolean
  ancestors: Set<string>
  onToggle: () => void
  onToggleGroup: (id: string) => void
  onSelect: (code: string) => void
}) {
  return (
    <div>
      <div
        id={`tree-${bl.id}`}
        onClick={onToggle}
        className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors rounded-sm hover:bg-muted/80
          ${isAncestor ? ANCESTOR_CLS : ''}`}
      >
        {expanded ? <ChevronDown size={12} className="text-muted-foreground shrink-0" /> : <ChevronRight size={12} className="text-muted-foreground shrink-0" />}
        <span className={`font-mono text-[11px] font-bold shrink-0 ${isAncestor ? 'text-amber-700' : 'text-primary'}`}>{bl.id}</span>
        <span className="text-xs text-foreground truncate">{bl.label}</span>
      </div>
      {expanded && (
        <div className="ml-3 border-l border-border/40">
          {bl.groups.map(gr => (
            <GroupNode
              key={gr.id}
              group={gr}
              expanded={expandedGroups.has(gr.id)}
              selectedCode={selectedCode}
              isAncestor={ancestors.has(gr.id)}
              onToggle={() => onToggleGroup(gr.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function GroupNode({ group: gr, expanded, selectedCode, isAncestor, onToggle, onSelect }: {
  group: TreeGroup
  expanded: boolean
  selectedCode: string | null
  isAncestor: boolean
  onToggle: () => void
  onSelect: (code: string) => void
}) {
  const isSelected = selectedCode === gr.id
  const hasChildren = gr.codes.length > 0

  return (
    <div>
      <div
        id={`tree-${gr.id}`}
        className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer transition-colors rounded-sm hover:bg-muted/80
          ${isSelected ? SELECTED_CLS : isAncestor ? ANCESTOR_CLS : ''}`}
        onClick={() => { if (hasChildren) onToggle(); onSelect(gr.id) }}
      >
        {hasChildren
          ? (expanded ? <ChevronDown size={12} className="text-muted-foreground shrink-0" /> : <ChevronRight size={12} className="text-muted-foreground shrink-0" />)
          : <span className="w-3 shrink-0" />
        }
        <span className={`font-mono text-[11px] font-bold shrink-0 ${isSelected ? 'text-amber-800' : 'text-foreground'}`}>{gr.id}</span>
        <span className={`text-xs truncate ${isSelected ? 'text-amber-900 font-medium' : 'text-foreground'}`}>{gr.label}</span>
      </div>
      {expanded && hasChildren && (
        <div className="ml-3 border-l border-border/30">
          {gr.codes.map(code => (
            <CodeNode key={code.id} code={code} selectedCode={selectedCode} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

function CodeNode({ code, selectedCode, onSelect }: {
  code: TreeCode
  selectedCode: string | null
  onSelect: (code: string) => void
}) {
  const isSelected = selectedCode === code.id

  return (
    <div
      id={`tree-${code.id}`}
      onClick={() => onSelect(code.id)}
      className={`flex items-center gap-1.5 pl-5 pr-2 py-1 cursor-pointer transition-colors rounded-sm hover:bg-muted/80
        ${isSelected ? SELECTED_CLS : ''}`}
    >
      <span className={`font-mono text-[11px] font-bold shrink-0 ${isSelected ? 'text-amber-800' : 'text-muted-foreground'}`}>{code.id}</span>
      <span className={`text-xs truncate ${isSelected ? 'text-amber-900 font-medium' : 'text-foreground'}`}>{code.label}</span>
    </div>
  )
}
