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
  record, rules, codingRelations, infoRelations, hierarchy, onClose, onNavigate,
}: DetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic')

  const errorCount = rules.filter(r => r.severity === 'error').length
  const warnCount = rules.filter(r => r.severity === 'warning').length

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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="code-chip" style={{ fontSize: 16 }}>{record.maBenh}</span>
            {errorCount > 0 && (
              <span className="badge badge-error">⚠ {errorCount} lỗi</span>
            )}
            {warnCount > 0 && (
              <span className="badge badge-warning">! {warnCount} cảnh báo</span>
            )}
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', maxWidth: 320, lineHeight: 1.4 }}>
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
          const badge = id === 'rules' && (errorCount + warnCount) > 0
            ? (errorCount + warnCount) : null
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
                    background: errorCount > 0 ? 'var(--error)' : 'var(--warning)',
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
          <TabBasic record={record} hierarchy={hierarchy} onNavigate={onNavigate} />
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
