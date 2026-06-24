// src/components/DetailView/index.tsx
import { useState } from 'react'
import { X, BookOpen, GitBranch, ShieldAlert, Link2, Archive, Beaker } from 'lucide-react'
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
  onClose?: () => void
  onNavigate?: (code: string) => void
}

const TABS = [
  { id: 'basic',      label: 'Cơ bản',      Icon: BookOpen },
  { id: 'rules',      label: 'Quy tắc',     Icon: ShieldAlert },
  { id: 'relations',  label: 'Quan hệ',     Icon: Link2 },
  { id: 'provenance', label: 'Nguồn gốc',   Icon: Archive },
] as const

type TabId = typeof TABS[number]['id']

export function DetailView({
  record, rules, codingRelations, infoRelations, hierarchy, childRecords = [], onClose, onNavigate,
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
  }

  const errorRules  = uniqueRules.filter(r => r.severity === 'error')
  const warnRules   = uniqueRules.filter(r => r.severity === 'warning')
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
          {/* Code + inline rule text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="code-chip" style={{ fontSize: 16, flexShrink: 0 }}>{record.maBenh}</span>
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
          <TabBasic record={record} hierarchy={hierarchy} childRecords={childRecords} onNavigate={onNavigate} />
        )}
        {activeTab === 'rules' && (
          <TabRules code={record.maBenh} rules={rules} />
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
