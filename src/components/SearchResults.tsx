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
  const cls = sym === '†' ? 'text-amber-600 bg-amber-50 border-amber-200'
    : sym === '*' ? 'text-violet-600 bg-violet-50 border-violet-200'
    : 'text-blue-600 bg-blue-50 border-blue-200'
  return (
    <span className={`inline-flex items-center gap-0.5 font-mono font-bold text-xs rounded px-2 py-0.5 border ${cls}`}>
      <Highlighted text={rec.maBenh} query={query} />
      {sym && <span className="text-[11px] opacity-85 ml-0.5">{sym}</span>}
    </span>
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
    <div className="flex gap-1.5 flex-wrap mt-1.5">
      {errors.length > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200">
          <XCircle size={10} />
          {errors[0].ruleType === 'maDauSaoKhongLaBenhChinh' ? 'Mã (*) — không bệnh chính'
            : errors[0].ruleType === 'khongDungLaBenhChinh' ? 'Quy tắc BYT'
            : errors[0].ruleType === 'chiSuDungMaHoaNguyenNhanTuVong' ? 'Chỉ tử vong'
            : 'Hạn chế'}
        </span>
      )}
      {warnings.map((w, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
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

export function SearchResults({ results, rules, selectedCode, onSelect, query, hasStrongMatch = true, onOpenPlayground }: SearchResultsProps) {
  if (!query) {
    return (
      <div className="text-center py-12 px-6 text-slate-400">
        <SearchIcon size={40} strokeWidth={1.5} className="mx-auto mb-3 opacity-60" />
        <div className="text-sm">Nhập mã ICD, tên bệnh hoặc thuật ngữ lâm sàng</div>
        <div className="mt-2 text-xs">
          Ví dụ: <code className="font-mono text-blue-600">Z34</code>, <code className="font-mono text-blue-600">khám thai</code>, <code className="font-mono text-blue-600">E11</code>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 px-6 text-slate-400">
        <SearchIcon size={36} strokeWidth={1.5} className="mx-auto mb-3 opacity-40" />
        <div>Không tìm thấy kết quả cho "<strong className="text-slate-600">{query}</strong>"</div>
        <div className="mt-2 text-xs">Thử với từ khóa khác hoặc mã ICD trực tiếp</div>
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-1.5">
      <div className="text-[11px] text-slate-400 pb-1">
        {results.length} kết quả cho <span className="text-blue-600 italic">"{query}"</span>
      </div>

      {!hasStrongMatch && results.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 mb-1">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-xs text-amber-600 font-semibold mb-0.5">Kết quả gần đúng</div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              Không khớp hoàn toàn. Hãy thử{' '}
              <button onClick={onOpenPlayground} className="bg-transparent border-none p-0 text-blue-600 cursor-pointer font-semibold text-[11px] underline" style={{ fontFamily: 'inherit' }}>Playground →</button>
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
            className={`border rounded-xl p-3 md:p-3.5 cursor-pointer transition-all duration-150
              ${isSelected
                ? 'border-blue-400 bg-blue-50/50 shadow-[0_0_0_1px_rgb(96,165,250),0_4px_16px_rgba(59,130,246,0.1)]'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-px hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CodeChip rec={rec} query={query} />
                  {rec.khoiMa && <span className="text-[10px] text-slate-400">{rec.chuongStt} · {rec.khoiMa}</span>}
                </div>
                <Highlighted text={rec.tenTiengViet} query={query} className="font-medium text-slate-800 text-[13px] leading-snug block" />
                {rec.tenTiengAnh && <Highlighted text={rec.tenTiengAnh} query={query} className="text-[11px] text-slate-400 mt-0.5 block" />}
                <RuleBadges rules={codeRules} />
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0 mt-0.5" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
