// src/components/DetailView/TabRelations.tsx
import { ArrowRight, MinusCircle, PlusCircle } from 'lucide-react'
import type { CodingRelation, InformationalRelation } from '../../types/icd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TabRelationsProps { code: string; codingRelations: CodingRelation[]; infoRelations: InformationalRelation[]; onNavigate?: (code: string) => void }

const CODING_REL_META = {
  dagger_asterisk: { label: '† / * Mã kiếm / Mã sao', description: 'Quan hệ nguyên nhân–biểu hiện.', badgeCls: 'bg-destructive/10 text-destructive border-destructive/20', badgeLabel: 'CODE FIRST', arrow: 'text-destructive' },
  code_first: { label: 'Code First', description: 'Phải mã hóa nguyên nhân trước.', badgeCls: 'bg-amber-500/10 text-amber-700 border-amber-500/20', badgeLabel: 'CODE FIRST', arrow: 'text-amber-500' },
  use_additional: { label: 'Use Additional Code', description: 'Sử dụng thêm mã bổ sung.', badgeCls: 'bg-primary/10 text-primary border-primary/20', badgeLabel: 'ADDITIONAL', arrow: 'text-primary' },
}

const INFO_REL_META = {
  excludes: { label: 'Excludes (Loại trừ)', Icon: MinusCircle, cls: 'text-destructive' },
  includes: { label: 'Includes (Bao gồm)', Icon: PlusCircle, cls: 'text-emerald-500' },
}

export function TabRelations({ code, codingRelations, infoRelations, onNavigate }: TabRelationsProps) {
  if (!codingRelations.length && !infoRelations.length) {
    return (
      <div className="text-center py-12 px-6 text-muted-foreground flex flex-col items-center">
        <div className="text-3xl mb-3 opacity-90">🔗</div>
        <div className="font-medium text-foreground">Không có quan hệ mã hóa cho <span className="font-mono text-primary bg-primary/10 px-1 rounded">{code}</span></div>
        <div className="text-xs mt-1.5 text-muted-foreground">Dữ liệu sẽ bổ sung trong Phase 1.</div>
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      {codingRelations.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quan hệ mã hóa</div>
          <div className="flex flex-col gap-3">
            {codingRelations.map((rel, i) => {
              const meta = CODING_REL_META[rel.relationType]
              return (
                <Card key={i} className="p-4 shadow-sm border-border bg-card">
                  <div className="flex items-center gap-2.5 mb-3">
                    <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] font-semibold rounded shadow-none ${meta.badgeCls}`}>{meta.badgeLabel}</Badge>
                    <span className="text-xs text-muted-foreground font-medium">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <CodeBlock code={rel.source} isSource onClick={onNavigate ? () => onNavigate(rel.source) : undefined} />
                    <ArrowRight size={16} className={`${meta.arrow} shrink-0 opacity-80`} />
                    <CodeBlock code={rel.target} onClick={onNavigate ? () => onNavigate(rel.target) : undefined} />
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed font-medium">{meta.description}</div>
                  <div className="mt-3 pt-3 border-t border-border/50 flex gap-2 items-center flex-wrap">
                    <span className="text-[10px] text-muted-foreground font-medium">Nguồn:</span>
                    <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[9px] bg-primary/10 text-primary border-primary/20 shadow-none hover:bg-primary/20">
                      {rel.provenance.citationLevel === 'official' ? 'Chính thức' : 'Biên soạn'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded">{rel.provenance.file}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {infoRelations.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quan hệ thông tin</div>
          <div className="flex flex-col gap-2">
            {infoRelations.map((rel, i) => {
              const meta = INFO_REL_META[rel.relationType]
              return (
                <Card key={i} onClick={() => onNavigate?.(rel.target)}
                  className="flex items-start gap-3 p-3.5 bg-card border-border cursor-pointer transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md shadow-sm">
                  <meta.Icon size={18} className={`${meta.cls} shrink-0 mt-0.5`} />
                  <div className="flex-1">
                    <div className="text-[11px] text-muted-foreground font-medium mb-1.5">{meta.label}</div>
                    <div className="flex items-center gap-2.5">
                      <Badge variant="secondary" className="font-mono text-xs font-bold text-primary bg-primary/10 border-primary/20 px-2 py-0.5 shadow-none">{rel.target}</Badge>
                      {rel.description && <span className="text-sm font-medium text-foreground">{rel.description}</span>}
                    </div>
                  </div>
                </Card>
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
    <div onClick={onClick} className={`flex flex-col items-center gap-1 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}>
      <Badge variant="secondary" className={`font-mono text-sm font-bold bg-primary/10 text-primary border-primary/20 px-3 py-1 shadow-none ${isSource ? 'opacity-60 bg-muted text-muted-foreground border-border' : ''}`}>{code}</Badge>
      {isSource && <span className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider">nguồn</span>}
    </div>
  )
}
