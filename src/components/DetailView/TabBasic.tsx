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
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
        <div className="flex items-start gap-4 flex-wrap">
          <div>
            <div className="text-[11px] text-slate-400 mb-1">Mã bệnh</div>
            <span className={`font-mono font-bold text-xl rounded-lg px-4 py-1.5 border inline-flex items-center gap-1
              ${rec.codingSymbol === '†' ? 'text-amber-600 bg-amber-50 border-amber-200'
                : rec.codingSymbol === '*' ? 'text-violet-600 bg-violet-50 border-violet-200'
                : 'text-blue-600 bg-blue-50 border-blue-200'}`}>
              {rec.maBenh}
              {rec.codingSymbol && <span className="text-lg leading-none">{rec.codingSymbol}</span>}
            </span>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-[11px] text-slate-400 mb-1">Tên tiếng Việt</div>
            <div className="text-base font-semibold text-slate-800 leading-snug">{rec.tenTiengViet || '—'}</div>
          </div>
        </div>
        {rec.tenTiengAnh && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-400 mb-1">Tên tiếng Anh (WHO)</div>
            <div className="text-slate-500 italic">{rec.tenTiengAnh}</div>
          </div>
        )}
      </div>

      {/* Dual-coding section */}
      {rec.codingSymbol && (
        <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm border-l-[3px] ${rec.codingSymbol === '†' ? 'border-l-amber-500' : 'border-l-violet-500'}`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider mb-2.5 ${rec.codingSymbol === '†' ? 'text-amber-600' : 'text-violet-600'}`}>
            HỆ THỐNG MÃ KÉP (DUAL-CODING)
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-3 items-start">
              <span className="text-[11px] text-slate-400 min-w-[100px] shrink-0">Loại mã:</span>
              <span className={`text-xs font-semibold ${rec.codingSymbol === '†' ? 'text-amber-600' : 'text-violet-600'}`}>
                {rec.codingSymbol === '†'
                  ? '† Mã dấu găm (kiếm) — Nguyên nhân/bệnh sinh — Làm bệnh chính'
                  : '* Mã dấu sao — Biểu hiện bệnh — KHÔNG được làm bệnh chính'}
              </span>
            </div>
            {rec.companionCode && (
              <div className="flex gap-3 items-center">
                <span className="text-[11px] text-slate-400 min-w-[100px] shrink-0">
                  {rec.codingSymbol === '†' ? 'Ghi kèm mã (*):' : 'Mã nguyên nhân:'}
                </span>
                <button
                  onClick={() => onNavigate?.(rec.companionCode!)}
                  className={`inline-flex items-center gap-1 font-mono font-bold text-sm px-3 py-0.5 rounded border cursor-pointer transition-opacity hover:opacity-70
                    ${rec.codingSymbol === '†' ? 'text-violet-600 bg-violet-50 border-violet-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}
                >
                  {rec.companionCode}{rec.codingSymbol === '†' ? '*' : '†'}
                  <span className="text-[10px] ml-1">→ xem</span>
                </button>
              </div>
            )}
            <div className="text-[11px] text-slate-400 leading-relaxed pt-1.5 border-t border-slate-100 mt-0.5">
              {rec.codingSymbol === '†'
                ? 'ℹ️ Mã dấu găm (†) được ghi ở vị trí ĐẦU TIÊN trong hồ sơ. Bắt buộc ghi thêm mã biểu hiện (*) là bệnh kèm theo.'
                : 'ℹ️ Mã dấu sao (*) ghi ở vị trí THỨ HAI trong hồ sơ. Không được ghi làm bệnh chính — phải có mã (†) đứng trước.'}
            </div>
          </div>
        </div>
      )}

      {/* 2. Coding guidance */}
      {rec.huongDanMaHoaTiengViet && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Hướng dẫn mã hóa (Tiếng Việt)</div>
          <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{rec.huongDanMaHoaTiengViet}</div>
        </div>
      )}

      {/* 3. Classification */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
        <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Phân loại</div>
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
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">Breadcrumb</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <BreadcrumbItem label={rec.chuongStt} />
            <ChevronRight size={12} className="text-slate-300" />
            <BreadcrumbItem label={rec.khoiMa} onClick={onNavigate ? () => onNavigate(rec.khoiMa) : undefined} />
            {rec.nhomMa && rec.nhomMa !== rec.maBenh && (
              <>
                <ChevronRight size={12} className="text-slate-300" />
                <BreadcrumbItem label={rec.nhomMa} onClick={onNavigate ? () => onNavigate(rec.nhomMa) : undefined} />
              </>
            )}
            <ChevronRight size={12} className="text-slate-300" />
            <BreadcrumbItem label={rec.maBenh} active />
          </div>
          {siblingRecords.length > 0 && (
            <div className="mt-4">
              <div className="text-[11px] text-slate-400 mb-2">Mã cùng nhóm ({siblingRecords.length})</div>
              <div className="flex flex-col gap-1.5">
                {siblingRecords.map(sib => (
                  <button
                    key={sib.maBenh}
                    onClick={() => onNavigate?.(sib.maBenh)}
                    className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 cursor-pointer w-full text-left transition-all hover:border-blue-300 hover:bg-blue-50/50"
                    style={{ fontFamily: 'inherit' }}
                  >
                    <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-px shrink-0 min-w-[50px] text-center">{sib.maBenh}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 truncate">{sib.tenTiengViet || '—'}</div>
                      {sib.tenTiengAnh && <div className="text-[10px] text-slate-400 mt-px truncate italic">{sib.tenTiengAnh}</div>}
                    </div>
                    <ChevronRight size={12} className="text-slate-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Child codes */}
      {childRecords.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 mb-3.5 uppercase tracking-wide flex items-center gap-2">
            <ListTree size={13} />
            Mã con ({childRecords.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {childRecords.map(child => (
              <button
                key={child.maBenh}
                onClick={() => onNavigate?.(child.maBenh)}
                className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 cursor-pointer w-full text-left transition-all hover:border-blue-300 hover:bg-blue-50/50"
                style={{ fontFamily: 'inherit' }}
              >
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 shrink-0 min-w-[56px] text-center">{child.maBenh}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-700 truncate">{child.tenTiengViet || '—'}</div>
                  {child.tenTiengAnh && <div className="text-[11px] text-slate-400 mt-0.5 truncate italic">{child.tenTiengAnh}</div>}
                </div>
                <ChevronRight size={13} className="text-slate-300 shrink-0" />
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
      <div className="text-[11px] text-slate-400 min-w-[80px] md:min-w-[120px] pt-px shrink-0">{label}</div>
      <div className="flex-1">
        <div className={`text-sm text-slate-700 ${onNavigate ? 'cursor-pointer hover:text-blue-600' : ''}`} onClick={onNavigate}>
          {sub && <span className="font-mono text-[11px] text-blue-600 mr-1.5">{sub}</span>}
          {value}
        </div>
      </div>
    </div>
  )
}

function BreadcrumbItem({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
  return (
    <span
      className={`font-mono text-xs px-2 py-0.5 rounded border
        ${active ? 'bg-blue-50 text-blue-600 border-blue-200 font-semibold' : 'bg-slate-50 text-slate-500 border-slate-200'}
        ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
      onClick={onClick}
    >{label}</span>
  )
}
