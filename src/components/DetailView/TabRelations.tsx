// src/components/DetailView/TabRelations.tsx
import { ArrowRight, MinusCircle, PlusCircle } from 'lucide-react'
import type { CodingRelation, InformationalRelation } from '../../types/icd'

interface TabRelationsProps {
  code: string
  codingRelations: CodingRelation[]
  infoRelations: InformationalRelation[]
  onNavigate?: (code: string) => void
}

const CODING_REL_META = {
  dagger_asterisk: {
    label: '† / * Mã kiếm / Mã sao',
    description: 'Quan hệ nguyên nhân–biểu hiện. Mã kiếm (†) là nguyên nhân, mã sao (*) là biểu hiện lâm sàng.',
    badgeClass: 'bg-error/10 text-error border-error/20',
    badgeLabel: 'CODE FIRST',
    arrowColor: 'text-red-400',
  },
  code_first: {
    label: 'Code First',
    description: 'Phải mã hóa nguyên nhân trước. Mã này chỉ được dùng kèm mã nguyên nhân.',
    badgeClass: 'bg-warning/10 text-warning border-warning/20',
    badgeLabel: 'CODE FIRST',
    arrowColor: 'text-amber-400',
  },
  use_additional: {
    label: 'Use Additional Code',
    description: 'Sử dụng thêm mã bổ sung để mô tả đầy đủ hơn tình trạng bệnh.',
    badgeClass: 'bg-info/10 text-info border-info/20',
    badgeLabel: 'ADDITIONAL',
    arrowColor: 'text-blue-400',
  },
}

const INFO_REL_META = {
  excludes: {
    label: 'Excludes (Loại trừ)',
    description: 'Các tình trạng bị loại trừ — không mã hóa cùng lúc.',
    Icon: MinusCircle, color: 'text-red-400',
  },
  includes: {
    label: 'Includes (Bao gồm)',
    description: 'Các tình trạng được bao gồm trong mã này.',
    Icon: PlusCircle, color: 'text-emerald-500',
  },
}

export function TabRelations({ code, codingRelations, infoRelations, onNavigate }: TabRelationsProps) {
  const hasCoding = codingRelations.length > 0
  const hasInfo = infoRelations.length > 0

  if (!hasCoding && !hasInfo) {
    return (
      <div className="text-center py-12 px-6 text-text-muted">
        <div className="text-3xl mb-3">🔗</div>
        <div>Không có quan hệ mã hóa nào cho mã <span className="font-mono text-accent">{code}</span></div>
        <div className="text-xs mt-1.5">Dữ liệu quan hệ sẽ được bổ sung trong Phase 1.</div>
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-5">

      {/* Coding Relations */}
      {hasCoding && (
        <div>
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2.5">
            Quan hệ mã hóa (ảnh hưởng quyết định)
          </div>
          <div className="flex flex-col gap-2">
            {codingRelations.map((rel, i) => {
              const meta = CODING_REL_META[rel.relationType]
              return (
                <div key={i} className="bg-surface border border-border rounded-xl p-3.5">
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.badgeClass}`}>
                      {meta.badgeLabel}
                    </span>
                    <span className="text-xs text-text-secondary">{meta.label}</span>
                  </div>
                  {/* Code flow */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <CodeBlock code={rel.source} isSource onClick={onNavigate ? () => onNavigate(rel.source) : undefined} />
                    <ArrowRight size={14} className={`${meta.arrowColor} shrink-0`} />
                    <CodeBlock code={rel.target} onClick={onNavigate ? () => onNavigate(rel.target) : undefined} />
                  </div>
                  <div className="text-[11px] text-text-muted leading-relaxed">{meta.description}</div>
                  {/* Provenance */}
                  <div className="mt-2.5 pt-2.5 border-t border-border flex gap-1.5 items-center">
                    <span className="text-[10px] text-text-muted">Nguồn:</span>
                    <span className="text-[10px] px-1.5 py-px rounded font-semibold bg-accent/8 text-accent border border-accent/20">
                      {rel.provenance.citationLevel === 'official' ? 'Chính thức' : 'Biên soạn'}
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">{rel.provenance.file}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Informational Relations */}
      {hasInfo && (
        <div>
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2.5">
            Quan hệ thông tin (chỉ hiển thị)
          </div>
          <div className="flex flex-col gap-2">
            {infoRelations.map((rel, i) => {
              const meta = INFO_REL_META[rel.relationType]
              return (
                <div
                  key={i}
                  onClick={() => onNavigate?.(rel.target)}
                  className="flex items-start gap-3 p-3 bg-surface border border-border rounded-lg cursor-pointer transition-all hover:border-accent hover:bg-accent/3"
                >
                  <meta.Icon size={16} className={`${meta.color} shrink-0`} />
                  <div className="flex-1">
                    <div className="text-[11px] text-text-muted mb-0.5">{meta.label}</div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-accent bg-accent/10 border border-accent/20 rounded px-2 py-px">
                        {rel.target}
                      </span>
                      {rel.description && (
                        <span className="text-xs text-text-secondary">{rel.description}</span>
                      )}
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
    <div
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className={`
        font-mono text-sm font-bold text-accent bg-accent/10 border border-accent/20 rounded px-3 py-1
        ${isSource ? 'opacity-60' : ''}
      `}>
        {code}
      </span>
      {isSource && <span className="text-[9px] text-text-muted">nguồn</span>}
    </div>
  )
}
