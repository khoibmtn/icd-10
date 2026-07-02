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

export function DetailView({ record, rules, codingRelations, infoRelations, hierarchy, childRecords = [], siblingRecords = [], onClose, onNavigate }: DetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic')

  const uniqueRules = rules.reduce<ICDRule[]>((acc, r) => {
    if (!acc.some(x => x.ruleType === r.ruleType)) acc.push(r)
    return acc
  }, [])

  const RULE_LABEL: Record<string, string> = {
    khongDungLaBenhChinh: 'Không dùng làm bệnh chính',
    khongKhuyenKhichDungLaBenhChinh: 'Hạn chế làm bệnh chính',
    khongSuDungViCoMaCuTheHon: 'Không dùng — có mã cụ thể hơn',
    chiSuDungMaHoaNguyenNhanTuVong: 'Chỉ mã hóa tử vong',
    chiCoONuGioi: 'Chỉ nữ giới',
    chiCoONamGioi: 'Chỉ nam giới',
    maDauSaoKhongLaBenhChinh: 'Mã dấu sao (*) — không dùng làm bệnh chính',
    maDauGamCanKemMaDauSao: 'Cần kèm mã biểu hiện (*)',
  }

  const errorRules = uniqueRules.filter(r => r.severity === 'error')
  const allRuleLabels = uniqueRules.map(r => RULE_LABEL[r.ruleType] ?? r.ruleType)

  return (
    <div className="fade-in h-full flex flex-col bg-white md:border-l md:border-slate-200">
      {/* Header */}
      <div className="px-4 py-3 md:px-5 md:py-4 border-b border-slate-200 flex items-start justify-between shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`font-mono font-bold text-base rounded-md px-3 py-1 border inline-flex items-center gap-1
              ${record.codingSymbol === '†' ? 'text-amber-600 bg-amber-50 border-amber-200'
                : record.codingSymbol === '*' ? 'text-violet-600 bg-violet-50 border-violet-200'
                : 'text-blue-600 bg-blue-50 border-blue-200'}`}>
              {record.maBenh}
              {record.codingSymbol && <span className="text-sm opacity-90">{record.codingSymbol}</span>}
            </span>
            {record.companionCode && (
              <button
                onClick={() => onNavigate?.(record.companionCode!)}
                className={`inline-flex items-center gap-1.5 bg-transparent border rounded px-2.5 py-0.5 cursor-pointer font-mono text-xs font-semibold transition-opacity hover:opacity-70
                  ${record.codingSymbol === '†' ? 'border-violet-200 text-violet-600' : 'border-amber-200 text-amber-600'}`}
              >
                {record.codingSymbol === '†' ? '→' : '←'}
                {record.companionCode}{record.codingSymbol === '†' ? '*' : '†'}
              </button>
            )}
            {uniqueRules.length > 0 && (
              <span className={`text-[11px] font-medium rounded-md px-2.5 py-0.5 leading-snug border
                ${errorRules.length > 0 ? 'text-red-600 bg-red-50 border-red-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}>
                {allRuleLabels.join(' ; ')}
              </span>
            )}
          </div>
          <div className="mt-1.5 text-sm text-slate-600 leading-snug">{record.tenTiengViet}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="hidden md:flex items-center p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 cursor-pointer transition-all hover:text-slate-600 shrink-0">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-3 py-2 border-b border-slate-200 flex gap-1 overflow-x-auto shrink-0 bg-slate-50">
        {TABS.map(({ id, label, Icon }) => {
          const badge = id === 'rules' && uniqueRules.length > 0 ? uniqueRules.length : null
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-none whitespace-nowrap transition-all duration-150
                ${activeTab === id
                  ? 'bg-blue-50 text-blue-600 font-semibold shadow-[0_0_0_1px_rgba(59,130,246,0.3)]'
                  : 'bg-transparent text-slate-500 hover:bg-white hover:text-slate-700'}`}
              style={{ fontFamily: 'inherit' }}
            >
              <Icon size={12} />
              {label}
              {badge && (
                <span className={`w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${errorRules.length > 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-slate-50/50">
        {activeTab === 'basic' && <TabBasic record={record} hierarchy={hierarchy} childRecords={childRecords} siblingRecords={siblingRecords} onNavigate={onNavigate} />}
        {activeTab === 'rules' && <TabRules code={record.maBenh} rules={rules} record={record} />}
        {activeTab === 'relations' && <TabRelations code={record.maBenh} codingRelations={codingRelations} infoRelations={infoRelations} onNavigate={onNavigate} />}
        {activeTab === 'provenance' && <TabProvenance record={record} rules={rules} codingRelations={codingRelations} />}
      </div>
    </div>
  )
}
