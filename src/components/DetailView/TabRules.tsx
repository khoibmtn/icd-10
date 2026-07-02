// src/components/DetailView/TabRules.tsx
import { AlertTriangle, Ban, Info, ShieldAlert, User, FileText, BookOpen, Link2 } from 'lucide-react'
import type { ICDRecord, ICDRule } from '../../types/icd'

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
  restrict: { card: 'bg-red-50/80 border-red-200', icon: 'text-red-400', badge: 'bg-red-100 text-red-700 border-red-200', stripe: 'border-l-[3px] border-l-red-400' },
  caution: { card: 'bg-amber-50/80 border-amber-200', icon: 'text-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200', stripe: 'border-l-[3px] border-l-amber-400' },
  info: { card: 'bg-blue-50/80 border-blue-200', icon: 'text-blue-400', badge: 'bg-blue-100 text-blue-700 border-blue-200', stripe: 'border-l-[3px] border-l-blue-400' },
}

export function TabRules({ code, rules, record }: TabRulesProps) {
  const flags = record.dieuKienSuDung
  const uniqueRules = rules.reduce<ICDRule[]>((acc, r) => { if (!acc.some(x => x.ruleType === r.ruleType)) acc.push(r); return acc }, [])

  if (uniqueRules.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center py-8 px-6 text-slate-400">
          <div className="text-3xl mb-3">✅</div>
          <div className="font-medium text-emerald-600">Không có quy tắc hạn chế</div>
          <div className="text-xs mt-1.5">Mã <span className="font-mono text-blue-600">{code}</span> không có cảnh báo đặc biệt.</div>
        </div>
        <ConditionFlags flags={flags} />
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-2.5">
      <div className="text-[11px] text-slate-400 mb-1">
        {uniqueRules.length} quy tắc cho mã <span className="font-mono text-blue-600">{code}</span>
      </div>
      {uniqueRules.map((rule, i) => {
        const meta = RULE_META[rule.ruleType] ?? { label: rule.ruleType, description: rule.message, icon: <Info size={16} />, variant: 'info' as const, badgeLabel: 'Quy tắc' }
        const vc = VC[meta.variant]
        return (
          <div key={i} className={`border rounded-xl p-3.5 md:p-4 ${vc.card} ${vc.stripe}`}>
            <div className="flex items-start gap-3">
              <div className={`${vc.icon} shrink-0 mt-0.5`}>{meta.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-slate-800">{meta.label}</span>
                  <span className={`text-[10px] px-1.5 py-px rounded font-semibold border ${vc.badge}`}>{meta.badgeLabel}</span>
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">{meta.description}</div>
                <div className="mt-2.5 pt-2.5 border-t border-black/5 flex items-center gap-2 flex-wrap">
                  <BookOpen size={10} className="text-slate-400 shrink-0" />
                  <span className="text-[10px] text-slate-400">Nguồn:</span>
                  <span className="text-[10px] px-1.5 py-px rounded font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                    {rule.provenance.citationLevel === 'official' ? 'Chính thức' : rule.provenance.citationLevel === 'compiled' ? 'Biên soạn' : 'Suy diễn'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{rule.provenance.file}</span>
                  <span className="text-[10px] px-1.5 py-px rounded font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    {rule.provenance.confidence === 'exact' ? 'Chính xác' : 'Suy diễn'}
                  </span>
                </div>
              </div>
            </div>
          </div>
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
    <div className="mt-2 pt-4 border-t border-slate-200">
      <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Điều kiện sử dụng</div>
      <div className="flex flex-col gap-2">
        {rows.map(({ flag, label, type }) => {
          const dot = type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
          const txt = type === 'error' ? 'text-red-600' : type === 'warning' ? 'text-amber-600' : 'text-blue-600'
          return (
            <div key={label} className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full shrink-0 ${flag ? dot : 'bg-slate-200 border border-slate-300'}`} />
              <span className={`text-xs ${flag ? txt : 'text-slate-400'}`}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
