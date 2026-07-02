// src/components/DetailView/TabProvenance.tsx
import { Database, FileText, Cpu, BookOpen } from 'lucide-react'
import type { ICDRecord, ICDRule, CodingRelation } from '../../types/icd'

interface TabProvenanceProps {
  record: ICDRecord
  rules: ICDRule[]
  codingRelations: CodingRelation[]
}

const SOURCE_META = {
  icd10_flat: { label: 'CSDL ICD-10 Bộ Y tế', Icon: Database, color: 'text-accent', bgColor: 'bg-accent/10' },
  appendix: { label: 'Phụ lục hướng dẫn', Icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-600/10' },
  guideline: { label: 'Quy định kỹ thuật', Icon: BookOpen, color: 'text-success', bgColor: 'bg-success/10' },
  concept_dictionary: { label: 'Từ điển khái niệm lâm sàng', Icon: Cpu, color: 'text-warning', bgColor: 'bg-warning/10' },
}

export function TabProvenance({ record: rec, rules, codingRelations }: TabProvenanceProps) {
  return (
    <div className="fade-in flex flex-col gap-4">

      {/* Legend */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex gap-4 flex-wrap">
        <LegendItem dotClass="bg-accent" label="Chính thức" desc="Trực tiếp từ CSDL" />
        <LegendItem dotClass="bg-purple-600" label="Biên soạn" desc="Xây dựng từ tài liệu" />
        <LegendItem dotClass="bg-text-muted" label="Suy diễn" desc="Từ từ điển khái niệm" />
        <div className="w-px bg-border" />
        <LegendItem dotClass="bg-success" label="Trích dẫn chính xác" desc="exact" />
        <LegendItem dotClass="bg-info" label="Suy luận" desc="derived" />
      </div>

      {/* Main record provenance */}
      <div>
        <SectionHeader>Dữ liệu gốc mã bệnh</SectionHeader>
        <ProvenanceItem
          title={`Mã ${rec.maBenh} — ${rec.tenTiengViet}`}
          source="icd10_flat"
          confidence="exact"
          citationLevel="official"
          file="icd10_flat.json"
          extractedText={`maBenh: "${rec.maBenh}", tenTiengViet: "${rec.tenTiengViet}"`}
        />
      </div>

      {/* Rules provenance */}
      {rules.length > 0 && (
        <div>
          <SectionHeader>Nguồn gốc quy tắc mã hóa ({rules.length})</SectionHeader>
          <div className="flex flex-col gap-2">
            {rules.map((rule, i) => (
              <ProvenanceItem
                key={i}
                title={rule.message}
                source={rule.provenance.source}
                confidence={rule.provenance.confidence}
                citationLevel={rule.provenance.citationLevel}
                file={rule.provenance.file}
                section={rule.provenance.section}
                extractedText={rule.provenance.extractedText}
              />
            ))}
          </div>
        </div>
      )}

      {/* Coding relations provenance */}
      {codingRelations.length > 0 && (
        <div>
          <SectionHeader>Nguồn gốc quan hệ mã hóa ({codingRelations.length})</SectionHeader>
          <div className="flex flex-col gap-2">
            {codingRelations.map((rel, i) => (
              <ProvenanceItem
                key={i}
                title={`${rel.relationType.toUpperCase()}: ${rel.source} → ${rel.target}`}
                source={rel.provenance.source}
                confidence={rel.provenance.confidence}
                citationLevel={rel.provenance.citationLevel}
                file={rel.provenance.file}
              />
            ))}
          </div>
        </div>
      )}

      {/* Data Contract footer */}
      <div className="px-4 py-3 bg-surface border border-border rounded-lg flex items-center gap-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span className="text-[11px] text-text-muted">
          Schema Version: <span className="font-mono text-text-secondary">1.0.0</span>
          &nbsp;·&nbsp; Source: <span className="font-mono text-accent">icd10_flat.json</span>
          &nbsp;·&nbsp; Provenance: <span className="text-success">100%</span>
        </span>
      </div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2.5">{children}</div>
  )
}

function LegendItem({ dotClass, label, desc }: { dotClass: string; label: string; desc: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${dotClass}`} />
      <span className="text-[11px] text-text-secondary font-medium">{label}</span>
      <span className="text-[10px] text-text-muted">({desc})</span>
    </div>
  )
}

function ProvenanceItem({
  title, source, confidence, citationLevel, file, section, extractedText,
}: {
  title: string
  source: string
  confidence: string
  citationLevel: string
  file: string
  section?: string
  extractedText?: string
}) {
  const sm = SOURCE_META[source as keyof typeof SOURCE_META] ?? SOURCE_META.icd10_flat
  const Icon = sm.Icon

  const levelBadge = citationLevel === 'official'
    ? 'bg-accent/10 text-accent border-accent/25'
    : citationLevel === 'compiled'
    ? 'bg-purple-600/10 text-purple-600 border-purple-600/25'
    : 'bg-text-muted/10 text-text-muted border-border'

  const levelLabel = citationLevel === 'official' ? 'Chính thức'
    : citationLevel === 'compiled' ? 'Biên soạn' : 'Suy diễn'

  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="flex items-start gap-2.5">
        <div className={`w-7 h-7 rounded-md shrink-0 ${sm.bgColor} flex items-center justify-center`}>
          <Icon size={14} className={sm.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-text font-medium mb-1 leading-snug">{title}</div>
          <div className={`flex gap-1.5 flex-wrap ${extractedText ? 'mb-2' : ''}`}>
            <span className={`text-[10px] px-1.5 py-px rounded font-semibold border ${levelBadge}`}>
              {levelLabel}
            </span>
            <span className="text-[10px] px-1.5 py-px rounded font-semibold bg-success/8 text-success border border-success/18">
              {confidence === 'exact' ? 'Trích dẫn chính xác' : 'Suy diễn'}
            </span>
            <span className="text-[10px] font-mono text-text-muted px-1.5 py-px bg-overlay rounded">
              {file}{section ? ` · §${section}` : ''}
            </span>
          </div>
          {extractedText && (
            <div className="text-[11px] font-mono text-text-muted bg-overlay p-2 rounded border-l-2 border-l-accent">
              {extractedText}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
