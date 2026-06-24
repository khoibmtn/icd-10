// src/components/RulePlayground.tsx
import { useState } from 'react'
import { Beaker, Play, ChevronRight, CheckCircle, XCircle, ArrowRight, Info } from 'lucide-react'
import { explainCode, explainConcept } from '../lib/explain'
import type { ICDRule, ClinicalConcept, ExplainDecision } from '../types/icd'

interface RulePlaygroundProps {
  rules: ICDRule[]
  concepts: ClinicalConcept[]
  codingRelations: Array<{ source: string; target: string; relationType: string }>
  onNavigate?: (code: string) => void
}

export function RulePlayground({ rules, concepts, codingRelations, onNavigate }: RulePlaygroundProps) {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'code' | 'concept'>('code')
  const [result, setResult] = useState<ExplainDecision | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      let decision: ExplainDecision
      if (mode === 'code') {
        decision = await explainCode(input.trim().toUpperCase(), rules, concepts)
      } else {
        decision = await explainConcept(input.trim(), rules, concepts)
      }
      setResult(decision)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  const QUICK_EXAMPLES = [
    { label: 'Z34', mode: 'code' as const },
    { label: 'A52.0', mode: 'code' as const },
    { label: 'E11', mode: 'code' as const },
    { label: 'khám thai', mode: 'concept' as const },
    { label: 'TNGT', mode: 'concept' as const },
    { label: 'CTSN', mode: 'concept' as const },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Beaker size={16} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rule Playground</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— Kiểm tra quy tắc và giải thích mã ICD</span>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {(['code', 'concept'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`tab-btn ${mode === m ? 'active' : ''}`}
          >
            {m === 'code' ? '📋 Tra mã' : '💬 Thuật ngữ'}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'code' ? 'Nhập mã ICD... (vd: Z34, A52.0, E11)' : 'Nhập thuật ngữ... (vd: khám thai, TNGT, CTSN)'}
          style={{
            flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 16px', fontSize: 14,
            color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !input.trim()}
          style={{
            background: input.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
            border: 'none', borderRadius: 10, padding: '12px 20px',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            color: input.trim() ? '#fff' : 'var(--text-muted)',
            fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s',
          }}
        >
          <Play size={14} />
          {loading ? 'Đang xử lý...' : 'Phân tích'}
        </button>
      </div>

      {/* Quick examples */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Thử nhanh:</span>
        {QUICK_EXAMPLES.map(ex => (
          <button
            key={ex.label}
            onClick={() => { setInput(ex.label); setMode(ex.mode) }}
            style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
              fontFamily: ex.mode === 'code' ? 'JetBrains Mono' : 'inherit',
              fontSize: 12, color: 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent)'; (e.target as HTMLElement).style.color = 'var(--accent)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >{ex.label}</button>
        ))}
      </div>

      {/* Results */}
      {result && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="divider" />

          {/* Query */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Query:</span>
            <span style={{
              fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--text-secondary)',
              background: 'var(--bg-overlay)', padding: '2px 10px', borderRadius: 6,
            }}>{result.query}</span>
            <span className={`badge ${result.mode === 'template' ? 'badge-success' : 'badge-warning'}`}>
              {result.mode === 'template' ? '✓ Template (No LLM)' : '⚡ LLM'}
            </span>
          </div>

          {/* Selected codes */}
          {result.selectedCodes.length > 0 ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                ✅ Mã được chọn
              </div>
              {result.selectedCodes.map((sel, i) => (
                <div key={i} style={{
                  background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)',
                  borderRadius: 10, padding: 14, marginBottom: 8,
                }}>
                  {/* Code + confidence */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <button
                      onClick={() => onNavigate?.(sel.code)}
                      className="code-chip"
                      style={{ cursor: 'pointer', fontSize: 16, border: 'none' }}
                    >{sel.code}</button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confidence</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#34d399' }}>
                          {(sel.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="conf-bar" style={{ width: 140 }}>
                        <div className="conf-fill" style={{ width: `${sel.confidence * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Reasons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {sel.reasons.map((r, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <CheckCircle size={12} style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }} />
                        {r}
                      </div>
                    ))}
                  </div>

                  {/* Provenance */}
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(52,211,153,0.15)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {sel.provenance.map((p, j) => (
                      <span key={j} className={`badge badge-${p.citationLevel === 'official' ? 'official' : p.citationLevel === 'compiled' ? 'compiled' : 'inferred'}`}>
                        {p.file} · {p.citationLevel === 'official' ? 'Chính thức' : p.citationLevel === 'compiled' ? 'Biên soạn' : 'Suy diễn'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
              Không tìm thấy mã phù hợp. Thử từ khóa khác.
            </div>
          )}

          {/* Rules applied */}
          {result.rulesApplied.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                📋 Quy tắc áp dụng
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {result.rulesApplied.map((r, i) => (
                  <span key={i} className="badge badge-warning">{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* Coding relations for selected codes */}
          {result.selectedCodes.map(sel => {
            const rels = codingRelations.filter(r => r.source === sel.code)
            if (!rels.length) return null
            return (
              <div key={sel.code}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  🔗 Quan hệ mã hóa cho {sel.code}
                </div>
                {rels.map((rel, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 12px', background: 'var(--bg-surface)',
                    border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6,
                  }}>
                    <span className="code-chip" style={{ fontSize: 12 }}>{rel.source}</span>
                    <ArrowRight size={12} style={{ color: 'var(--accent)' }} />
                    <button
                      onClick={() => onNavigate?.(rel.target)}
                      className="code-chip"
                      style={{ fontSize: 12, cursor: 'pointer', border: 'none' }}
                    >{rel.target}</button>
                    <span className="badge badge-info">{rel.relationType}</span>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Rejected codes */}
          {result.rejectedCodes.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                ✗ Mã bị loại ({result.rejectedCodes.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {result.rejectedCodes.map((rej, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', background: 'rgba(248,113,113,0.04)',
                    border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8,
                  }}>
                    <XCircle size={12} style={{ color: '#f87171', flexShrink: 0 }} />
                    <span className="code-chip" style={{ fontSize: 12, opacity: 0.6 }}>{rej.code}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>{rej.reason}</span>
                    <span style={{ fontSize: 11, color: '#f87171' }}>{(rej.confidence * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
