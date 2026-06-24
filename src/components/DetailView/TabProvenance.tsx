// src/components/DetailView/TabProvenance.tsx
import { Database, FileText, Cpu, BookOpen } from 'lucide-react'
import type { ICDRecord, ICDRule, CodingRelation } from '../../types/icd'

interface TabProvenanceProps {
  record: ICDRecord
  rules: ICDRule[]
  codingRelations: CodingRelation[]
}

const SOURCE_META = {
  icd10_flat: { label: 'CSDL ICD-10 Bộ Y tế', Icon: Database, color: '#5b8af5' },
  appendix: { label: 'Phụ lục hướng dẫn', Icon: FileText, color: '#a78bfa' },
  guideline: { label: 'Quy định kỹ thuật', Icon: BookOpen, color: '#34d399' },
  concept_dictionary: { label: 'Từ điển khái niệm lâm sàng', Icon: Cpu, color: '#fbbf24' },
}

export function TabProvenance({ record: rec, rules, codingRelations }: TabProvenanceProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-in">

      {/* Legend */}
      <div className="glass" style={{ padding: 14, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <LegendItem color="#5b8af5" label="Chính thức" desc="Trực tiếp từ CSDL" />
        <LegendItem color="#a78bfa" label="Biên soạn" desc="Xây dựng từ tài liệu" />
        <LegendItem color="#8b92a8" label="Suy diễn" desc="Từ từ điển khái niệm" />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <LegendItem color="#34d399" label="Trích dẫn chính xác" desc="exact" />
        <LegendItem color="#60a5fa" label="Suy luận" desc="derived" />
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
      <div style={{
        padding: '12px 16px', background: 'var(--bg-surface)',
        border: '1px solid var(--border)', borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Schema Version: <span className="mono" style={{ color: 'var(--text-secondary)' }}>1.0.0</span>
          &nbsp;·&nbsp; Source: <span className="mono" style={{ color: 'var(--accent)' }}>icd10_flat.json</span>
          &nbsp;·&nbsp; Provenance traceability: <span style={{ color: 'var(--success)' }}>100%</span>
        </span>
      </div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
    }}>{children}</div>
  )
}

function LegendItem({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({desc})</span>
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

  const levelColor = citationLevel === 'official' ? '#5b8af5'
    : citationLevel === 'compiled' ? '#a78bfa' : '#8b92a8'
  const levelLabel = citationLevel === 'official' ? 'Chính thức'
    : citationLevel === 'compiled' ? 'Biên soạn' : 'Suy diễn'

  return (
    <div className="prov-item">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
          background: `${sm.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} style={{ color: sm.color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4, lineHeight: 1.4 }}>
            {title}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: extractedText ? 8 : 0 }}>
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 4,
              background: `${levelColor}15`, color: levelColor,
              border: `1px solid ${levelColor}30`, fontWeight: 600,
            }}>{levelLabel}</span>
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 4,
              background: 'rgba(52,211,153,0.1)', color: '#34d399',
              border: '1px solid rgba(52,211,153,0.2)', fontWeight: 600,
            }}>{confidence === 'exact' ? 'Trích dẫn chính xác' : 'Suy diễn'}</span>
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)',
              padding: '1px 6px', background: 'var(--bg-overlay)', borderRadius: 4,
            }}>{file}{section ? ` · §${section}` : ''}</span>
          </div>
          {extractedText && (
            <div style={{
              fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-muted)',
              background: 'var(--bg-overlay)', padding: '6px 10px', borderRadius: 6,
              borderLeft: `2px solid ${sm.color}`,
            }}>{extractedText}</div>
          )}
        </div>
      </div>
    </div>
  )
}
