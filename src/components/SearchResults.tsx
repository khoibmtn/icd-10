// src/components/SearchResults.tsx
import { AlertTriangle, XCircle, ChevronRight, Search as SearchIcon } from 'lucide-react'
import type { ICDRecord, ICDRule } from '../types/icd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SearchResultsProps {
  results: ICDRecord[]
  rules: Map<string, ICDRule[]>
  selectedCode: string | null
  onSelect: (code: string) => void
  query: string
  hasStrongMatch?: boolean
  onOpenPlayground?: () => void
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd')
}

interface Segment { text: string; highlight: boolean }

function buildSegments(text: string, query: string): Segment[] {
  if (!query || query.trim().length < 1) return [{ text, highlight: false }]
  const normText = normalize(text)
  const terms = query.trim().split(/\s+/).filter(t => t.length >= 1).map(t => normalize(t)).filter(t => t.length >= 1)
  if (terms.length === 0) return [{ text, highlight: false }]
  const hl = new Array(text.length).fill(false)
  for (const term of terms) {
    let start = 0
    while (start < normText.length) {
      const idx = normText.indexOf(term, start)
      if (idx === -1) break
      for (let i = idx; i < idx + term.length && i < text.length; i++) hl[i] = true
      start = idx + 1
    }
  }
  const segments: Segment[] = []
  let i = 0
  while (i < text.length) {
    const isHl = hl[i]
    let j = i + 1
    while (j < text.length && hl[j] === isHl) j++
    segments.push({ text: text.slice(i, j), highlight: isHl })
    i = j
  }
  return segments
}

function Highlighted({ text, query, className }: { text: string; query: string; className?: string }) {
  const segments = buildSegments(text, query)
  if (!segments.some(s => s.highlight)) return <span className={className}>{text}</span>
  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.highlight
          ? <mark key={i}>{seg.text}</mark>
          : <span key={i}>{seg.text}</span>
      )}
    </span>
  )
}

function CodeChip({ rec, query }: { rec: ICDRecord; query: string }) {
  const sym = rec.codingSymbol
  const variant = sym === '†' ? 'outline' : sym === '*' ? 'secondary' : 'default'
  const extraCls = sym === '†' ? 'border-amber-200 text-amber-700 bg-amber-50'
    : sym === '*' ? 'border-violet-200 text-violet-700 bg-violet-50'
    : 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'

  return (
    <Badge variant={variant as any} className={`px-2 py-0 font-mono font-bold text-xs rounded border ${extraCls}`}>
      <Highlighted text={rec.maBenh} query={query} />
      {sym && <span className="text-[10px] ml-0.5 opacity-80">{sym}</span>}
    </Badge>
  )
}

function RuleBadges({ rules }: { rules: ICDRule[] }) {
  if (!rules.length) return null
  const unique = rules.reduce<ICDRule[]>((acc, r) => {
    if (!acc.some(x => x.ruleType === r.ruleType)) acc.push(r)
    return acc
  }, [])
  const errors = unique.filter(r => r.severity === 'error')
  const warnings = unique.filter(r => r.severity === 'warning')
  return (
    <div className="flex gap-1.5 flex-wrap mt-2">
      {errors.length > 0 && (
        <Badge variant="destructive" className="px-1.5 py-0 h-4 text-[10px] font-semibold flex items-center gap-1 rounded bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 shadow-none">
          <XCircle size={10} />
          {errors[0].ruleType === 'maDauSaoKhongLaBenhChinh' ? 'Mã (*) — không bệnh chính'
            : errors[0].ruleType === 'khongDungLaBenhChinh' ? 'Quy tắc BYT'
            : errors[0].ruleType === 'chiSuDungMaHoaNguyenNhanTuVong' ? 'Chỉ tử vong'
            : 'Hạn chế'}
        </Badge>
      )}
      {warnings.map((w, i) => (
        <Badge key={i} variant="outline" className="px-1.5 py-0 h-4 text-[10px] font-semibold flex items-center gap-1 rounded bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-none">
          <AlertTriangle size={10} />
          {w.ruleType === 'maDauGamCanKemMaDauSao' ? 'Cần mã (*)'
            : w.ruleType === 'khongSuDungViCoMaCuTheHon' ? 'Mã cụ thể hơn'
            : w.ruleType === 'chiCoONuGioi' ? 'Chỉ nữ'
            : w.ruleType === 'chiCoONamGioi' ? 'Chỉ nam'
            : w.ruleType === 'khongKhuyenKhichDungLaBenhChinh' ? 'Hạn chế'
            : w.ruleType}
        </Badge>
      ))}
    </div>
  )
}

export function SearchResults({ results, rules, selectedCode, onSelect, query, hasStrongMatch = true, onOpenPlayground }: SearchResultsProps) {
  if (!query) {
    return (
      <div className="text-center py-12 px-6 text-muted-foreground flex flex-col items-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <SearchIcon size={24} className="opacity-50" />
        </div>
        <div className="text-sm font-medium text-foreground">Nhập mã ICD, tên bệnh hoặc thuật ngữ lâm sàng</div>
        <div className="mt-2 text-xs">
          Ví dụ: <code className="font-mono bg-muted px-1 py-0.5 rounded text-primary">Z34</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded text-primary">khám thai</code>, <code className="font-mono bg-muted px-1 py-0.5 rounded text-primary">E11</code>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 px-6 text-muted-foreground flex flex-col items-center">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <SearchIcon size={24} className="opacity-30" />
        </div>
        <div className="text-sm font-medium text-foreground">Không tìm thấy kết quả cho "<span className="text-primary">{query}</span>"</div>
        <div className="mt-2 text-xs">Thử với từ khóa khác hoặc tra cứu trên Playground</div>
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-2">
      <div className="text-xs text-muted-foreground font-medium pb-1 flex justify-between items-center px-1">
        <span>{results.length} kết quả cho <span className="text-primary">"{query}"</span></span>
      </div>

      {!hasStrongMatch && results.length > 0 && (
        <Card className="p-3 bg-amber-50/50 border-amber-200/60 shadow-sm flex items-start gap-2.5 mb-1">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-amber-700 font-semibold mb-0.5">Kết quả gần đúng</div>
            <div className="text-[11px] text-muted-foreground leading-relaxed flex items-center flex-wrap gap-1">
              <span>Không khớp hoàn toàn. Hãy thử</span>
              <Button variant="link" size="sm" onClick={onOpenPlayground} className="h-auto p-0 text-[11px] text-primary">Playground →</Button>
            </div>
          </div>
        </Card>
      )}

      {results.map(rec => {
        const codeRules = rules.get(rec.maBenh) ?? []
        const isSelected = rec.maBenh === selectedCode
        return (
          <Card
            key={rec.maBenh}
            onClick={() => onSelect(rec.maBenh)}
            className={`p-3 md:p-3.5 cursor-pointer transition-all duration-200 border
              ${isSelected
                ? 'border-primary ring-1 ring-primary/20 bg-primary/5 shadow-md'
                : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <CodeChip rec={rec} query={query} />
                  {rec.khoiMa && <span className="text-[10px] font-medium text-muted-foreground">{rec.chuongStt} · {rec.khoiMa}</span>}
                </div>
                <Highlighted text={rec.tenTiengViet} query={query} className="font-medium text-foreground text-sm leading-snug block" />
                <RuleBadges rules={codeRules} />
              </div>
              <ChevronRight size={16} className={`shrink-0 mt-1 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/40'}`} />
            </div>
          </Card>
        )
      })}
    </div>
  )
}
