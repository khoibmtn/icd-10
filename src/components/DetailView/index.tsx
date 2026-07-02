// src/components/DetailView/index.tsx
import { useState } from 'react'
import { X, BookOpen, ShieldAlert, Link2, Archive } from 'lucide-react'
import type { ICDRecord, ICDRule, CodingRelation, InformationalRelation, ICDHierarchy } from '../../types/icd'
import { TabBasic } from './TabBasic'
import { TabRules } from './TabRules'
import { TabRelations } from './TabRelations'
import { TabProvenance } from './TabProvenance'

interface DetailViewProps {
  record: ICDRecord
  rules: ICDRule[]
  codingRelations: CodingRelation[]
  infoRelations: InformationalRelation[]
  hierarchy?: ICDHierarchy
  childRecords?: ICDRecord[]
  siblingRecords?: ICDRecord[]
  onClose?: () => void
  onNavigate?: (code: string) => void
}

const TABS = [
  { id: 'basic',      label: 'Cơ bản',        Icon: BookOpen },
  { id: 'rules',      label: 'Quy tắc & ĐK', Icon: ShieldAlert },
  { id: 'relations',  label: 'Quan hệ',       Icon: Link2 },
  { id: 'provenance', label: 'Nguồn gốc',    Icon: Archive },
] as const

type TabId = typeof TABS[number]['id']

export function DetailView({
  record, rules, codingRelations, infoRelations, hierarchy, childRecords = [], siblingRecords = [], onClose, onNavigate,
}: DetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic')

  // Deduplicate rules by ruleType before counting
  const uniqueRules = rules.reduce<ICDRule[]>((acc, r) => {
    if (!acc.some(x => x.ruleType === r.ruleType)) acc.push(r)
    return acc
  }, [])

  // Short label for each rule type — shown inline next to code
  const RULE_LABEL: Record<string, string> = {
    khongDungLaBenhChinh:             'Không dùng làm bệnh chính',
    khongKhuyenKhichDungLaBenhChinh:  'Hạn chế làm bệnh chính',
    khongSuDungViCoMaCuTheHon:        'Không dùng — có mã cụ thể hơn',
    chiSuDungMaHoaNguyenNhanTuVong:   'Chỉ mã hóa tử vong',
    chiCoONuGioi:                     'Chỉ nữ giới',
    chiCoONamGioi:                    'Chỉ nam giới',
    maDauSaoKhongLaBenhChinh:         'Mã dấu sao (*) — không dùng làm bệnh chính',
    maDauGamCanKemMaDauSao:           'Cần kèm mã biểu hiện (*)',
  }

  const errorRules  = uniqueRules.filter(r => r.severity === 'error')
  // warnRules computed on-demand if needed
  const allRuleLabels = uniqueRules.map(r => RULE_LABEL[r.ruleType] ?? r.ruleType)

  return (
    <div className="fade-in" style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Code chip with symbol + companion badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Code chip — color changes by codingSymbol */}
            <span style={{
              fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 16,
              borderRadius: 6, padding: '4px 14px',
              border: '1px solid', display: 'inline-flex', alignItems: 'center', gap: 2,
              ...(record.codingSymbol === '†'
                ? { color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }
                : record.codingSymbol === '*'
                ? { color: '#a78bfa', background: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.3)' }
                : { color: 'var(--accent)', background: 'rgba(91,138,245,0.1)', borderColor: 'rgba(91,138,245,0.2)' }
              ),
            }}>
              {record.maBenh}
              {record.codingSymbol && (
                <span style={{ fontSize: 14, opacity: 0.9 }}>{record.codingSymbol}</span>
              )}
            </span>

            {/* Companion code badge */}
            {record.companionCode && (
              <button
                onClick={() => onNavigate?.(record.companionCode!)}
                title={record.codingSymbol === '†'
                  ? `Ghi kèm mã biểu hiện: ${record.companionCode}*`
                  : `Mã nguyên nhân kèm: ${record.companionCode}†`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'none',
                  border: `1px solid ${record.codingSymbol === '†' ? 'rgba(167,139,250,0.35)' : 'rgba(245,158,11,0.35)'}`,
                  borderRadius: 5, padding: '2px 10px', cursor: 'pointer',
                  fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 600,
                  color: record.codingSymbol === '†' ? '#a78bfa' : '#f59e0b',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {record.codingSymbol === '†' ? '→' : '←'}
                {record.companionCode}{record.codingSymbol === '†' ? '*' : '†'}
              </button>
            )}

            {/* Inline rule warnings */}
            {uniqueRules.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: errorRules.length > 0 ? '#fca5a5' : '#fde68a',
                background: errorRules.length > 0
                  ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
                border: `1px solid ${errorRules.length > 0
                  ? 'rgba(248,113,113,0.25)' : 'rgba(251,191,36,0.25)'}`,
                borderRadius: 6, padding: '2px 10px',
                lineHeight: 1.5,
              }}>
                {allRuleLabels.join(' ; ')}
              </span>
            )}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {record.tenTiengViet}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-overlay)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', gap: 4, overflowX: 'auto',
        flexShrink: 0,
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const badge = id === 'rules' && uniqueRules.length > 0
            ? uniqueRules.length : null
          return (
            <button
              key={id}
              className={`tab-btn ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon size={12} />
                {label}
                {badge && (
                  <span style={{
                    background: errorRules.length > 0 ? 'var(--error)' : 'var(--warning)',
                    color: '#fff', borderRadius: '50%', width: 16, height: 16,
                    fontSize: 9, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{badge}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {activeTab === 'basic' && (
          <TabBasic record={record} hierarchy={hierarchy} childRecords={childRecords} siblingRecords={siblingRecords} onNavigate={onNavigate} />
        )}
        {activeTab === 'rules' && (
          <TabRules code={record.maBenh} rules={rules} record={record} />
        )}
        {activeTab === 'relations' && (
          <TabRelations
            code={record.maBenh}
            codingRelations={codingRelations}
            infoRelations={infoRelations}
            onNavigate={onNavigate}
          />
        )}
        {activeTab === 'provenance' && (
          <TabProvenance
            record={record}
            rules={rules}
            codingRelations={codingRelations}
          />
        )}
      </div>
    </div>
  )
}
