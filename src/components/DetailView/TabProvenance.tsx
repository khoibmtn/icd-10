// src/components/DetailView/TabProvenance.tsx
import { Database, FileText, Cpu, BookOpen } from 'lucide-react'
import type { ICDRecord, ICDRule, CodingRelation } from '../../types/icd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TabProvenanceProps { record: ICDRecord; rules: ICDRule[]; codingRelations: CodingRelation[] }

const SM = {
  icd10_flat: { label: 'CSDL ICD-10 BYT', Icon: Database, cls: 'text-primary', bg: 'bg-primary/10' },
  appendix: { label: 'Phụ lục', Icon: FileText, cls: 'text-violet-600', bg: 'bg-violet-500/10' },
  guideline: { label: 'Quy định KT', Icon: BookOpen, cls: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  concept_dictionary: { label: 'Từ điển KN', Icon: Cpu, cls: 'text-amber-600', bg: 'bg-amber-500/10' },
}

export function TabProvenance({ record: rec, rules, codingRelations }: TabProvenanceProps) {
  return (
    <div className="fade-in flex flex-col gap-6">
      <Card className="p-4 flex gap-4 flex-wrap shadow-sm border-border bg-card">
        <Dot cls="bg-primary" label="Chính thức" desc="Trực tiếp từ CSDL" />
        <Dot cls="bg-violet-500" label="Biên soạn" desc="Từ tài liệu" />
        <Dot cls="bg-muted-foreground/40" label="Suy diễn" desc="Từ từ điển" />
        <div className="w-px bg-border mx-1" />
        <Dot cls="bg-emerald-500" label="Chính xác" desc="exact" />
        <Dot cls="bg-primary/70" label="Suy luận" desc="derived" />
      </Card>

      <div>
        <SH>Dữ liệu gốc mã bệnh</SH>
        <PI title={`Mã ${rec.maBenh} — ${rec.tenTiengViet}`} source="icd10_flat" confidence="exact" citationLevel="official" file="icd10_flat.json" extractedText={`maBenh: "${rec.maBenh}", tenTiengViet: "${rec.tenTiengViet}"`} />
      </div>

      {rules.length > 0 && (
        <div>
          <SH>Nguồn gốc quy tắc ({rules.length})</SH>
          <div className="flex flex-col gap-3">
            {rules.map((r, i) => <PI key={i} title={r.message} source={r.provenance.source} confidence={r.provenance.confidence} citationLevel={r.provenance.citationLevel} file={r.provenance.file} section={r.provenance.section} extractedText={r.provenance.extractedText} />)}
          </div>
        </div>
      )}

      {codingRelations.length > 0 && (
        <div>
          <SH>Nguồn gốc quan hệ ({codingRelations.length})</SH>
          <div className="flex flex-col gap-3">
            {codingRelations.map((r, i) => <PI key={i} title={`${r.relationType.toUpperCase()}: ${r.source} → ${r.target}`} source={r.provenance.source} confidence={r.provenance.confidence} citationLevel={r.provenance.citationLevel} file={r.provenance.file} />)}
          </div>
        </div>
      )}

      <Card className="px-4 py-3 flex items-center gap-3 shadow-sm border-border bg-card">
        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        <span className="text-xs text-muted-foreground font-medium">
          Schema: <span className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">1.0.0</span> <span className="mx-1 opacity-50">·</span> Source: <span className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">icd10_flat.json</span> <span className="mx-1 opacity-50">·</span> Provenance: <span className="text-emerald-600 font-bold">100%</span>
        </span>
      </Card>
    </div>
  )
}

function SH({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{children}</div>
}

function Dot({ cls, label, desc }: { cls: string; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${cls}`} />
      <span className="text-xs text-foreground font-medium">{label}</span>
      <span className="text-[10px] text-muted-foreground">({desc})</span>
    </div>
  )
}

function PI({ title, source, confidence, citationLevel, file, section, extractedText }: {
  title: string; source: string; confidence: string; citationLevel: string; file: string; section?: string; extractedText?: string
}) {
  const sm = SM[source as keyof typeof SM] ?? SM.icd10_flat
  const Icon = sm.Icon
  const lvBadge = citationLevel === 'official' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
    : citationLevel === 'compiled' ? 'bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20'
    : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
  const lvLabel = citationLevel === 'official' ? 'Chính thức' : citationLevel === 'compiled' ? 'Biên soạn' : 'Suy diễn'

  return (
    <Card className="p-4 shadow-sm border-border bg-card">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-md shrink-0 ${sm.bg} flex items-center justify-center mt-0.5`}>
          <Icon size={16} className={sm.cls} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-foreground font-medium mb-2 leading-snug">{title}</div>
          <div className={`flex gap-2 flex-wrap items-center ${extractedText ? 'mb-3' : ''}`}>
            <Badge variant="secondary" className={`px-2 py-0 h-5 text-[10px] shadow-none ${lvBadge}`}>{lvLabel}</Badge>
            <Badge variant="secondary" className={`px-2 py-0 h-5 text-[10px] shadow-none ${confidence === 'exact' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'}`}>
              {confidence === 'exact' ? 'Chính xác' : 'Suy diễn'}
            </Badge>
            <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 bg-muted rounded border border-border">
              {file}{section ? ` · §${section}` : ''}
            </span>
          </div>
          {extractedText && (
            <div className="text-xs font-mono text-muted-foreground bg-muted/50 p-3 rounded-md border-l-[3px] border-l-primary/60">{extractedText}</div>
          )}
        </div>
      </div>
    </Card>
  )
}
