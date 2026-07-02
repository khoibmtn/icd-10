// src/components/RulePlayground.tsx
import { useState } from 'react'
import { Beaker, Play, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
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
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Beaker size={16} className="text-accent" />
        <span className="font-semibold text-fg">Rule Playground</span>
        <span className="text-[11px] text-fg-muted hidden sm:inline">— Kiểm tra quy tắc và giải thích mã ICD</span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-elevated p-1 rounded-xl w-fit">
        {(['code', 'concept'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              cursor-pointer border-none transition-all duration-150 font-[inherit]
              ${mode === m
                ? 'bg-accent-soft text-accent font-semibold shadow-[0_0_0_1px_rgba(59,109,232,0.25)]'
                : 'bg-transparent text-fg-muted hover:text-fg'
              }
            `}
          >
            {m === 'code' ? '📋 Tra mã' : '💬 Thuật ngữ'}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'code' ? 'Nhập mã ICD... (vd: Z34, A52.0, E11)' : 'Nhập thuật ngữ... (vd: khám thai, TNGT, CTSN)'}
          className="flex-1 bg-surface border border-line rounded-xl px-4 py-3 text-sm text-fg placeholder:text-fg-muted outline-none font-[inherit] transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !input.trim()}
          className={`
            rounded-xl px-5 py-3 border-none font-semibold text-sm flex items-center gap-1.5 transition-all cursor-pointer
            ${input.trim()
              ? 'bg-accent text-white hover:bg-accent/90'
              : 'bg-elevated text-fg-muted cursor-not-allowed'
            }
          `}
        >
          <Play size={14} />
          {loading ? 'Đang...' : 'Phân tích'}
        </button>
      </div>

      {/* Quick examples */}
      <div className="flex gap-1.5 flex-wrap items-center">
        <span className="text-[11px] text-fg-muted">Thử nhanh:</span>
        {QUICK_EXAMPLES.map(ex => (
          <button
            key={ex.label}
            onClick={() => { setInput(ex.label); setMode(ex.mode) }}
            className={`
              bg-elevated border border-line rounded-md px-2.5 py-1 text-xs text-fg-secondary
              cursor-pointer transition-all hover:border-accent hover:text-accent font-[inherit]
              ${ex.mode === 'code' ? 'font-mono' : ''}
            `}
          >{ex.label}</button>
        ))}
      </div>

      {/* Results */}
      {result && (
        <div className="fade-in flex flex-col gap-3">
          <hr className="border-line" />

          {/* Query */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-fg-muted">Query:</span>
            <span className="font-mono text-sm text-fg-secondary bg-dim px-2.5 py-0.5 rounded-md">{result.query}</span>
            <span className={`
              text-[10px] px-2 py-0.5 rounded font-semibold border
              ${result.mode === 'template'
                ? 'bg-ok/10 text-ok border-ok/20'
                : 'bg-warn/10 text-warn border-warn/20'
              }
            `}>
              {result.mode === 'template' ? '✓ Template' : '⚡ LLM'}
            </span>
          </div>

          {/* Selected codes */}
          {result.selectedCodes.length > 0 ? (
            <div>
              <div className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide mb-2">
                ✅ Mã được chọn
              </div>
              {result.selectedCodes.map((sel, i) => (
                <div key={i} className="bg-emerald-50/60 border border-emerald-200/50 rounded-xl p-3.5 mb-2">
                  {/* Code + confidence */}
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <button
                      onClick={() => onNavigate?.(sel.code)}
                      className="font-mono text-base font-bold text-accent bg-accent/10 border border-accent/20 rounded px-3 py-1 cursor-pointer"
                    >{sel.code}</button>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] text-fg-muted">Confidence</span>
                        <span className="text-sm font-bold text-emerald-600">{(sel.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-36 h-1.5 bg-black/8 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${sel.confidence * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Reasons */}
                  <div className="flex flex-col gap-1">
                    {sel.reasons.map((r, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs text-fg-secondary">
                        <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                        {r}
                      </div>
                    ))}
                  </div>

                  {/* Provenance */}
                  <div className="mt-2.5 pt-2.5 border-t border-emerald-200/30 flex gap-1.5 flex-wrap">
                    {sel.provenance.map((p, j) => (
                      <span key={j} className={`
                        text-[10px] px-1.5 py-px rounded font-semibold border
                        ${p.citationLevel === 'official' ? 'bg-accent/8 text-accent border-accent/20'
                          : p.citationLevel === 'compiled' ? 'bg-purple-600/8 text-purple-600 border-purple-600/20'
                          : 'bg-fg-muted/8 text-fg-muted border-line'}
                      `}>
                        {p.file} · {p.citationLevel === 'official' ? 'Chính thức' : p.citationLevel === 'compiled' ? 'Biên soạn' : 'Suy diễn'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-fg-muted text-sm">
              Không tìm thấy mã phù hợp. Thử từ khóa khác.
            </div>
          )}

          {/* Rules applied */}
          {result.rulesApplied.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide mb-2">
                📋 Quy tắc áp dụng
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {result.rulesApplied.map((r, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded font-semibold bg-warn/10 text-warn border border-warn/20">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coding relations */}
          {result.selectedCodes.map(sel => {
            const rels = codingRelations.filter(r => r.source === sel.code)
            if (!rels.length) return null
            return (
              <div key={sel.code}>
                <div className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide mb-2">
                  🔗 Quan hệ mã hóa cho {sel.code}
                </div>
                {rels.map((rel, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-surface border border-line rounded-lg mb-1.5">
                    <span className="font-mono text-xs font-bold text-accent bg-accent/10 border border-accent/20 rounded px-2 py-px">{rel.source}</span>
                    <ArrowRight size={12} className="text-accent" />
                    <button
                      onClick={() => onNavigate?.(rel.target)}
                      className="font-mono text-xs font-bold text-accent bg-accent/10 border border-accent/20 rounded px-2 py-px cursor-pointer"
                    >{rel.target}</button>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-info/10 text-info border border-info/20">
                      {rel.relationType}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Rejected codes */}
          {result.rejectedCodes.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-fg-muted uppercase tracking-wide mb-2">
                ✗ Mã bị loại ({result.rejectedCodes.length})
              </div>
              <div className="flex flex-col gap-1.5">
                {result.rejectedCodes.map((rej, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-red-50/40 border border-red-200/30 rounded-lg">
                    <XCircle size={12} className="text-red-400 shrink-0" />
                    <span className="font-mono text-xs font-bold text-accent/60 bg-accent/5 border border-accent/10 rounded px-2 py-px">{rej.code}</span>
                    <span className="text-[11px] text-fg-muted flex-1">{rej.reason}</span>
                    <span className="text-[11px] text-red-400 font-medium">{(rej.confidence * 100).toFixed(0)}%</span>
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
