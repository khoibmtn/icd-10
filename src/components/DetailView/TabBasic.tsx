// src/components/DetailView/TabBasic.tsx
import { ChevronRight, ListTree } from 'lucide-react'
import type { ICDRecord, ICDHierarchy } from '../../types/icd'

interface TabBasicProps {
  record: ICDRecord
  hierarchy?: ICDHierarchy
  childRecords?: ICDRecord[]
  siblingRecords?: ICDRecord[]
  onNavigate?: (code: string) => void
}

export function TabBasic({ record: rec, hierarchy, childRecords = [], siblingRecords = [], onNavigate }: TabBasicProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* 1. Primary Info */}
      <div className="glass" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Mã bệnh</div>
            <span style={{
              fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 20,
              borderRadius: 7, padding: '6px 16px',
              border: '1px solid', display: 'inline-flex', alignItems: 'center', gap: 3,
              ...(rec.codingSymbol === '†'
                ? { color: '#f59e0b', background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)' }
                : rec.codingSymbol === '*'
                ? { color: '#a78bfa', background: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.3)' }
                : { color: 'var(--accent)', background: 'rgba(91,138,245,0.1)', borderColor: 'rgba(91,138,245,0.2)' }
              ),
            }}>
              {rec.maBenh}
              {rec.codingSymbol && (
                <span style={{ fontSize: 18, lineHeight: 1 }}>{rec.codingSymbol}</span>
              )}
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

      {/* Dual-coding (Mã kép) section */}
      {rec.codingSymbol && (
        <div className="glass" style={{
          padding: 16,
          borderLeft: `3px solid ${rec.codingSymbol === '†' ? '#f59e0b' : '#a78bfa'}`,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: rec.codingSymbol === '†' ? '#f59e0b' : '#a78bfa',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
          }}>
            HỆ THỐNG MÃ KÉP (DUAL-CODING)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 100, flexShrink: 0 }}>Loại mã:</span>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: rec.codingSymbol === '†' ? '#f59e0b' : '#a78bfa',
              }}>
                {rec.codingSymbol === '†'
                  ? '† Mã dấu găm (kiếm) — Nguyên nhân/bệnh sinh — Làm bệnh chính'
                  : '* Mã dấu sao — Biểu hiện bệnh — KHÔNG được làm bệnh chính'}
              </span>
            </div>
            {rec.companionCode && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 100, flexShrink: 0 }}>
                  {rec.codingSymbol === '†' ? 'Ghi kèm mã (*):' : 'Mã nguyên nhân:'}
                </span>
                <button
                  onClick={() => onNavigate?.(rec.companionCode!)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 13,
                    padding: '3px 12px', borderRadius: 5, cursor: 'pointer',
                    border: '1px solid', transition: 'opacity 0.15s',
                    ...(rec.codingSymbol === '†'
                      ? { color: '#a78bfa', background: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.3)' }
                      : { color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' }
                    ),
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {rec.companionCode}{rec.codingSymbol === '†' ? '*' : '†'}
                  <span style={{ fontSize: 10, marginLeft: 4, fontFamily: 'inherit' }}>→ xem</span>
                </button>
              </div>
            )}
            <div style={{
              fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6,
              paddingTop: 6, borderTop: '1px solid var(--border)', marginTop: 2,
            }}>
              {rec.codingSymbol === '†'
                ? 'ℹ️ Mã dấu găm (†) được ghi ở vị trí ĐẦU TIÊN trong hồ sơ. Bắt buộc ghi thêm mã biểu hiện (*) là bệnh kèm theo.'
                : 'ℹ️ Mã dấu sao (*) ghi ở vị trí THỨ HAI trong hồ sơ. Không được ghi làm bệnh chính — phải có mã (†) đứng trước.'}
            </div>
          </div>
        </div>
      )}

      {/* 2. Hướng dẫn mã hóa — now BEFORE Phân loại */}
      {rec.huongDanMaHoaTiengViet && (
        <div className="glass" style={{ padding: 20 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
            marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Hướng dẫn mã hóa (Tiếng Việt)
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {rec.huongDanMaHoaTiengViet}
          </div>
        </div>
      )}

      {/* 3. Classification */}
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

      {/* 4. Hierarchy breadcrumb */}
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

          {/* Siblings as rich list */}
          {siblingRecords.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Mã cùng nhóm ({siblingRecords.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {siblingRecords.map(sib => (
                  <button
                    key={sib.maBenh}
                    onClick={() => onNavigate?.(sib.maBenh)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: 'var(--bg-overlay)', border: '1px solid var(--border)',
                      borderRadius: 7, padding: '8px 12px', cursor: 'pointer', width: '100%',
                      textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent)'
                      e.currentTarget.style.background = 'rgba(91,138,245,0.06)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.background = 'var(--bg-overlay)'
                    }}
                  >
                    <span style={{
                      fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 700,
                      color: 'var(--accent)', background: 'rgba(91,138,245,0.1)',
                      border: '1px solid rgba(91,138,245,0.2)', borderRadius: 4,
                      padding: '1px 7px', flexShrink: 0, minWidth: 50, textAlign: 'center',
                    }}>
                      {sib.maBenh}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 500, color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {sib.tenTiengViet || '—'}
                      </div>
                      {sib.tenTiengAnh && (
                        <div style={{
                          fontSize: 10, color: 'var(--text-muted)', marginTop: 1,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontStyle: 'italic',
                        }}>
                          {sib.tenTiengAnh}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Mã con (subcodes) */}
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
                <span style={{
                  fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700,
                  color: 'var(--accent)', background: 'rgba(91,138,245,0.12)',
                  border: '1px solid rgba(91,138,245,0.25)', borderRadius: 5,
                  padding: '2px 8px', flexShrink: 0, minWidth: 56, textAlign: 'center',
                }}>
                  {child.maBenh}
                </span>
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
