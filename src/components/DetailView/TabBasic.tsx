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
    <div className="flex flex-col gap-4">

      {/* 1. Primary Info */}
      <div className="bg-surface border border-line rounded-xl p-4 md:p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div>
            <div className="text-[11px] text-fg-muted mb-1">Mã bệnh</div>
            <span className={`
              font-mono font-bold text-xl rounded-lg px-4 py-1.5 border inline-flex items-center gap-1
              ${rec.codingSymbol === '†'
                ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                : rec.codingSymbol === '*'
                ? 'text-purple-400 bg-purple-400/10 border-purple-400/30'
                : 'text-accent bg-accent/10 border-accent/20'
              }
            `}>
              {rec.maBenh}
              {rec.codingSymbol && <span className="text-lg leading-none">{rec.codingSymbol}</span>}
            </span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-[11px] text-fg-muted mb-1">Tên tiếng Việt</div>
            <div className="text-base font-semibold text-fg leading-snug">
              {rec.tenTiengViet || '—'}
            </div>
          </div>
        </div>
        {rec.tenTiengAnh && (
          <div className="mt-3 pt-3 border-t border-line">
            <div className="text-[11px] text-fg-muted mb-1">Tên tiếng Anh (WHO)</div>
            <div className="text-fg-secondary italic">{rec.tenTiengAnh}</div>
          </div>
        )}
      </div>

      {/* Dual-coding section */}
      {rec.codingSymbol && (
        <div className={`
          bg-surface border border-line rounded-xl p-4
          ${rec.codingSymbol === '†' ? 'border-l-[3px] border-l-amber-500' : 'border-l-[3px] border-l-purple-400'}
        `}>
          <div className={`
            text-[11px] font-bold uppercase tracking-wider mb-2.5
            ${rec.codingSymbol === '†' ? 'text-amber-500' : 'text-purple-400'}
          `}>
            HỆ THỐNG MÃ KÉP (DUAL-CODING)
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-start">
              <span className="text-[11px] text-fg-muted min-w-[100px] shrink-0">Loại mã:</span>
              <span className={`text-xs font-semibold ${rec.codingSymbol === '†' ? 'text-amber-500' : 'text-purple-400'}`}>
                {rec.codingSymbol === '†'
                  ? '† Mã dấu găm (kiếm) — Nguyên nhân/bệnh sinh — Làm bệnh chính'
                  : '* Mã dấu sao — Biểu hiện bệnh — KHÔNG được làm bệnh chính'}
              </span>
            </div>
            {rec.companionCode && (
              <div className="flex gap-3 items-center">
                <span className="text-[11px] text-fg-muted min-w-[100px] shrink-0">
                  {rec.codingSymbol === '†' ? 'Ghi kèm mã (*):' : 'Mã nguyên nhân:'}
                </span>
                <button
                  onClick={() => onNavigate?.(rec.companionCode!)}
                  className={`
                    inline-flex items-center gap-1 font-mono font-bold text-sm px-3 py-0.5
                    rounded border cursor-pointer transition-opacity hover:opacity-70
                    ${rec.codingSymbol === '†'
                      ? 'text-purple-400 bg-purple-400/10 border-purple-400/30'
                      : 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                    }
                  `}
                >
                  {rec.companionCode}{rec.codingSymbol === '†' ? '*' : '†'}
                  <span className="text-[10px] ml-1 font-[inherit]">→ xem</span>
                </button>
              </div>
            )}
            <div className="text-[11px] text-fg-muted leading-relaxed pt-1.5 border-t border-line mt-0.5">
              {rec.codingSymbol === '†'
                ? 'ℹ️ Mã dấu găm (†) được ghi ở vị trí ĐẦU TIÊN trong hồ sơ. Bắt buộc ghi thêm mã biểu hiện (*) là bệnh kèm theo.'
                : 'ℹ️ Mã dấu sao (*) ghi ở vị trí THỨ HAI trong hồ sơ. Không được ghi làm bệnh chính — phải có mã (†) đứng trước.'}
            </div>
          </div>
        </div>
      )}

      {/* 2. Coding guidance */}
      {rec.huongDanMaHoaTiengViet && (
        <div className="bg-surface border border-line rounded-xl p-4 md:p-5">
          <div className="text-xs font-semibold text-fg-secondary mb-3 uppercase tracking-wide">
            Hướng dẫn mã hóa (Tiếng Việt)
          </div>
          <div className="text-sm text-fg-secondary leading-relaxed whitespace-pre-wrap">
            {rec.huongDanMaHoaTiengViet}
          </div>
        </div>
      )}

      {/* 3. Classification */}
      <div className="bg-surface border border-line rounded-xl p-4 md:p-5">
        <div className="text-xs font-semibold text-fg-secondary mb-3 uppercase tracking-wide">
          Phân loại
        </div>
        <div className="flex flex-col gap-2.5">
          <ClassRow label="Chương" value={`${rec.chuongStt} — ${rec.chuongTenViet}`} sub={rec.chuongPhamViMa} />
          <ClassRow label="Khối" value={rec.khoiTenViet} sub={rec.khoiMa} onNavigate={onNavigate ? () => onNavigate(rec.khoiMa) : undefined} />
          {rec.nhomMa && rec.nhomMa !== rec.maBenh && (
            <ClassRow label="Nhóm 3 ký tự" value={rec.nhomTenViet} sub={rec.nhomMa} onNavigate={onNavigate ? () => onNavigate(rec.nhomMa) : undefined} />
          )}
        </div>
      </div>

      {/* 4. Hierarchy breadcrumb */}
      {hierarchy && (
        <div className="bg-surface border border-line rounded-xl p-4 md:p-5">
          <div className="text-xs font-semibold text-fg-secondary mb-3 uppercase tracking-wide">
            Breadcrumb
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <BreadcrumbItem label={rec.chuongStt} />
            <ChevronRight size={12} className="text-fg-muted" />
            <BreadcrumbItem label={rec.khoiMa} onClick={onNavigate ? () => onNavigate(rec.khoiMa) : undefined} />
            {rec.nhomMa && rec.nhomMa !== rec.maBenh && (
              <>
                <ChevronRight size={12} className="text-fg-muted" />
                <BreadcrumbItem label={rec.nhomMa} onClick={onNavigate ? () => onNavigate(rec.nhomMa) : undefined} />
              </>
            )}
            <ChevronRight size={12} className="text-fg-muted" />
            <BreadcrumbItem label={rec.maBenh} active />
          </div>

          {/* Siblings */}
          {siblingRecords.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] text-fg-muted mb-2">Mã cùng nhóm ({siblingRecords.length})</div>
              <div className="flex flex-col gap-1.5">
                {siblingRecords.map(sib => (
                  <button
                    key={sib.maBenh}
                    onClick={() => onNavigate?.(sib.maBenh)}
                    className="flex items-center gap-2.5 bg-dim border border-line rounded-lg px-3 py-2 cursor-pointer w-full text-left transition-all font-[inherit] hover:border-accent hover:bg-accent/5"
                  >
                    <span className="font-mono text-[11px] font-bold text-accent bg-accent/10 border border-accent/20 rounded px-1.5 py-px shrink-0 min-w-[50px] text-center">
                      {sib.maBenh}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-fg truncate">{sib.tenTiengViet || '—'}</div>
                      {sib.tenTiengAnh && (
                        <div className="text-[10px] text-fg-muted mt-px truncate italic">{sib.tenTiengAnh}</div>
                      )}
                    </div>
                    <ChevronRight size={12} className="text-fg-muted shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Child codes */}
      {childRecords.length > 0 && (
        <div className="bg-surface border border-line rounded-xl p-4 md:p-5">
          <div className="text-xs font-semibold text-fg-secondary mb-3.5 uppercase tracking-wide flex items-center gap-2">
            <ListTree size={13} />
            Mã con ({childRecords.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {childRecords.map(child => (
              <button
                key={child.maBenh}
                onClick={() => onNavigate?.(child.maBenh)}
                className="flex items-center gap-3 bg-dim border border-line rounded-lg px-3 py-2.5 cursor-pointer w-full text-left transition-all font-[inherit] hover:border-accent hover:bg-accent/5"
              >
                <span className="font-mono text-xs font-bold text-accent bg-accent/12 border border-accent/25 rounded px-2 py-0.5 shrink-0 min-w-[56px] text-center">
                  {child.maBenh}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-fg truncate">{child.tenTiengViet || '—'}</div>
                  {child.tenTiengAnh && (
                    <div className="text-[11px] text-fg-muted mt-0.5 truncate italic">{child.tenTiengAnh}</div>
                  )}
                </div>
                <ChevronRight size={13} className="text-fg-muted shrink-0" />
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
    <div className="flex gap-2.5 items-start">
      <div className="text-[11px] text-fg-muted min-w-[80px] md:min-w-[120px] pt-px shrink-0">{label}</div>
      <div className="flex-1">
        <div
          className={`text-sm text-fg ${onNavigate ? 'cursor-pointer' : ''}`}
          onClick={onNavigate}
        >
          {sub && <span className="font-mono text-[11px] text-accent mr-1.5">{sub}</span>}
          {value}
        </div>
      </div>
    </div>
  )
}

function BreadcrumbItem({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <span
      className={`
        font-mono text-xs px-2 py-0.5 rounded border
        ${active
          ? 'bg-accent/15 text-accent border-accent/30 font-semibold'
          : 'bg-dim text-fg-secondary border-line font-normal'
        }
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >{label}</span>
  )
}
