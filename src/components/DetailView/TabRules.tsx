// src/components/DetailView/TabRules.tsx
import { AlertTriangle, Ban, Info, ShieldAlert, User, FileText, BookOpen, Link2 } from 'lucide-react'
import type { ICDRecord, ICDRule } from '../../types/icd'

interface TabRulesProps {
  code: string
  rules: ICDRule[]
  record: ICDRecord
}

const RULE_META: Record<string, {
  label: string
  description: string
  icon: React.ReactNode
  variant: 'restrict' | 'caution' | 'info'
  badgeLabel: string
}> = {
  khongDungLaBenhChinh: {
    label: 'Không dùng làm bệnh chính',
    description: 'Theo quy định của Bộ Y tế, mã này không được phép sử dụng làm bệnh chính (principal diagnosis). Phải chọn mã bệnh chính khác phù hợp.',
    icon: <Ban size={16} />,
    variant: 'restrict',
    badgeLabel: 'Quy tắc BYT',
  },
  khongKhuyenKhichDungLaBenhChinh: {
    label: 'Không khuyến khích làm bệnh chính',
    description: 'Không khuyến khích dùng mã này làm bệnh chính. Nên chọn mã cụ thể hơn mô tả đúng tình trạng bệnh nhân.',
    icon: <AlertTriangle size={16} />,
    variant: 'caution',
    badgeLabel: 'Khuyến cáo',
  },
  khongSuDungViCoMaCuTheHon: {
    label: 'Có mã cụ thể hơn',
    description: 'Tồn tại mã 4 hoặc 5 ký tự mô tả chính xác hơn. Nên dùng mã đó thay thế để đảm bảo độ chính xác khi thanh toán BHYT.',
    icon: <ShieldAlert size={16} />,
    variant: 'caution',
    badgeLabel: 'Quy tắc mã hóa',
  },
  chiSuDungMaHoaNguyenNhanTuVong: {
    label: 'Chỉ dùng mã hóa nguyên nhân tử vong',
    description: 'Mã này chỉ được dùng khi mã hóa nguyên nhân tử vong (mortality coding), không dùng cho bệnh nhân còn sống.',
    icon: <FileText size={16} />,
    variant: 'restrict',
    badgeLabel: 'Quy tắc BYT',
  },
  chiCoONuGioi: {
    label: 'Chỉ áp dụng cho nữ giới',
    description: 'Tình trạng này chỉ có hoặc chủ yếu xảy ra ở nữ giới. Cần kiểm tra lại giới tính bệnh nhân trước khi sử dụng mã này.',
    icon: <User size={16} />,
    variant: 'info',
    badgeLabel: 'Điều kiện giới tính',
  },
  chiCoONamGioi: {
    label: 'Chỉ áp dụng cho nam giới',
    description: 'Tình trạng này chỉ có hoặc chủ yếu xảy ra ở nam giới. Cần kiểm tra lại giới tính bệnh nhân trước khi sử dụng mã này.',
    icon: <User size={16} />,
    variant: 'info',
    badgeLabel: 'Điều kiện giới tính',
  },
  maDauSaoKhongLaBenhChinh: {
    label: 'Mã dấu sao (*) — Không được làm bệnh chính',
    description: 'Đây là mã biểu hiện bệnh (manifestation code) theo hệ thống mã kép ICD-10. Mã (*) KHÔNG được ghi làm bệnh chính.',
    icon: <Ban size={16} />,
    variant: 'restrict',
    badgeLabel: 'ICD-10 Mã kép',
  },
  maDauGamCanKemMaDauSao: {
    label: 'Mã dấu găm (†) — Cần kèm mã biểu hiện (*)',
    description: 'Đây là mã nguyên nhân/bệnh sinh (etiology code). Khi sử dụng làm bệnh chính, bắt buộc ghi thêm mã (*) kèm theo.',
    icon: <Link2 size={16} />,
    variant: 'caution',
    badgeLabel: 'ICD-10 Mã kép',
  },
}

const VARIANT_CLASSES = {
  restrict: {
    card: 'bg-red-50 border-red-200/60 border-l-red-400',
    icon: 'text-red-400',
    badgeBg: 'bg-red-100/80 text-red-700 border-red-300/60',
    stripe: 'border-l-[3px] border-l-red-400',
  },
  caution: {
    card: 'bg-amber-50/60 border-amber-200/60 border-l-amber-400',
    icon: 'text-amber-400',
    badgeBg: 'bg-amber-100/80 text-amber-700 border-amber-300/60',
    stripe: 'border-l-[3px] border-l-amber-400',
  },
  info: {
    card: 'bg-blue-50/60 border-blue-200/60 border-l-blue-400',
    icon: 'text-blue-400',
    badgeBg: 'bg-blue-100/80 text-blue-700 border-blue-300/60',
    stripe: 'border-l-[3px] border-l-blue-400',
  },
}

