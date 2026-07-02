// src/components/DetailView/TabRelations.tsx
import { ArrowRight, MinusCircle, PlusCircle } from 'lucide-react'
import type { CodingRelation, InformationalRelation } from '../../types/icd'

interface TabRelationsProps {
  code: string
  codingRelations: CodingRelation[]
  infoRelations: InformationalRelation[]
  onNavigate?: (code: string) => void
}

const CODING_REL_META = {
  dagger_asterisk: {
    label: '† / * Mã kiếm / Mã sao',
    description: 'Quan hệ nguyên nhân–biểu hiện. Mã kiếm (†) là nguyên nhân, mã sao (*) là biểu hiện lâm sàng.',
    badge: 'badge-error',
    badgeLabel: 'CODE FIRST',
    color: '#f87171',
  },
  code_first: {
    label: 'Code First',
    description: 'Phải mã hóa nguyên nhân trước. Mã này chỉ được dùng kèm mã nguyên nhân.',
    badge: 'badge-warning',
    badgeLabel: 'CODE FIRST',
    color: '#fbbf24',
  },
  use_additional: {
    label: 'Use Additional Code',
    description: 'Sử dụng thêm mã bổ sung để mô tả đầy đủ hơn tình trạng bệnh.',
    badge: 'badge-info',
    badgeLabel: 'ADDITIONAL',
    color: '#60a5fa',
  },
}

const INFO_REL_META = {
  excludes: {
    label: 'Excludes (Loại trừ)',
    description: 'Các tình trạng bị loại trừ — không mã hóa cùng lúc.',
    Icon: MinusCircle, color: '#f87171',
  },
  includes: {
    label: 'Includes (Bao gồm)',
    description: 'Các tình trạng được bao gồm trong mã này.',
    Icon: PlusCircle, color: '#16a367',
  },
}

export function TabRelations({ code, codingRelations, infoRelations, onNavigate }: TabRelationsProps) {
  const hasCoding = codingRelations.length > 0
  const hasInfo = infoRelations.length > 0

  if (!hasCoding && !hasInfo) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔗</div>
        <div>Không có quan hệ mã hóa nào được ghi nhận cho mã <span className="mono" style={{ color: 'var(--accent)' }}>{code}</span></div>
        <div style={{ fontSize: 12, marginTop: 6 }}>Dữ liệu quan hệ sẽ được bổ sung trong Phase 1.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="fade-in">

      {/* Coding Relations (trigger logic) */}
      {hasCoding && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
          }}>
            Quan hệ mã hóa (ảnh hưởng quyết định)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {codingRelations.map((rel, i) => {
              const meta = CODING_REL_META[rel.relationType]
              return (
                <div key={i} style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span className={`badge ${meta.badge}`}>{meta.badgeLabel}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{meta.label}</span>
                  </div>
                  {/* Code flow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <CodeBlock code={rel.source} isSource onClick={onNavigate ? () => onNavigate(rel.source) : undefined} />
                    <ArrowRight size={14} style={{ color: meta.color, flexShrink: 0 }} />
                    <CodeBlock code={rel.target} onClick={onNavigate ? () => onNavigate(rel.target) : undefined} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {meta.description}
                  </div>
                  {/* Provenance */}
                  <div style={{
                    marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)',
                    display: 'flex', gap: 6, alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Nguồn:</span>
                    <span className="badge badge-official">{rel.provenance.citationLevel === 'official' ? 'Chính thức' : 'Biên soạn'}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{rel.provenance.file}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Informational Relations (display only) */}
      {hasInfo && (
        <div>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10,
          }}>
            Quan hệ thông tin (chỉ hiển thị)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {infoRelations.map((rel, i) => {
              const meta = INFO_REL_META[rel.relationType]
              return (
                <div key={i} className="rel-item" onClick={() => onNavigate?.(rel.target)}>
                  <meta.Icon size={16} style={{ color: meta.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{meta.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="code-chip" style={{ fontSize: 12, padding: '2px 8px' }}>{rel.target}</span>
                      {rel.description && (
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{rel.description}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function CodeBlock({ code, isSource, onClick }: { code: string; isSource?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2, cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span
        className="code-chip"
        style={{
          fontSize: 14, padding: '4px 12px',
          opacity: isSource ? 0.6 : 1,
        }}
      >{code}</span>
      {isSource && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>nguồn</span>}
    </div>
  )
}
