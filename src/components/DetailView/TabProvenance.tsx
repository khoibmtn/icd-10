// src/components/DetailView/TabProvenance.tsx
import { Database, FileText, Cpu, BookOpen } from 'lucide-react'
import type { ICDRecord, ICDRule, CodingRelation } from '../../types/icd'

interface TabProvenanceProps { record: ICDRecord; rules: ICDRule[]; codingRelations: CodingRelation[] }

const SM = {
  icd10_flat: { label: 'CSDL ICD-10 BYT', Icon: Database, cls: 'text-blue-600', bg: 'bg-blue-50' },
  appendix: { label: 'Phụ lục', Icon: FileText, cls: 'text-violet-600', bg: 'bg-violet-50' },
  guideline: { label: 'Quy định KT', Icon: BookOpen, cls: 'text-emerald-600', bg: 'bg-emerald-50' },
  concept_dictionary: { label: 'Từ điển KN', Icon: Cpu, cls: 'text-amber-600', bg: 'bg-amber-50' },
}

export function TabProvenance({ record: rec, rules, codingRelations }: TabProvenanceProps) {
  return (
    <div className="fade-in flex flex-col gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex gap-4 flex-wrap shadow-sm">
        <Dot cls="bg-blue-600" label="Chính thức" desc="Trực tiếp từ CSDL" />
        <Dot cls="bg-violet-600" label="Biên soạn" desc="Từ tài liệu" />
        <Dot cls="bg-slate-400" label="Suy diễn" desc="Từ từ điển" />
        <div className="w-px bg-slate-200" />
        <Dot cls="bg-emerald-500" label="Chính xác" desc="exact" />
        <Dot cls="bg-blue-500" label="Suy luận" desc="derived" />
      </div>

      <div>
        <SH>Dữ liệu gốc mã bệnh</SH>
        <PI title={`Mã ${rec.maBenh} — ${rec.tenTiengViet}`} source="icd10_flat" confidence="exact" citationLevel="official" file="icd10_flat.json" extractedText={`maBenh: "${rec.maBenh}", tenTiengViet: "${rec.tenTiengViet}"`} />
      </div>

      {rules.length > 0 && (
        <div>
          <SH>Nguồn gốc quy tắc ({rules.length})</SH>
          <div className="flex flex-col gap-2">
            {rules.map((r, i) => <PI key={i} title={r.message} source={r.provenance.source} confidence={r.provenance.confidence} citationLevel={r.provenance.citationLevel} file={r.provenance.file} section={r.provenance.section} extractedText={r.provenance.extractedText} />)}
          </div>
        </div>
      )}

      {codingRelations.length > 0 && (
        <div>
          <SH>Nguồn gốc quan hệ ({codingRelations.length})</SH>
          <div className="flex flex-col gap-2">
            {codingRelations.map((r, i) => <PI key={i} title={`${r.relationType.toUpperCase()}: ${r.source} → ${r.target}`} source={r.provenance.source} confidence={r.provenance.confidence} citationLevel={r.provenance.citationLevel} file={r.provenance.file} />)}
          </div>
        </div>
      )}

      <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2.5 shadow-sm">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[11px] text-slate-400">
          Schema: <span className="font-mono text-slate-600">1.0.0</span> · Source: <span className="font-mono text-blue-600">icd10_flat.json</span> · Provenance: <span className="text-emerald-500">100%</span>
        </span>
      </div>
    </div>
  )
}

function SH({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2.5">{children}</div>
}

function Dot({ cls, label, desc }: { cls: string; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${cls}`} />
      <span className="text-[11px] text-slate-600 font-medium">{label}</span>
      <span className="text-[10px] text-slate-400">({desc})</span>
    </div>
  )
}

function PI({ title, source, confidence, citationLevel, file, section, extractedText }: {
  title: string; source: string; confidence: string; citationLevel: string; file: string; section?: string; extractedText?: string
}) {
  const sm = SM[source as keyof typeof SM] ?? SM.icd10_flat
  const Icon = sm.Icon
  const lvBadge = citationLevel === 'official' ? 'bg-blue-50 text-blue-600 border-blue-200'
    : citationLevel === 'compiled' ? 'bg-violet-50 text-violet-600 border-violet-200'
    : 'bg-slate-100 text-slate-500 border-slate-200'
  const lvLabel = citationLevel === 'official' ? 'Chính thức' : citationLevel === 'compiled' ? 'Biên soạn' : 'Suy diễn'

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <div className={`w-7 h-7 rounded-md shrink-0 ${sm.bg} flex items-center justify-center`}>
          <Icon size={14} className={sm.cls} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-700 font-medium mb-1 leading-snug">{title}</div>
          <div className={`flex gap-1.5 flex-wrap ${extractedText ? 'mb-2' : ''}`}>
            <span className={`text-[10px] px-1.5 py-px rounded font-semibold border ${lvBadge}`}>{lvLabel}</span>
            <span className="text-[10px] px-1.5 py-px rounded font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
              {confidence === 'exact' ? 'Chính xác' : 'Suy diễn'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-px bg-slate-100 rounded">{file}{section ? ` · §${section}` : ''}</span>
          </div>
          {extractedText && (
            <div className="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded border-l-2 border-l-blue-400">{extractedText}</div>
          )}
        </div>
      </div>
    </div>
  )
}
