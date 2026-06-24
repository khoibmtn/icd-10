// src/components/SearchResults.tsx
import React from 'react'
import { AlertTriangle, XCircle, ChevronRight, Beaker } from 'lucide-react'
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

/**
 * Normalize for accent-insensitive matching (same logic as search.ts).
 * Used ONLY for finding match positions — original text is displayed.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
}

interface Segment {
  text: string
  highlight: boolean
}

/**
 * Split `text` into segments of matched/unmatched parts.
 * Uses diacritic-insensitive matching so "kham thai" highlights "khám thai".
 */
function buildSegments(text: string, query: string): Segment[] {
  if (!query || query.trim().length < 1) return [{ text, highlight: false }]

  const normText = normalize(text)
  const terms = query
    .trim()
    .split(/\s+/)
    .filter(t => t.length >= 1)
    .map(t => normalize(t))
    .filter(t => t.length >= 1)

  if (terms.length === 0) return [{ text, highlight: false }]

  // Build a boolean array: highlight[i] = true if char i should be highlighted
  const highlight = new Array(text.length).fill(false)

  for (const term of terms) {
    let start = 0
    while (start < normText.length) {
      const idx = normText.indexOf(term, start)
      if (idx === -1) break
      for (let i = idx; i < idx + term.length && i < text.length; i++) {
        highlight[i] = true
      }
      start = idx + 1
    }
  }

  // Collapse into segments
  const segments: Segment[] = []
  let i = 0
  while (i < text.length) {
    const isHl = highlight[i]
    let j = i + 1
    while (j < text.length && highlight[j] === isHl) j++
    segments.push({ text: text.slice(i, j), highlight: isHl })
    i = j
  }

  return segments
}

/**
 * React component that renders text with highlighted segments.
 */
function Highlighted({
  text,
  query,
  style,
}: {
  text: string
  query: string
  style?: React.CSSProperties
}) {
  const segments = buildSegments(text, query)
  const hasHighlight = segments.some(s => s.highlight)

  if (!hasHighlight) {
    return <span style={style}>{text}</span>
  }

  return (
    <span style={style}>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={i}
            style={{
              background: 'rgba(91,138,245,0.28)',
              color: '#a8c4ff',
              borderRadius: 3,
              padding: '0 1px',
              fontWeight: 600,
              // No box — just inline color change
              boxShadow: 'none',
            }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  )
}

// ─── Code chip with dagger/asterisk symbol ───────────────────────────────────

function CodeChip({ rec, query }: { rec: ICDRecord; query: string }) {
  const sym = rec.codingSymbol
  // Base chip styles — same as .code-chip but inline for per-record customization
  const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 1,
    fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 12,
    borderRadius: 5, padding: '2px 8px',
    border: '1px solid',
    ...(sym === '†'
      ? { color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }
      : sym === '*'
      ? { color: '#a78bfa', background: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.3)' }
      : { color: 'var(--accent)', background: 'rgba(91,138,245,0.1)', borderColor: 'rgba(91,138,245,0.2)' }
    ),
  }
  return (
    <span style={chipStyle}>
      <Highlighted text={rec.maBenh} query={query} />
      {sym && (
        <span style={{
          fontSize: 11,
          opacity: 0.85,
          marginLeft: 1,
          color: sym === '†' ? '#f59e0b' : '#a78bfa',
        }}>{sym}</span>
      )}
    </span>
  )
}

// ─── Rule badges ──────────────────────────────────────────────────────────────

function RuleBadges({ rules }: { rules: ICDRule[] }) {
  if (!rules.length) return null
  // Deduplicate by ruleType before counting
  const unique = rules.reduce<ICDRule[]>((acc, r) => {
    if (!acc.some(x => x.ruleType === r.ruleType)) acc.push(r)
    return acc
  }, [])
  const errors = unique.filter(r => r.severity === 'error')
  const warnings = unique.filter(r => r.severity === 'warning')
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {errors.length > 0 && (
        <span className="badge badge-error">
          <XCircle size={10} />
          {errors[0].ruleType === 'maDauSaoKhongLaBenhChinh' ? 'Mã dấu sao (*) — không dùng làm bệnh chính'
            : errors[0].ruleType === 'khongDungLaBenhChinh' ? 'Quy tắc BYT'
            : errors[0].ruleType === 'chiSuDungMaHoaNguyenNhanTuVong' ? 'Chỉ tử vong'
            : 'Hạn chế'}
        </span>
      )}
      {warnings.map((w, i) => (
        <span key={i} className="badge badge-warning">
          <AlertTriangle size={10} />
          {w.ruleType === 'maDauGamCanKemMaDauSao' ? 'Cần kèm mã dấu sao (*)'
            : w.ruleType === 'khongSuDungViCoMaCuTheHon' ? 'Dùng mã cụ thể hơn'
            : w.ruleType === 'chiCoONuGioi' ? 'Chỉ nữ giới'
            : w.ruleType === 'chiCoONamGioi' ? 'Chỉ nam giới'
            : w.ruleType === 'khongKhuyenKhichDungLaBenhChinh' ? 'Hạn chế bệnh chính'
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
      <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <Search_Icon />
        <div style={{ marginTop: 12, fontSize: 14 }}>
          Nhập mã ICD, tên bệnh hoặc thuật ngữ lâm sàng
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          Ví dụ:{' '}
          <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>Z34</code>,{' '}
          <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>khám thai</code>,{' '}
          <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>TNGT</code>,{' '}
          <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>E11</code>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
        <div>
          Không tìm thấy kết quả cho "
          <strong style={{ color: 'var(--text-secondary)' }}>{query}</strong>"
        </div>
        <div style={{ marginTop: 8, fontSize: 12 }}>Thử với từ khóa khác hoặc mã ICD trực tiếp</div>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingBottom: 4 }}>
        {results.length} kết quả cho{' '}
        <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>"{query}"</span>
      </div>

      {/* Weak match banner — guide user to Playground */}
      {!hasStrongMatch && results.length > 0 && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 8,
          display: 'flex', alignItems: 'flex-start', gap: 10,
          marginBottom: 4,
        }}>
          <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 600, marginBottom: 3 }}>
              Kết quả gần đúng
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Không tìm thấy mã nào khớp hoàn toàn với{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>"{ query}"</strong>.
              {' '}Nếu đây là thuật ngữ lâm sàng, hãy thử{' '}
              <button
                onClick={onOpenPlayground}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: 'var(--accent)', cursor: 'pointer', fontWeight: 600,
                  fontSize: 11, textDecoration: 'underline', fontFamily: 'inherit',
                }}
              >
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
            className={`result-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(rec.maBenh)}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Code row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <CodeChip rec={rec} query={query} />
                  {rec.khoiMa && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {rec.chuongStt} · {rec.khoiMa}
                    </span>
                  )}
                </div>

                {/* Vietnamese name with highlight */}
                <Highlighted
                  text={rec.tenTiengViet}
                  query={query}
                  style={{
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    lineHeight: 1.4,
                    display: 'block',
                  }}
                />

                {/* English name with highlight */}
                {rec.tenTiengAnh && (
                  <Highlighted
                    text={rec.tenTiengAnh}
                    query={query}
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                      display: 'block',
                    }}
                  />
                )}

                <RuleBadges rules={codeRules} />
              </div>

              <ChevronRight
                size={14}
                style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Search_Icon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-muted)"
      strokeWidth="1.5"
      style={{ margin: '0 auto' }}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}
