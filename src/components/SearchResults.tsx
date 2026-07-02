// src/components/SearchResults.tsx
import { AlertTriangle, XCircle, ChevronRight, Search as SearchIcon } from 'lucide-react'
import type { ICDRecord, ICDRule } from '../types/icd'

interface SearchResultsProps {
  results: ICDRecord[]
  rules: Map<string, ICDRule[]>
  selectedCode: string | null
  onSelect: (code: string) => void
  query: string
  hasStrongMatch?: boolean
  onOpenPlayground?: () => void
}

// ─── Vietnamese-aware keyword highlighting ────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
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
  const hasHighlight = segments.some(s => s.highlight)
  if (!hasHighlight) return <span className={className}>{text}</span>
  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark key={i} className="bg-accent/14 text-[#2554b8] rounded-sm px-px font-semibold">{seg.text}</mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  )
}

// ─── Code chip ───────────────────────────────────────────────────────────────

function CodeChip({ rec, query }: { rec: ICDRecord; query: string }) {
  const sym = rec.codingSymbol
  const colorClass = sym === '†'
    ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    : sym === '*'
    ? 'text-purple-400 bg-purple-400/10 border-purple-400/30'
    : 'text-accent bg-accent/10 border-accent/20'

  return (
    <span className={`inline-flex items-center gap-0.5 font-mono font-bold text-xs rounded px-2 py-0.5 border ${colorClass}`}>
      <Highlighted text={rec.maBenh} query={query} />
      {sym && <span className="text-[11px] opacity-85 ml-0.5">{sym}</span>}
    </span>
  )
}

// ─── Rule badges ──────────────────────────────────────────────────────────────

function RuleBadges({ rules }: { rules: ICDRule[] }) {
  if (!rules.length) return null
  const unique = rules.reduce<ICDRule[]>((acc, r) => {
    if (!acc.some(x => x.ruleType === r.ruleType)) acc.push(r)
    return acc
  }, [])
  const errors = unique.filter(r => r.severity === 'error')
  const warnings = unique.filter(r => r.severity === 'warning')
  return (
    <div className="flex gap-1.5 flex-wrap mt-1.5">
      {errors.length > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-danger/8 text-danger border border-danger/18">
          <XCircle size={10} />
          {errors[0].ruleType === 'maDauSaoKhongLaBenhChinh' ? 'Mã (*) — không bệnh chính'
            : errors[0].ruleType === 'khongDungLaBenhChinh' ? 'Quy tắc BYT'
            : errors[0].ruleType === 'chiSuDungMaHoaNguyenNhanTuVong' ? 'Chỉ tử vong'
            : 'Hạn chế'}
        </span>
      )}
      {warnings.map((w, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-warn/8 text-warn border border-warn/18">
          <AlertTriangle size={10} />
          {w.ruleType === 'maDauGamCanKemMaDauSao' ? 'Cần mã (*)'
            : w.ruleType === 'khongSuDungViCoMaCuTheHon' ? 'Mã cụ thể hơn'
            : w.ruleType === 'chiCoONuGioi' ? 'Chỉ nữ'
            : w.ruleType === 'chiCoONamGioi' ? 'Chỉ nam'
            : w.ruleType === 'khongKhuyenKhichDungLaBenhChinh' ? 'Hạn chế'
            : w.ruleType}
        </span>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SearchResults({
  results, rules, selectedCode, onSelect, query,
  hasStrongMatch = true, onOpenPlayground,
}: SearchResultsProps) {
  if (!query) {
    return (
      <div className="text-center py-12 px-6 text-fg-muted">
        <SearchIcon size={40} strokeWidth={1.5} className="mx-auto mb-3 text-fg-muted/60" />
        <div className="text-sm">Nhập mã ICD, tên bệnh hoặc thuật ngữ lâm sàng</div>
        <div className="mt-2 text-xs text-fg-muted">
          Ví dụ:{' '}
          <code className="font-mono text-accent">Z34</code>,{' '}
          <code className="font-mono text-accent">khám thai</code>,{' '}
          <code className="font-mono text-accent">E11</code>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 px-6 text-fg-muted">
        <SearchIcon size={36} strokeWidth={1.5} className="mx-auto mb-3 text-fg-muted/40" />
        <div>
          Không tìm thấy kết quả cho "
          <strong className="text-fg-secondary">{query}</strong>"
        </div>
        <div className="mt-2 text-xs">Thử với từ khóa khác hoặc mã ICD trực tiếp</div>
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-1.5">
      <div className="text-[11px] text-fg-muted pb-1">
        {results.length} kết quả cho{' '}
        <span className="text-accent italic">"{query}"</span>
      </div>

      {/* Weak match banner */}
      {!hasStrongMatch && results.length > 0 && (
        <div className="p-3 bg-warn/6 border border-warn/20 rounded-lg flex items-start gap-2.5 mb-1">
          <AlertTriangle size={14} className="text-warn shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-warn font-semibold mb-0.5">Kết quả gần đúng</div>
            <div className="text-[11px] text-fg-muted leading-relaxed">
              Không khớp hoàn toàn. Hãy thử{' '}
              <button onClick={onOpenPlayground} className="bg-transparent border-none p-0 text-accent cursor-pointer font-semibold text-[11px] underline font-[inherit]">
                Playground →
              </button>
            </div>
          </div>
        </div>
      )}

      {results.map(rec => {
        const codeRules = rules.get(rec.maBenh) ?? []
        const isSelected = rec.maBenh === selectedCode

        return (
          <div
            key={rec.maBenh}
            onClick={() => onSelect(rec.maBenh)}
            className={`
              border rounded-xl p-3 md:p-3.5 cursor-pointer transition-all duration-150
              ${isSelected
                ? 'border-accent bg-accent/3 shadow-[0_0_0_1px_var(--color-accent),0_4px_16px_rgba(59,109,232,0.1)]'
                : 'border-line bg-surface hover:border-line-hover hover:bg-elevated hover:-translate-y-px hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Code row */}
                <div className="flex items-center gap-2 mb-1">
                  <CodeChip rec={rec} query={query} />
                  {rec.khoiMa && (
                    <span className="text-[10px] text-fg-muted">{rec.chuongStt} · {rec.khoiMa}</span>
                  )}
                </div>

                {/* Vietnamese name */}
                <Highlighted
                  text={rec.tenTiengViet}
                  query={query}
                  className="font-medium text-fg text-[13px] leading-snug block"
                />

                {/* English name */}
                {rec.tenTiengAnh && (
                  <Highlighted
                    text={rec.tenTiengAnh}
                    query={query}
                    className="text-[11px] text-fg-muted mt-0.5 block"
                  />
                )}

                <RuleBadges rules={codeRules} />
              </div>

              <ChevronRight size={14} className="text-fg-muted shrink-0 mt-0.5" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
