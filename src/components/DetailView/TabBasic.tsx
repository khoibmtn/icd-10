// src/components/DetailView/TabBasic.tsx
import { CheckCircle, XCircle, ChevronRight, ListTree } from 'lucide-react'
import type { ICDRecord, ICDHierarchy } from '../../types/icd'

interface TabBasicProps {
  record: ICDRecord
  hierarchy?: ICDHierarchy
  childRecords?: ICDRecord[]
  onNavigate?: (code: string) => void
}

export function TabBasic({ record: rec, hierarchy, childRecords = [], onNavigate }: TabBasicProps) {
  const flags = rec.dieuKienSuDung

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Primary Info */}
      <div className="glass" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Mã bệnh</div>
            <span className="code-chip" style={{ fontSize: 20, padding: '6px 16px' }}>
              {rec.maBenh}
            </span>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Tên tiếng Việt</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {rec.tenTiengViet || '—'}
            </div>
          </div>
        </div>
        {rec.tenTiengAnh && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Tên tiếng Anh (WHO)</div>
            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>{rec.tenTiengAnh}</div>
          </div>
        )}
      </div>

      {/* Classification */}
      <div className="glass" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Phân loại
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ClassRow label="Chương" value={`${rec.chuongStt} — ${rec.chuongTenViet}`} sub={rec.chuongPhamViMa} />
          <ClassRow label="Khối" value={rec.khoiTenViet} sub={rec.khoiMa} onNavigate={onNavigate ? () => onNavigate(rec.khoiMa) : undefined} />
          {rec.nhomMa && rec.nhomMa !== rec.maBenh && (
            <ClassRow label="Nhóm 3 ký tự" value={rec.nhomTenViet} sub={rec.nhomMa} onNavigate={onNavigate ? () => onNavigate(rec.nhomMa) : undefined} />
          )}
        </div>
      </div>

      {/* Hierarchy breadcrumb */}
      {hierarchy && (
        <div className="glass" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Breadcrumb
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <BreadcrumbItem label={rec.chuongStt} />
            <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
            <BreadcrumbItem label={rec.khoiMa} onClick={onNavigate ? () => onNavigate(rec.khoiMa) : undefined} />
            {rec.nhomMa && rec.nhomMa !== rec.maBenh && (
              <>
                <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
                <BreadcrumbItem label={rec.nhomMa} onClick={onNavigate ? () => onNavigate(rec.nhomMa) : undefined} />
              </>
            )}
            <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />
            <BreadcrumbItem label={rec.maBenh} active />
          </div>

          {/* Siblings */}
          {hierarchy.siblingCodes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Mã cùng nhóm</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {hierarchy.siblingCodes.slice(0, 8).map(c => (
                  <button
                    key={c}
                    onClick={() => onNavigate?.(c)}
                    style={{
                      background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                      fontFamily: 'JetBrains Mono', fontSize: 12, color: 'var(--text-secondary)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = 'var(--accent)'; (e.target as HTMLButtonElement).style.borderColor = 'var(--accent)'; }}
                    onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)'; (e.target as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
                  >{c}</button>
                ))}
                {hierarchy.siblingCodes.length > 8 && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
                    +{hierarchy.siblingCodes.length - 8} mã khác
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Mã con (subcodes) ──────────────────────────────────────────── */}
      {childRecords.length > 0 && (
        <div className="glass" style={{ padding: 20 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
            marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <ListTree size={13} />
            Mã con ({childRecords.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {childRecords.map(child => (
              <button
                key={child.maBenh}
                onClick={() => onNavigate?.(child.maBenh)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer', width: '100%',
                  textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--accent)'
                  el.style.background = 'rgba(91,138,245,0.06)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.borderColor = 'var(--border)'
                  el.style.background = 'var(--bg-overlay)'
                }}
              >
                {/* Code chip */}
                <span style={{
                  fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700,
                  color: 'var(--accent)', background: 'rgba(91,138,245,0.12)',
                  border: '1px solid rgba(91,138,245,0.25)', borderRadius: 5,
                  padding: '2px 8px', flexShrink: 0, minWidth: 56, textAlign: 'center',
                }}>
                  {child.maBenh}
                </span>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {child.tenTiengViet || '—'}
                  </div>
                  {child.tenTiengAnh && (
                    <div style={{
                      fontSize: 11, color: 'var(--text-muted)', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      fontStyle: 'italic',
                    }}>
                      {child.tenTiengAnh}
                    </div>
                  )}
                </div>

                <ChevronRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Condition flags */}
      <div className="glass" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Điều kiện sử dụng
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FlagRow flag={flags.khongDungLaBenhChinh} label="Không được dùng làm bệnh chính" type="error" />
          <FlagRow flag={flags.khongKhuyenKhichDungLaBenhChinh} label="Không khuyến khích dùng làm bệnh chính" type="warning" />
          <FlagRow flag={flags.khongSuDungViCoMaCuTheHon} label="Không dùng — có mã cụ thể hơn" type="warning" />
          <FlagRow flag={flags.chiSuDungMaHoaNguyenNhanTuVong} label="Chỉ dùng mã hóa nguyên nhân tử vong" type="error" />
          <FlagRow flag={flags.chiCoONuGioi} label="Chỉ áp dụng cho nữ giới" type="info" />
          <FlagRow flag={flags.chiCoONamGioi} label="Chỉ áp dụng cho nam giới" type="info" />
        </div>
      </div>

      {/* Coding guidance */}
      {rec.huongDanMaHoaTiengViet && (
        <div className="glass" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Hướng dẫn mã hóa (Tiếng Việt)
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {rec.huongDanMaHoaTiengViet}
          </div>
        </div>
      )}
    </div>
  )
}

function ClassRow({ label, value, sub, onNavigate }: { label: string; value: string; sub?: string; onNavigate?: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 120, paddingTop: 1 }}>{label}</div>
      <div style={{ flex: 1 }}>
        <div
          style={{ fontSize: 13, color: 'var(--text-primary)', cursor: onNavigate ? 'pointer' : 'default' }}
          onClick={onNavigate}
        >
          {sub && <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', marginRight: 6 }}>{sub}</span>}
          {value}
        </div>
      </div>
    </div>
  )
}

function BreadcrumbItem({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <span
      className="mono"
      onClick={onClick}
      style={{
        fontSize: 12, padding: '2px 8px', borderRadius: 5,
        background: active ? 'rgba(91,138,245,0.15)' : 'var(--bg-overlay)',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'rgba(91,138,245,0.3)' : 'var(--border)'}`,
        cursor: onClick ? 'pointer' : 'default',
        fontWeight: active ? 600 : 400,
      }}
    >{label}</span>
  )
}

function FlagRow({ flag, label, type }: { flag: boolean; label: string; type: 'error' | 'warning' | 'info' }) {
  const color = type === 'error' ? 'var(--error)' : type === 'warning' ? 'var(--warning)' : 'var(--info)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {flag
        ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--bg-overlay)', border: '1px solid var(--border)', flexShrink: 0 }} />
      }
      <span style={{ fontSize: 12, color: flag ? color : 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}
