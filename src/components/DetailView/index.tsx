// src/components/DetailView/index.tsx
import { useState } from 'react'
import { X, BookOpen, ShieldAlert } from 'lucide-react'
import type { ICDRecord, ICDRule } from '../../types/icd'
import { TabBasic } from './TabBasic'
import { TabRules } from './TabRules'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface DetailViewProps {
  record: ICDRecord
  rules: ICDRule[]
  childRecords?: ICDRecord[]
  siblingRecords?: ICDRecord[]
  onClose?: () => void
  onNavigate?: (code: string) => void
}

const TABS = [
  { id: 'basic',      label: 'Cơ bản',        Icon: BookOpen },
  { id: 'rules',      label: 'Quy tắc & ĐK', Icon: ShieldAlert },
] as const

type TabId = typeof TABS[number]['id']

export function DetailView({ record, rules, childRecords = [], siblingRecords = [], onClose, onNavigate }: DetailViewProps) {
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

  const sym = record.codingSymbol
  const variant = sym === '†' ? 'outline' : sym === '*' ? 'secondary' : 'default'
  const extraCls = sym === '†' ? 'border-amber-200 text-amber-700 bg-amber-50'
    : sym === '*' ? 'border-violet-200 text-violet-700 bg-violet-50'
    : 'bg-primary/10 text-primary border-primary/20'

  return (
    <div className="fade-in h-full flex flex-col bg-background md:border-l md:border-border">
      {/* Header */}
      <div className="px-4 py-3 md:px-6 md:py-5 border-b border-border flex items-start justify-between shrink-0 bg-card">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge variant={variant as any} className={`px-2.5 py-0.5 font-mono font-bold text-sm rounded-md border ${extraCls}`}>
              {record.maBenh}
              {record.codingSymbol && <span className="text-xs ml-1 opacity-80">{record.codingSymbol}</span>}
            </Badge>
            {record.companionCode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate?.(record.companionCode!)}
                className={`h-6 px-2 text-xs font-mono font-semibold transition-opacity
                  ${record.codingSymbol === '†' ? 'border-violet-200 text-violet-700 hover:bg-violet-50' : 'border-amber-200 text-amber-700 hover:bg-amber-50'}`}
              >
                {record.codingSymbol === '†' ? '→' : '←'}
                {record.companionCode}{record.codingSymbol === '†' ? '*' : '†'}
              </Button>
            )}
            {uniqueRules.length > 0 && (
              <Badge variant={errorRules.length > 0 ? "destructive" : "outline"} className={`px-2 py-0 h-5 text-[10px] ${errorRules.length > 0 ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'} shadow-none`}>
                {allRuleLabels.join(' ; ')}
              </Badge>
            )}
          </div>
          <div className="mt-2 text-[15px] font-medium text-foreground leading-snug">{record.tenTiengViet}</div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="hidden md:flex shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted ml-4">
            <X size={16} />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="flex-1 flex flex-col min-h-0">
        <div className="px-3 py-2.5 border-b border-border bg-muted/30">
          <TabsList className="bg-muted p-1 flex h-10 w-full justify-start rounded-lg border border-border/60">
            {TABS.map(({ id, label, Icon }) => {
              const badge = id === 'rules' && uniqueRules.length > 0 ? uniqueRules.length : null
              return (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md px-3 py-1.5 font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 transition-all duration-200 text-xs"
                >
                  <Icon size={14} />
                  <span>{label}</span>
                  {badge && (
                    <Badge variant={errorRules.length > 0 ? "destructive" : "secondary"} className={`ml-0.5 w-4 h-4 p-0 flex items-center justify-center text-[10px] rounded-full ${activeTab === 'rules' ? 'bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30' : errorRules.length === 0 ? 'bg-amber-500/10 text-amber-700' : ''}`}>
                      {badge}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20">
          <TabsContent value="basic" className="m-0 h-full border-none p-0 outline-none">
            <TabBasic record={record} rules={rules} childRecords={childRecords} siblingRecords={siblingRecords} onNavigate={onNavigate} />
          </TabsContent>
          <TabsContent value="rules" className="m-0 h-full border-none p-0 outline-none">
            <TabRules code={record.maBenh} rules={rules} record={record} />
          </TabsContent>

        </div>
      </Tabs>
    </div>
  )
}
