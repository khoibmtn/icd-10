// src/components/SearchResults.tsx
import { AlertTriangle, XCircle, Info, ChevronRight } from 'lucide-react'
import type { ICDRecord, ICDRule } from '../types/icd'

interface SearchResultsProps {
  results: ICDRecord[]
  rules: Map<string, ICDRule[]>
  selectedCode: string | null
  onSelect: (code: string) => void
  query: string
}

function RuleBadges({ rules }: { rules: ICDRule[] }) {
  if (!rules.length) return null
  const errors = rules.filter(r => r.severity === 'error')
  const warnings = rules.filter(r => r.severity === 'warning')
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {errors.length > 0 && (
        <span className="badge badge-error">
          <XCircle size={10} /> {errors.length > 1 ? `${errors.length} lỗi` : errors[0].ruleType === 'khongDungLaBenhChinh' ? 'Cấm bệnh chính' : 'Chỉ tử vong'}
        </span>
      )}
      {warnings.map((w, i) => (
        <span key={i} className="badge badge-warning">
          <AlertTriangle size={10} />
          {w.ruleType === 'khongSuDungViCoMaCuTheHon' ? 'Dùng mã cụ thể hơn'
            : w.ruleType === 'chiCoONuGioi' ? 'Chỉ nữ giới'
            : w.ruleType === 'chiCoONamGioi' ? 'Chỉ nam giới'
            : w.ruleType === 'khongKhuyenKhichDungLaBenhChinh' ? 'Hạn chế bệnh chính'
            : w.ruleType}
        </span>
      ))}
    </div>
  )
}

function highlightMatch(text: string, query: string): string {
  if (!query || query.length < 2) return text
  return text // simple return — browser can handle highlight natively
}

export function SearchResults({ results, rules, selectedCode, onSelect, query }: SearchResultsProps) {
  if (!query) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <Search_Icon />
        <div style={{ marginTop: 12, fontSize: 14 }}>
          Nhập mã ICD, tên bệnh hoặc thuật ngữ lâm sàng
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          Ví dụ: <code style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent)' }}>Z34</code>,{' '}
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
        <div>Không tìm thấy kết quả cho "<strong style={{ color: 'var(--text-secondary)' }}>{query}</strong>"</div>
        <div style={{ marginTop: 8, fontSize: 12 }}>Thử với từ khóa khác hoặc mã ICD trực tiếp</div>
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingBottom: 4 }}>
        {results.length} kết quả
      </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="code-chip">{rec.maBenh}</span>
                  {rec.khoiMa && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {rec.chuongStt} · {rec.khoiMa}
                    </span>
                  )}
                </div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.4 }}>
                  {rec.tenTiengViet}
                </div>
                {rec.tenTiengAnh && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {rec.tenTiengAnh}
                  </div>
                )}
                <RuleBadges rules={codeRules} />
              </div>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Search_Icon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto' }}>
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  )
}
