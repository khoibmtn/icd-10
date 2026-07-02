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

  const uniqueRules = rules.reduce<ICDRule[]>((acc, r) => {
    if (!acc.some(x => x.ruleType === r.ruleType)) acc.push(r)
    return acc
  }, [])

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

  const errorRules = uniqueRules.filter(r => r.severity === 'error')
  const allRuleLabels = uniqueRules.map(r => RULE_LABEL[r.ruleType] ?? r.ruleType)

  return (
    <div className="fade-in h-full flex flex-col bg-surface md:border-l md:border-border">

      {/* Header */}
      <div className="px-4 py-3 md:px-5 md:py-4 border-b border-border flex items-start justify-between shrink-0">
        <div className="flex-1 min-w-0">
          {/* Code chip + companion + rules */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Code chip */}
            <span className={`
              font-mono font-bold text-base rounded-md px-3 py-1 border inline-flex items-center gap-1
              ${record.codingSymbol === '†'
                ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                : record.codingSymbol === '*'
                ? 'text-purple-400 bg-purple-400/10 border-purple-400/30'
                : 'text-accent bg-accent/10 border-accent/20'
              }
            `}>
              {record.maBenh}
              {record.codingSymbol && <span className="text-sm opacity-90">{record.codingSymbol}</span>}
            </span>

            {/* Companion code badge */}
            {record.companionCode && (
              <button
                onClick={() => onNavigate?.(record.companionCode!)}
                className={`
                  inline-flex items-center gap-1.5 bg-transparent border rounded px-2.5 py-0.5
                  cursor-pointer font-mono text-xs font-semibold transition-opacity hover:opacity-70
                  ${record.codingSymbol === '†'
                    ? 'border-purple-400/35 text-purple-400'
                    : 'border-amber-500/35 text-amber-500'
                  }
                `}
              >
                {record.codingSymbol === '†' ? '→' : '←'}
                {record.companionCode}{record.codingSymbol === '†' ? '*' : '†'}
              </button>
            )}

            {/* Inline rule warnings */}
            {uniqueRules.length > 0 && (
              <span className={`
                text-[11px] font-medium rounded-md px-2.5 py-0.5 leading-snug border
                ${errorRules.length > 0
                  ? 'text-error bg-error/10 border-error/25'
                  : 'text-warning bg-warning/10 border-warning/25'
                }
              `}>
                {allRuleLabels.join(' ; ')}
              </span>
            )}
          </div>
          <div className="mt-1.5 text-sm text-text-secondary leading-snug">{record.tenTiengViet}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="hidden md:flex items-center p-1.5 rounded-lg bg-overlay border border-border text-text-muted cursor-pointer transition-all hover:text-text shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 border-b border-border flex gap-1 overflow-x-auto shrink-0">
        {TABS.map(({ id, label, Icon }) => {
          const badge = id === 'rules' && uniqueRules.length > 0 ? uniqueRules.length : null
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                cursor-pointer border-none whitespace-nowrap transition-all duration-150 font-[inherit]
                ${activeTab === id
                  ? 'bg-accent-light text-accent font-semibold shadow-[0_0_0_1px_rgba(59,109,232,0.25)]'
                  : 'bg-transparent text-text-secondary hover:bg-elevated hover:text-text'
                }
              `}
            >
              <Icon size={12} />
              {label}
              {badge && (
                <span className={`
                  w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center
                  ${errorRules.length > 0 ? 'bg-error' : 'bg-warning'}
                `}>{badge}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {activeTab === 'basic' && (
          <TabBasic record={record} hierarchy={hierarchy} childRecords={childRecords} siblingRecords={siblingRecords} onNavigate={onNavigate} />
        )}
        {activeTab === 'rules' && (
          <TabRules code={record.maBenh} rules={rules} record={record} />
        )}
        {activeTab === 'relations' && (
          <TabRelations code={record.maBenh} codingRelations={codingRelations} infoRelations={infoRelations} onNavigate={onNavigate} />
        )}
        {activeTab === 'provenance' && (
          <TabProvenance record={record} rules={rules} codingRelations={codingRelations} />
        )}
      </div>
    </div>
  )
}
