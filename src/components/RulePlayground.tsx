// src/components/RulePlayground.tsx
import { useState } from 'react'
import { Beaker, Play, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { explainCode, explainConcept } from '../lib/explain'
import type { ICDRule, ClinicalConcept, ExplainDecision } from '../types/icd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input as BaseInput } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

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
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        <div className="bg-primary/10 p-1.5 rounded-md">
          <Beaker size={18} className="text-primary" />
        </div>
        <span className="font-bold text-foreground">Rule Playground</span>
        <span className="text-xs text-muted-foreground hidden sm:inline font-medium">— Kiểm tra quy tắc và giải thích mã ICD</span>
      </div>

      <div className="flex gap-1.5 bg-muted/50 p-1.5 rounded-lg w-fit border border-border">
        {(['code', 'concept'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-all duration-200
              ${mode === m ? 'bg-background text-foreground shadow-sm' : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
          >
            {m === 'code' ? '📋 Tra mã' : '💬 Thuật ngữ'}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <BaseInput
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
          placeholder={mode === 'code' ? 'Nhập mã ICD... (vd: Z34, A52.0)' : 'Nhập thuật ngữ... (vd: khám thai, TNGT)'}
          className="h-11 bg-card text-sm focus-visible:ring-primary/20"
        />
        <Button onClick={handleAnalyze} disabled={loading || !input.trim()} className="h-11 px-6 font-semibold shadow-sm transition-all">
          {loading ? <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" /> : <Play size={16} className="mr-2" />}
          {loading ? 'Đang...' : 'Phân tích'}
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-muted-foreground font-medium mr-1">Thử nhanh:</span>
        {QUICK.map(ex => (
          <Badge
            key={ex.label}
            variant="outline"
            onClick={() => { setInput(ex.label); setMode(ex.mode) }}
            className={`cursor-pointer transition-all hover:bg-primary/5 hover:text-primary hover:border-primary/30 py-1 ${ex.mode === 'code' ? 'font-mono font-bold' : ''}`}
          >
            {ex.label}
          </Badge>
        ))}
      </div>

      {result && (
        <div className="fade-in flex flex-col gap-4 mt-2">
          <hr className="border-border" />
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium">Query:</span>
            <Badge variant="secondary" className="font-mono text-sm text-foreground bg-muted px-2.5 py-0.5 rounded shadow-none">{result.query}</Badge>
            <Badge variant="outline" className={`px-2 py-0 h-5 text-[10px] font-bold shadow-none ${result.mode === 'template' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-700 border-amber-500/20'}`}>
              {result.mode === 'template' ? '✓ Template' : '⚡ LLM'}
            </Badge>
          </div>

          {result.selectedCodes.length > 0 ? (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">✅ Mã được chọn</div>
              <div className="flex flex-col gap-3">
                {result.selectedCodes.map((sel, i) => (
                  <Card key={i} className="bg-emerald-500/5 border-emerald-500/20 border-l-[3px] border-l-emerald-500/50 p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Button variant="outline" size="sm" onClick={() => onNavigate?.(sel.code)} className="font-mono text-base font-bold text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 h-8 px-3">
                        {sel.code}
                      </Button>
                      <div className="flex-1 max-w-[200px]">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[11px] text-muted-foreground font-medium">Độ tin cậy</span>
                          <span className="text-xs font-bold text-emerald-600">{(sel.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={sel.confidence * 100} className="h-1.5 [&>div]:bg-emerald-500" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {sel.reasons.map((r, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm text-foreground font-medium">
                          <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />{r}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-emerald-500/10 flex gap-2 flex-wrap">
                      {sel.provenance.map((p, j) => (
                        <Badge key={j} variant="outline" className={`px-2 py-0 h-5 text-[10px] font-semibold shadow-none
                          ${p.citationLevel === 'official' ? 'bg-primary/10 text-primary border-primary/20' : p.citationLevel === 'compiled' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                          {p.file} <span className="mx-1 opacity-50">·</span> {p.citationLevel === 'official' ? 'Chính thức' : p.citationLevel === 'compiled' ? 'Biên soạn' : 'Suy diễn'}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="py-8 text-center text-muted-foreground text-sm font-medium border-dashed bg-muted/30 shadow-none">Không tìm thấy mã phù hợp.</Card>
          )}

          {result.rulesApplied.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">📋 Quy tắc áp dụng</div>
              <div className="flex gap-2 flex-wrap">
                {result.rulesApplied.map((r, i) => <Badge key={i} variant="outline" className="text-[11px] px-2.5 py-0.5 bg-amber-500/10 text-amber-700 border-amber-500/20 shadow-none">{r}</Badge>)}
              </div>
            </div>
          )}

          {result.selectedCodes.map(sel => {
            const rels = codingRelations.filter(r => r.source === sel.code)
            if (!rels.length) return null
            return (
              <div key={sel.code} className="mt-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">🔗 Quan hệ {sel.code}</div>
                <div className="flex flex-col gap-2">
                  {rels.map((rel, i) => (
                    <Card key={i} className="flex items-center gap-3 p-3 bg-card border-border shadow-sm">
                      <Badge variant="secondary" className="font-mono text-xs font-bold text-primary bg-primary/10 border-primary/20 px-2 py-0.5 shadow-none">{rel.source}</Badge>
                      <ArrowRight size={14} className="text-muted-foreground/60" />
                      <Badge variant="outline" onClick={() => onNavigate?.(rel.target)} className="font-mono text-xs font-bold text-primary bg-primary/5 border-primary/20 px-2 py-0.5 cursor-pointer hover:bg-primary/10 shadow-none">{rel.target}</Badge>
                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground font-semibold shadow-none">{rel.relationType}</Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}

          {result.rejectedCodes.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">✗ Mã bị loại ({result.rejectedCodes.length})</div>
              <div className="flex flex-col gap-2">
                {result.rejectedCodes.map((rej, i) => (
                  <Card key={i} className="flex items-center gap-3 p-3 bg-destructive/5 border-destructive/20 shadow-none">
                    <XCircle size={14} className="text-destructive shrink-0" />
                    <Badge variant="secondary" className="font-mono text-xs font-bold text-destructive/70 bg-destructive/10 border-destructive/20 px-2 py-0.5 shadow-none">{rej.code}</Badge>
                    <span className="text-xs text-muted-foreground font-medium flex-1">{rej.reason}</span>
                    <span className="text-xs text-destructive font-bold">{(rej.confidence * 100).toFixed(0)}%</span>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