export function TabRules({ code, rules, record }: TabRulesProps) {
  const flags = record.dieuKienSuDung
  const uniqueRules = rules.reduce<ICDRule[]>((acc, rule) => {
    if (!acc.some(r => r.ruleType === rule.ruleType)) acc.push(rule)
    return acc
  }, [])

  if (uniqueRules.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center py-8 px-6 text-fg-muted">
          <div className="text-3xl mb-3">✅</div>
          <div className="font-medium text-ok">Không có quy tắc hạn chế</div>
          <div className="text-xs mt-1.5">
            Mã <span className="font-mono text-accent">{code}</span> không có cảnh báo mã hóa đặc biệt.
          </div>
        </div>
        <ConditionFlags flags={flags} />
      </div>
    )
  }

  return (
    <div className="fade-in flex flex-col gap-2.5">
      <div className="text-[11px] text-fg-muted mb-1">
        {uniqueRules.length} quy tắc áp dụng cho mã{' '}
        <span className="font-mono text-accent">{code}</span>
      </div>

      {uniqueRules.map((rule, i) => {
        const meta = RULE_META[rule.ruleType] ?? {
          label: rule.ruleType,
          description: rule.message,
          icon: <Info size={16} />,
          variant: 'info' as const,
          badgeLabel: 'Quy tắc',
        }
        const vc = VARIANT_CLASSES[meta.variant]

        return (
          <div key={i} className={`border rounded-xl p-3.5 md:p-4 ${vc.card} ${vc.stripe}`}>
            <div className="flex items-start gap-3">
              <div className={`${vc.icon} shrink-0 mt-0.5`}>{meta.icon}</div>
              <div className="flex-1">
                {/* Title + badge */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-fg">{meta.label}</span>
                  <span className={`text-[10px] px-1.5 py-px rounded font-semibold border ${vc.badgeBg}`}>
                    {meta.badgeLabel}
                  </span>
                </div>

                {/* Description */}
                <div className="text-xs text-fg-secondary leading-relaxed">{meta.description}</div>

                {/* Provenance */}
                <div className="mt-2.5 pt-2.5 border-t border-black/6 flex items-center gap-2 flex-wrap">
                  <BookOpen size={10} className="text-fg-muted shrink-0" />
                  <span className="text-[10px] text-fg-muted">Nguồn:</span>
                  <span className="text-[10px] px-1.5 py-px rounded font-semibold bg-accent/8 text-accent border border-accent/20">
                    {rule.provenance.citationLevel === 'official' ? 'Chính thức'
                      : rule.provenance.citationLevel === 'compiled' ? 'Biên soạn'
                      : 'Suy diễn'}
                  </span>
                  <span className="text-[10px] text-fg-muted font-mono">{rule.provenance.file}</span>
                  <span className="text-[10px] px-1.5 py-px rounded font-semibold bg-ok/8 text-ok border border-ok/18">
                    {rule.provenance.confidence === 'exact' ? 'Trích dẫn chính xác' : 'Suy diễn'}
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

// ── Condition flags ──────────────────────────────────────────────────────────
type Flags = ICDRecord['dieuKienSuDung']

function ConditionFlags({ flags }: { flags: Flags }) {
  const rows: { flag: boolean; label: string; type: 'error' | 'warning' | 'info' }[] = [
    { flag: flags.khongDungLaBenhChinh,            label: 'Không được dùng làm bệnh chính',        type: 'error' },
    { flag: flags.khongKhuyenKhichDungLaBenhChinh, label: 'Không khuyến khích dùng làm bệnh chính', type: 'warning' },
    { flag: flags.khongSuDungViCoMaCuTheHon,       label: 'Không dùng — có mã cụ thể hơn',          type: 'warning' },
    { flag: flags.chiSuDungMaHoaNguyenNhanTuVong,  label: 'Chỉ dùng mã hóa nguyên nhân tử vong',   type: 'error' },
    { flag: flags.chiCoONuGioi,                    label: 'Chỉ áp dụng cho nữ giới',                type: 'info' },
    { flag: flags.chiCoONamGioi,                   label: 'Chỉ áp dụng cho nam giới',               type: 'info' },
  ]

  return (
    <div className="mt-2 pt-4 border-t border-line">
      <div className="text-xs font-semibold text-fg-secondary mb-3 uppercase tracking-wide">
        Điều kiện sử dụng
      </div>
      <div className="flex flex-col gap-2">
        {rows.map(({ flag, label, type }) => {
          const dotColor = type === 'error' ? 'bg-danger' : type === 'warning' ? 'bg-warn' : 'bg-info'
          const textColor = type === 'error' ? 'text-danger' : type === 'warning' ? 'text-warn' : 'text-info'
          return (
            <div key={label} className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full shrink-0 ${flag ? dotColor : 'bg-dim border border-line'}`} />
              <span className={`text-xs ${flag ? textColor : 'text-fg-muted'}`}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
