// src/components/DetailView/TabRules.tsx
import { AlertTriangle, XCircle, Info, ShieldAlert, User, FileText } from 'lucide-react'
import type { ICDRule } from '../../types/icd'

interface TabRulesProps {
  code: string
  rules: ICDRule[]
}

const RULE_META: Record<string, { label: string; description: string; icon: React.ReactNode; variant: 'error' | 'warning' | 'info' }> = {
  khongDungLaBenhChinh: {
    label: 'Không dùng làm bệnh chính',
    description: 'Mã này không được phép mã hóa làm bệnh chính theo quy định của Bộ Y tế.',
    icon: <XCircle size={16} />, variant: 'error',
  },
  khongKhuyenKhichDungLaBenhChinh: {
    label: 'Không khuyến khích làm bệnh chính',
    description: 'Mã này không được khuyến khích dùng làm bệnh chính. Nên chọn mã cụ thể hơn nếu có.',
    icon: <AlertTriangle size={16} />, variant: 'warning',
  },
  khongSuDungViCoMaCuTheHon: {
    label: 'Có mã cụ thể hơn',
    description: 'Tồn tại mã 4 hoặc 5 ký tự mô tả chính xác hơn. Nên dùng mã đó thay thế.',
    icon: <ShieldAlert size={16} />, variant: 'warning',
  },
  chiSuDungMaHoaNguyenNhanTuVong: {
    label: 'Chỉ dùng mã hóa nguyên nhân tử vong',
    description: 'Mã này chỉ được dùng khi mã hóa nguyên nhân tử vong, không dùng cho bệnh nhân còn sống.',
    icon: <FileText size={16} />, variant: 'error',
  },
  chiCoONuGioi: {
    label: 'Chỉ áp dụng cho nữ giới',
    description: 'Tình trạng này chỉ có hoặc chủ yếu xảy ra ở nữ giới. Kiểm tra giới tính bệnh nhân.',
    icon: <User size={16} />, variant: 'info',
  },
  chiCoONamGioi: {
    label: 'Chỉ áp dụng cho nam giới',
    description: 'Tình trạng này chỉ có hoặc chủ yếu xảy ra ở nam giới. Kiểm tra giới tính bệnh nhân.',
    icon: <User size={16} />, variant: 'info',
  },
}

const VARIANT_STYLE = {
  error: {
    bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.2)',
    iconColor: 'var(--error)', badge: 'badge-error', label: 'LỖI',
  },
  warning: {
    bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.2)',
    iconColor: 'var(--warning)', badge: 'badge-warning', label: 'CẢNH BÁO',
  },
  info: {
    bg: 'rgba(96,165,250,0.06)', border: 'rgba(96,165,250,0.2)',
    iconColor: 'var(--info)', badge: 'badge-info', label: 'LƯU Ý',
  },
}

export function TabRules({ code, rules }: TabRulesProps) {
  if (rules.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <div style={{ fontWeight: 500, color: 'var(--success)' }}>Không có quy tắc hạn chế</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>Mã <span className="mono" style={{ color: 'var(--accent)' }}>{code}</span> không có cảnh báo mã hóa đặc biệt.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="fade-in">
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
        {rules.length} quy tắc áp dụng cho mã <span className="mono" style={{ color: 'var(--accent)' }}>{code}</span>
      </div>
      {rules.map((rule, i) => {
        const meta = RULE_META[rule.ruleType] ?? {
          label: rule.ruleType, description: rule.message,
          icon: <Info size={16} />, variant: 'info' as const,
        }
        const vs = VARIANT_STYLE[meta.variant]
        return (
          <div key={i} style={{
            background: vs.bg, border: `1px solid ${vs.border}`,
            borderRadius: 10, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ color: vs.iconColor, flexShrink: 0, marginTop: 1 }}>{meta.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{meta.label}</span>
                  <span className={`badge ${vs.badge}`}>{vs.label}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {meta.description}
                </div>
                {/* Provenance */}
                <div style={{
                  marginTop: 10, paddingTop: 10, borderTop: `1px solid ${vs.border}`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Nguồn:</span>
                  <span className={`badge badge-${rule.provenance.citationLevel === 'official' ? 'official' : rule.provenance.citationLevel === 'compiled' ? 'compiled' : 'inferred'}`}>
                    {rule.provenance.citationLevel === 'official' ? 'Chính thức'
                      : rule.provenance.citationLevel === 'compiled' ? 'Biên soạn'
                      : 'Suy diễn'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                    {rule.provenance.file}
                  </span>
                  <span className={`badge badge-${rule.provenance.confidence === 'exact' ? 'success' : 'info'}`}>
                    {rule.provenance.confidence === 'exact' ? 'Trích dẫn chính xác' : 'Suy diễn'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
