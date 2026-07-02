// src/components/DetailView/TabRelations.tsx
import { ArrowRight, MinusCircle, PlusCircle } from 'lucide-react'
import type { CodingRelation, InformationalRelation } from '../../types/icd'

interface TabRelationsProps { code: string; codingRelations: CodingRelation[]; infoRelations: InformationalRelation[]; onNavigate?: (code: string) => void }

const CODING_REL_META = {
  dagger_asterisk: { label: '† / * Mã kiếm / Mã sao', description: 'Quan hệ nguyên nhân–biểu hiện.', badgeCls: 'bg-red-50 text-red-600 border-red-200', badgeLabel: 'CODE FIRST', arrow: 'text-red-400' },
  code_first: { label: 'Code First', description: 'Phải mã hóa nguyên nhân trước.', badgeCls: 'bg-amber-50 text-amber-600 border-amber-200', badgeLabel: 'CODE FIRST', arrow: 'text-amber-400' },
  use_additional: { label: 'Use Additional Code', description: 'Sử dụng thêm mã bổ sung.', badgeCls: 'bg-blue-50 text-blue-600 border-blue-200', badgeLabel: 'ADDITIONAL', arrow: 'text-blue-400' },
}

const INFO_REL_META = {
  excludes: { label: 'Excludes (Loại trừ)', Icon: MinusCircle, cls: 'text-red-400' },
  includes: { label: 'Includes (Bao gồm)', Icon: PlusCircle, cls: 'text-emerald-500' },
}

export function TabRelations({ code, codingRelations, infoRelations, onNavigate }: TabRelationsProps) {
  if (!codingRelations.length && !infoRelations.length) {
    return (
      <div className="text-center py-12 px-6 text-slate-400">
        <div className="text-3xl mb-3">🔗</div>
        <div>Không có quan hệ mã hóa cho <span className="font-mono text-blue-600">{code}</span></div>
        <div className="text-xs mt-1.5">Dữ liệu sẽ bổ sung trong Phase 1.</div>
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-5">
      {codingRelations.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2.5">Quan hệ mã hóa</div>
          <div className="flex flex-col gap-2">
            {codingRelations.map((rel, i) => {
              const meta = CODING_REL_META[rel.relationType]
              return (
                <div key={i} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.badgeCls}`}>{meta.badgeLabel}</span>
                    <span className="text-xs text-slate-500">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <CodeBlock code={rel.source} isSource onClick={onNavigate ? () => onNavigate(rel.source) : undefined} />
                    <ArrowRight size={14} className={`${meta.arrow} shrink-0`} />
                    <CodeBlock code={rel.target} onClick={onNavigate ? () => onNavigate(rel.target) : undefined} />
                  </div>
                  <div className="text-[11px] text-slate-400 leading-relaxed">{meta.description}</div>
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400">Nguồn:</span>
                    <span className="text-[10px] px-1.5 py-px rounded font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                      {rel.provenance.citationLevel === 'official' ? 'Chính thức' : 'Biên soạn'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{rel.provenance.file}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {infoRelations.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2.5">Quan hệ thông tin</div>
          <div className="flex flex-col gap-2">
            {infoRelations.map((rel, i) => {
              const meta = INFO_REL_META[rel.relationType]
              return (
                <div key={i} onClick={() => onNavigate?.(rel.target)}
                  className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50/50 shadow-sm">
                  <meta.Icon size={16} className={`${meta.cls} shrink-0`} />
                  <div className="flex-1">
                    <div className="text-[11px] text-slate-400 mb-0.5">{meta.label}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-px">{rel.target}</span>
                      {rel.description && <span className="text-xs text-slate-500">{rel.description}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function CodeBlock({ code, isSource, onClick }: { code: string; isSource?: boolean; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center gap-0.5 ${onClick ? 'cursor-pointer' : ''}`}>
      <span className={`font-mono text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-1 ${isSource ? 'opacity-60' : ''}`}>{code}</span>
      {isSource && <span className="text-[9px] text-slate-400">nguồn</span>}
    </div>
  )
}
