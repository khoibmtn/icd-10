// src/components/DetailView/TabRules.tsx
import { AlertTriangle, Ban, Info, ShieldAlert, User, FileText, Link2 } from 'lucide-react'
import type { ICDRecord, ICDRule } from '../../types/icd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface TabRulesProps { code: string; rules: ICDRule[]; record: ICDRecord }

const RULE_META: Record<string, { label: string; description: string; icon: React.ReactNode; variant: 'restrict' | 'caution' | 'info'; badgeLabel: string }> = {
  khongDungLaBenhChinh: { label: 'Không dùng làm bệnh chính', description: 'Theo quy định của Bộ Y tế, mã này không được phép sử dụng làm bệnh chính.', icon: <Ban size={16} />, variant: 'restrict', badgeLabel: 'Quy tắc BYT' },
  khongKhuyenKhichDungLaBenhChinh: { label: 'Không khuyến khích làm bệnh chính', description: 'Nên chọn mã cụ thể hơn mô tả đúng tình trạng bệnh nhân.', icon: <AlertTriangle size={16} />, variant: 'caution', badgeLabel: 'Khuyến cáo' },
  khongSuDungViCoMaCuTheHon: { label: 'Có mã cụ thể hơn', description: 'Tồn tại mã 4 hoặc 5 ký tự mô tả chính xác hơn.', icon: <ShieldAlert size={16} />, variant: 'caution', badgeLabel: 'Quy tắc mã hóa' },
  chiSuDungMaHoaNguyenNhanTuVong: { label: 'Chỉ dùng mã hóa nguyên nhân tử vong', description: 'Mã này chỉ dùng khi mã hóa nguyên nhân tử vong.', icon: <FileText size={16} />, variant: 'restrict', badgeLabel: 'Quy tắc BYT' },
  chiCoONuGioi: { label: 'Chỉ áp dụng cho nữ giới', description: 'Cần kiểm tra giới tính bệnh nhân.', icon: <User size={16} />, variant: 'info', badgeLabel: 'Giới tính' },
  chiCoONamGioi: { label: 'Chỉ áp dụng cho nam giới', description: 'Cần kiểm tra giới tính bệnh nhân.', icon: <User size={16} />, variant: 'info', badgeLabel: 'Giới tính' },
  maDauSaoKhongLaBenhChinh: { label: 'Mã (*) — Không được làm bệnh chính', description: 'Đây là mã biểu hiện bệnh theo hệ thống mã kép ICD-10.', icon: <Ban size={16} />, variant: 'restrict', badgeLabel: 'Mã kép' },
  maDauGamCanKemMaDauSao: { label: 'Mã (†) — Cần kèm mã (*)', description: 'Bắt buộc ghi thêm mã biểu hiện (*) kèm theo.', icon: <Link2 size={16} />, variant: 'caution', badgeLabel: 'Mã kép' },
}

const VC = {
  restrict: { card: 'bg-destructive/5 border-destructive/20 border-l-[3px] border-l-destructive/70', icon: 'text-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/20' },
  caution: { card: 'bg-amber-500/5 border-amber-500/20 border-l-[3px] border-l-amber-500/70', icon: 'text-amber-600', badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
  info: { card: 'bg-primary/5 border-primary/20 border-l-[3px] border-l-primary/70', icon: 'text-primary', badge: 'bg-primary/10 text-primary border-primary/20' },
}

export function TabRules({ code, rules, record }: TabRulesProps) {
  const flags = record.dieuKienSuDung
  const uniqueRules = rules.reduce<ICDRule[]>((acc, r) => { if (!acc.some(x => x.ruleType === r.ruleType)) acc.push(r); return acc }, [])

  if (uniqueRules.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center py-8 px-6 text-muted-foreground flex flex-col items-center">
          <div className="text-3xl mb-3 opacity-90">✅</div>
          <div className="font-medium text-emerald-600">Không có quy tắc hạn chế</div>
          <div className="text-xs mt-1.5 text-muted-foreground">Mã <span className="font-mono text-primary bg-primary/10 px-1 rounded">{code}</span> không có cảnh báo đặc biệt.</div>
        </div>
        <ConditionFlags flags={flags} />
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-3">
      <div className="text-xs text-muted-foreground font-medium mb-1">
        {uniqueRules.length} quy tắc cho mã <span className="font-mono text-primary bg-primary/10 px-1 rounded">{code}</span>
      </div>
      {uniqueRules.map((rule, i) => {
        const meta = RULE_META[rule.ruleType] ?? { label: rule.ruleType, description: rule.message, icon: <Info size={16} />, variant: 'info' as const, badgeLabel: 'Quy tắc' }
        const vc = VC[meta.variant]
        return (
          <Card key={i} className={`p-4 shadow-sm ${vc.card}`}>
            <div className="flex items-start gap-3">
              <div className={`${vc.icon} shrink-0 mt-0.5`}>{meta.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">{meta.label}</span>
                  <Badge variant="outline" className={`px-1.5 py-0 h-5 text-[10px] shadow-none ${vc.badge}`}>{meta.badgeLabel}</Badge>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed font-medium">{meta.description}</div>
              </div>
            </div>
          </Card>
        )
      })}
      <ConditionFlags flags={flags} />
    </div>
  )
}

type Flags = ICDRecord['dieuKienSuDung']
function ConditionFlags({ flags }: { flags: Flags }) {
  const rows = [
    { flag: flags.khongDungLaBenhChinh, label: 'Không được dùng làm bệnh chính', type: 'error' as const },
    { flag: flags.khongKhuyenKhichDungLaBenhChinh, label: 'Không khuyến khích dùng làm bệnh chính', type: 'warning' as const },
    { flag: flags.khongSuDungViCoMaCuTheHon, label: 'Không dùng — có mã cụ thể hơn', type: 'warning' as const },
    { flag: flags.chiSuDungMaHoaNguyenNhanTuVong, label: 'Chỉ dùng mã hóa nguyên nhân tử vong', type: 'error' as const },
    { flag: flags.chiCoONuGioi, label: 'Chỉ áp dụng cho nữ giới', type: 'info' as const },
    { flag: flags.chiCoONamGioi, label: 'Chỉ áp dụng cho nam giới', type: 'info' as const },
  ]
  return (
    <Card className="mt-2 p-4 shadow-sm border-border bg-card">
      <div className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Điều kiện sử dụng (Flags)</div>
      <div className="flex flex-col gap-3">
        {rows.map(({ flag, label, type }) => {
          const dot = type === 'error' ? 'bg-destructive' : type === 'warning' ? 'bg-amber-500' : 'bg-primary'
          const txt = type === 'error' ? 'text-destructive font-medium' : type === 'warning' ? 'text-amber-600 font-medium' : 'text-primary font-medium'
          return (
            <div key={label} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${flag ? dot : 'bg-muted-foreground/20'}`} />
              <span className={`text-xs ${flag ? txt : 'text-muted-foreground'}`}>{label}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
