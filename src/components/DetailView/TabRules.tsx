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
    description: 'Đây là mã biểu hiện bệnh (manifestation code) theo hệ thống mã kép ICD-10. Mã (*) KHÔNG được ghi làm bệnh chính. Phải có mã nguyên nhân/bệnh sinh có dấu găm (†) đứng trước trong hồ sơ.',
    icon: <Ban size={16} />,
    variant: 'restrict',
    badgeLabel: 'ICD-10 Mã kép',
  },
  maDauGamCanKemMaDauSao: {
    label: 'Mã dấu găm (†) — Cần kèm mã biểu hiện (*)',
    description: 'Đây là mã nguyên nhân/bệnh sinh (etiology code) theo hệ thống mã kép ICD-10. Khi sử dụng mã (†) làm bệnh chính, bắt buộc phải ghi thêm mã biểu hiện (*) là bệnh kèm theo trong hồ sơ.',
    icon: <Link2 size={16} />,
    variant: 'caution',
    badgeLabel: 'ICD-10 Mã kép',
  },
}

const VARIANT_STYLE = {
  restrict: {
    bg: 'rgba(248,113,113,0.05)',
    border: 'rgba(248,113,113,0.18)',
    iconColor: '#f87171',
    badgeBg: 'rgba(248,113,113,0.15)',
    badgeColor: '#dc4545',
    badgeBorder: 'rgba(220,69,69,0.3)',
    stripe: '#f87171',
  },
  caution: {
    bg: 'rgba(251,191,36,0.05)',
    border: 'rgba(251,191,36,0.18)',
    iconColor: '#fbbf24',
    badgeBg: 'rgba(251,191,36,0.15)',
    badgeColor: '#a07008',
    badgeBorder: 'rgba(217,150,10,0.3)',
    stripe: '#fbbf24',
  },
  info: {
    bg: 'rgba(96,165,250,0.05)',
    border: 'rgba(96,165,250,0.18)',
    iconColor: '#60a5fa',
    badgeBg: 'rgba(96,165,250,0.15)',
    badgeColor: '#2563eb',
    badgeBorder: 'rgba(59,130,246,0.3)',
    stripe: '#60a5fa',
  },
}

export function TabRules({ code, rules, record }: TabRulesProps) {
  const flags = record.dieuKienSuDung
  // ── Deduplicate: keep only one rule per ruleType ──────────────────────────
  const uniqueRules = rules.reduce<ICDRule[]>((acc, rule) => {
    if (!acc.some(r => r.ruleType === rule.ruleType)) acc.push(rule)
    return acc
  }, [])

  if (uniqueRules.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ textAlign: 'center', padding: '32px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 500, color: 'var(--success)' }}>Không có quy tắc hạn chế</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            Mã <span className="mono" style={{ color: 'var(--accent)' }}>{code}</span> không có cảnh báo mã hóa đặc biệt.
          </div>
        </div>
        <ConditionFlags flags={flags} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="fade-in">
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
        {uniqueRules.length} quy tắc áp dụng cho mã{' '}
        <span className="mono" style={{ color: 'var(--accent)' }}>{code}</span>
      </div>

      {uniqueRules.map((rule, i) => {
        const meta = RULE_META[rule.ruleType] ?? {
          label: rule.ruleType,
          description: rule.message,
          icon: <Info size={16} />,
          variant: 'info' as const,
          badgeLabel: 'Quy tắc',
        }
        const vs = VARIANT_STYLE[meta.variant]

        return (
          <div
            key={i}
            style={{
              background: vs.bg,
              border: `1px solid ${vs.border}`,
              borderRadius: 10,
              padding: '14px 16px',
              borderLeft: `3px solid ${vs.stripe}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ color: vs.iconColor, flexShrink: 0, marginTop: 1 }}>
                {meta.icon}
              </div>
              <div style={{ flex: 1 }}>
                {/* Title + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                    {meta.label}
                  </span>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600,
                    background: vs.badgeBg, color: vs.badgeColor, border: `1px solid ${vs.badgeBorder}`,
                  }}>
                    {meta.badgeLabel}
                  </span>
                </div>

                {/* Description */}
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {meta.description}
                </div>

                {/* Provenance */}
                <div style={{
                  marginTop: 10, paddingTop: 10,
                  borderTop: `1px solid ${vs.border}`,
                  display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                  <BookOpen size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Nguồn:</span>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                    background: 'rgba(59,109,232,0.08)', color: '#2b5bc4',
                    border: '1px solid rgba(59,109,232,0.2)',
                  }}>
                    {rule.provenance.citationLevel === 'official' ? 'Chính thức'
                      : rule.provenance.citationLevel === 'compiled' ? 'Biên soạn'
                      : 'Suy diễn'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                    {rule.provenance.file}
                  </span>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                    background: 'rgba(22,163,103,0.08)', color: '#0d8550',
                    border: '1px solid rgba(22,163,103,0.18)',
                  }}>
                    {rule.provenance.confidence === 'exact' ? 'Trích dẫn chính xác' : 'Suy diễn'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* ── Điều kiện sử dụng ─────────────────────────────────────────────── */}
      <ConditionFlags flags={flags} />
    </div>
  )
}

// ── Điều kiện sử dụng component ──────────────────────────────────────────────
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
    <div style={{
      marginTop: 8,
      paddingTop: 18,
      borderTop: '1px solid var(--border)',
    }}>
      <div style={{
        fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
        marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Điều kiện sử dụng
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(({ flag, label, type }) => {
          const color = type === 'error' ? 'var(--error)' : type === 'warning' ? 'var(--warning)' : 'var(--info)'
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {flag
                ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg-overlay)', border: '1px solid var(--border)', flexShrink: 0 }} />
              }
              <span style={{ fontSize: 12, color: flag ? color : 'var(--text-muted)' }}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
