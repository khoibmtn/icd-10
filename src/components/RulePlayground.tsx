// src/components/RulePlayground.tsx
import { useState } from 'react'
import { Beaker, Play, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { explainCode, explainConcept } from '../lib/explain'
import type { ICDRule, ClinicalConcept, ExplainDecision } from '../types/icd'

interface RulePlaygroundProps { rules: ICDRule[]; concepts: ClinicalConcept[]; codingRelations: Array<{ source: string; target: string; relationType: string }>; onNavigate?: (code: string) => void }

export function RulePlayground({ rules, concepts, codingRelations, onNavigate }: RulePlaygroundProps) {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'code' | 'concept'>('code')
  const [result, setResult] = useState<ExplainDecision | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      const decision = mode === 'code'
        ? await explainCode(input.trim().toUpperCase(), rules, concepts)
        : await explainConcept(input.trim(), rules, concepts)
      setResult(decision)
    } finally { setLoading(false) }
  }

  const QUICK = [
    { label: 'Z34', mode: 'code' as const },
    { label: 'A52.0', mode: 'code' as const },
    { label: 'E11', mode: 'code' as const },
    { label: 'khám thai', mode: 'concept' as const },
    { label: 'TNGT', mode: 'concept' as const },
    { label: 'CTSN', mode: 'concept' as const },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Beaker size={16} className="text-blue-600" />
        <span className="font-semibold text-slate-800">Rule Playground</span>
        <span className="text-[11px] text-slate-400 hidden sm:inline">— Kiểm tra quy tắc và giải thích mã ICD</span>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['code', 'concept'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none transition-all duration-150
              ${mode === m ? 'bg-blue-50 text-blue-600 font-semibold shadow-[0_0_0_1px_rgba(59,130,246,0.3)]' : 'bg-transparent text-slate-400 hover:text-slate-700'}`}
            style={{ fontFamily: 'inherit' }}>
            {m === 'code' ? '📋 Tra mã' : '💬 Thuật ngữ'}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          placeholder={mode === 'code' ? 'Nhập mã ICD... (vd: Z34, A52.0)' : 'Nhập thuật ngữ... (vd: khám thai, TNGT)'}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
          style={{ fontFamily: 'inherit' }} />
        <button onClick={handleAnalyze} disabled={loading || !input.trim()}
          className={`rounded-xl px-5 py-3 border-none font-semibold text-sm flex items-center gap-1.5 transition-all cursor-pointer
            ${input.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
          <Play size={14} />
          {loading ? 'Đang...' : 'Phân tích'}
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap items-center">
        <span className="text-[11px] text-slate-400">Thử nhanh:</span>
        {QUICK.map(ex => (
          <button key={ex.label} onClick={() => { setInput(ex.label); setMode(ex.mode) }}
            className={`bg-slate-100 border border-slate-200 rounded-md px-2.5 py-1 text-xs text-slate-500 cursor-pointer transition-all hover:border-blue-300 hover:text-blue-600 ${ex.mode === 'code' ? 'font-mono' : ''}`}
            style={{ fontFamily: ex.mode === 'code' ? "'JetBrains Mono', monospace" : 'inherit' }}>
            {ex.label}
          </button>
        ))}
      </div>

      {result && (
        <div className="fade-in flex flex-col gap-3">
          <hr className="border-slate-200" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400">Query:</span>
            <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">{result.query}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${result.mode === 'template' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
              {result.mode === 'template' ? '✓ Template' : '⚡ LLM'}
            </span>
          </div>

          {result.selectedCodes.length > 0 ? (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">✅ Mã được chọn</div>
              {result.selectedCodes.map((sel, i) => (
                <div key={i} className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 mb-2 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <button onClick={() => onNavigate?.(sel.code)} className="font-mono text-base font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-1 cursor-pointer">{sel.code}</button>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] text-slate-400">Confidence</span>
                        <span className="text-sm font-bold text-emerald-600">{(sel.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-36 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${sel.confidence * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {sel.reasons.map((r, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" />{r}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2.5 pt-2.5 border-t border-emerald-200/50 flex gap-1.5 flex-wrap">
                    {sel.provenance.map((p, j) => (
                      <span key={j} className={`text-[10px] px-1.5 py-px rounded font-semibold border
                        ${p.citationLevel === 'official' ? 'bg-blue-50 text-blue-600 border-blue-200' : p.citationLevel === 'compiled' ? 'bg-violet-50 text-violet-600 border-violet-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {p.file} · {p.citationLevel === 'official' ? 'Chính thức' : p.citationLevel === 'compiled' ? 'Biên soạn' : 'Suy diễn'}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-slate-400 text-sm">Không tìm thấy mã phù hợp.</div>
          )}

          {result.rulesApplied.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">📋 Quy tắc áp dụng</div>
              <div className="flex gap-1.5 flex-wrap">
                {result.rulesApplied.map((r, i) => <span key={i} className="text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-50 text-amber-600 border border-amber-200">{r}</span>)}
              </div>
            </div>
          )}

          {result.selectedCodes.map(sel => {
            const rels = codingRelations.filter(r => r.source === sel.code)
            if (!rels.length) return null
            return (
              <div key={sel.code}>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">🔗 Quan hệ {sel.code}</div>
                {rels.map((rel, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg mb-1.5 shadow-sm">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-px">{rel.source}</span>
                    <ArrowRight size={12} className="text-blue-500" />
                    <button onClick={() => onNavigate?.(rel.target)} className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-px cursor-pointer">{rel.target}</button>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-600 border border-blue-200">{rel.relationType}</span>
                  </div>
                ))}
              </div>
            )
          })}

          {result.rejectedCodes.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">✗ Mã bị loại ({result.rejectedCodes.length})</div>
              <div className="flex flex-col gap-1.5">
                {result.rejectedCodes.map((rej, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-red-50/50 border border-red-200/60 rounded-lg">
                    <XCircle size={12} className="text-red-400 shrink-0" />
                    <span className="font-mono text-xs font-bold text-blue-600/60 bg-blue-50 border border-blue-200/50 rounded px-2 py-px">{rej.code}</span>
                    <span className="text-[11px] text-slate-400 flex-1">{rej.reason}</span>
                    <span className="text-[11px] text-red-500 font-medium">{(rej.confidence * 100).toFixed(0)}%</span>
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
