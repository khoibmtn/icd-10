// src/components/DetailView/TabBasic.tsx
import { ChevronRight, ListTree, AlertTriangle, XCircle, ShieldAlert } from 'lucide-react'
import type { ICDRecord, ICDRule } from '../../types/icd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// Important rule types that should display in basic tab
const IMPORTANT_RULES: Record<string, { label: string; severity: 'error' | 'warning'; icon: 'x' | '!' | 'shield' }> = {
  khongDungLaBenhChinh:              { label: 'MÃ KHÔNG ĐƯỢC DÙNG LÀ BỆNH CHÍNH', severity: 'error', icon: 'x' },
  khongKhuyenKhichDungLaBenhChinh:   { label: 'MÃ KHÔNG KHUYẾN KHÍCH DÙNG LÀ BỆNH CHÍNH', severity: 'warning', icon: '!' },
  khongSuDungViCoMaCuTheHon:         { label: 'KHÔNG SỬ DỤNG VÌ CÓ MÃ 4 HOẶC 5 KÝ TỰ CỤ THỂ HƠN', severity: 'warning', icon: '!' },
  chiSuDungMaHoaNguyenNhanTuVong:    { label: 'CHỈ SỬ DỤNG MÃ HÓA NGUYÊN NHÂN TỬ VONG', severity: 'error', icon: 'shield' },
  chiCoONuGioi:                       { label: 'MÃ BỆNH CHỈ CÓ HOẶC CHỦ YẾU CÓ Ở NỮ GIỚI', severity: 'warning', icon: '!' },
  chiCoONamGioi:                      { label: 'MÃ BỆNH CHỈ CÓ HOẶC CHỦ YẾU CÓ Ở NAM GIỚI', severity: 'warning', icon: '!' },
  maDauSaoKhongLaBenhChinh:          { label: 'MÃ DẤU SAO (*) — KHÔNG DÙNG LÀM BỆNH CHÍNH', severity: 'error', icon: 'x' },
}

interface TabBasicProps {
  record: ICDRecord
  rules?: ICDRule[]
  childRecords?: ICDRecord[]
  siblingRecords?: ICDRecord[]
  onNavigate?: (code: string) => void
}

export function TabBasic({ record: rec, rules = [], childRecords = [], siblingRecords = [], onNavigate }: TabBasicProps) {
  const sym = rec.codingSymbol
  const variant = sym === '†' ? 'outline' : sym === '*' ? 'secondary' : 'default'
  const extraCls = sym === '†' ? 'border-amber-200 text-amber-700 bg-amber-50'
    : sym === '*' ? 'border-violet-200 text-violet-700 bg-violet-50'
    : 'bg-primary/10 text-primary border-primary/20'

  // Extract important rules for this code
  const importantFlags = rules.reduce<Array<{ label: string; severity: 'error' | 'warning'; icon: string }>>((acc, r) => {
    const info = IMPORTANT_RULES[r.ruleType]
    if (info && !acc.some(a => a.label === info.label)) acc.push(info)
    return acc
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Primary Info + Rule Flags */}
      <Card className="p-4 md:p-5 shadow-sm border-border bg-card">
        <div className="flex items-start gap-4 flex-wrap">
          <div>
            <div className="text-[11px] text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Mã bệnh</div>
            <Badge variant={variant as any} className={`px-4 py-1 font-mono font-bold text-xl rounded-lg border ${extraCls}`}>
              {rec.maBenh}
              {rec.codingSymbol && <span className="text-lg leading-none ml-1 opacity-80">{rec.codingSymbol}</span>}
            </Badge>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="text-[11px] text-muted-foreground font-medium mb-1.5 uppercase tracking-wider">Tên tiếng Việt</div>
            <div className="text-base font-semibold text-foreground leading-snug">{rec.tenTiengViet || '—'}</div>
          </div>
        </div>
        {/* Important rule flags - displayed prominently below disease name */}
        {importantFlags.length > 0 && (
          <div className="mt-4 flex flex-col gap-1.5">
            {importantFlags.map((flag, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold ${
                  flag.severity === 'error'
                    ? 'bg-destructive/10 text-destructive border border-destructive/20'
                    : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                }`}
              >
                {flag.icon === 'x' ? <XCircle size={14} className="shrink-0" />
                  : flag.icon === 'shield' ? <ShieldAlert size={14} className="shrink-0" />
                  : <AlertTriangle size={14} className="shrink-0" />}
                {flag.label}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Dual-coding section */}
      {rec.codingSymbol && (
        <Card className={`p-4 shadow-sm border-l-[3px] bg-card ${rec.codingSymbol === '†' ? 'border-l-amber-500' : 'border-l-violet-500'}`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${rec.codingSymbol === '†' ? 'text-amber-600' : 'text-violet-600'}`}>
            HỆ THỐNG MÃ KÉP (DUAL-CODING)
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-start">
              <span className="text-xs text-muted-foreground font-medium min-w-[100px] shrink-0">Loại mã:</span>
              <span className={`text-xs font-semibold ${rec.codingSymbol === '†' ? 'text-amber-600' : 'text-violet-600'}`}>
                {rec.codingSymbol === '†'
                  ? '† Mã dấu găm (kiếm) — Nguyên nhân/bệnh sinh — Làm bệnh chính'
                  : '* Mã dấu sao — Biểu hiện bệnh — KHÔNG được làm bệnh chính'}
              </span>
            </div>
            {rec.companionCode && (
              <div className="flex gap-3 items-center">
                <span className="text-xs text-muted-foreground font-medium min-w-[100px] shrink-0">
                  {rec.codingSymbol === '†' ? 'Ghi kèm mã (*):' : 'Mã nguyên nhân:'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate?.(rec.companionCode!)}
                  className={`h-7 px-3 text-xs font-mono font-bold transition-opacity
                    ${rec.codingSymbol === '†' ? 'text-violet-700 bg-violet-50 border-violet-200 hover:bg-violet-100' : 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100'}`}
                >
                  {rec.companionCode}{rec.codingSymbol === '†' ? '*' : '†'}
                  <span className="text-[10px] ml-1 font-sans font-medium text-muted-foreground">→ xem</span>
                </Button>
              </div>
            )}
            <div className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border mt-1">
              {rec.codingSymbol === '†'
                ? 'ℹ️ Mã dấu găm (†) được ghi ở vị trí ĐẦU TIÊN trong hồ sơ. Bắt buộc ghi thêm mã biểu hiện (*) là bệnh kèm theo.'
                : 'ℹ️ Mã dấu sao (*) ghi ở vị trí THỨ HAI trong hồ sơ. Không được ghi làm bệnh chính — phải có mã (†) đứng trước.'}
            </div>
          </div>
        </Card>
      )}

      {/* 2. Coding guidance */}
      {rec.huongDanMaHoaTiengViet && (
        <Card className="p-4 md:p-5 shadow-sm bg-card border-border">
          <div className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Hướng dẫn mã hóa (Tiếng Việt)</div>
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{rec.huongDanMaHoaTiengViet}</div>
        </Card>
      )}


      {/* 5. Sibling codes */}
      {siblingRecords.length > 0 && (
        <Card className="p-4 md:p-5 shadow-sm bg-card border-border">
          <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Mã cùng nhóm ({siblingRecords.length})
          </div>
          <div className="flex flex-col gap-0.5">
            {siblingRecords.map(sib => (
              <div
                key={sib.maBenh}
                onClick={() => onNavigate?.(sib.maBenh)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors hover:bg-primary/5 group"
              >
                <span className="font-mono text-xs font-bold text-primary shrink-0 w-[52px]">{sib.maBenh}</span>
                <span className="text-sm text-foreground truncate">{sib.tenTiengViet || '—'}</span>
                <ChevronRight size={14} className="text-muted-foreground/30 shrink-0 ml-auto group-hover:text-primary/50" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6. Child codes */}
      {childRecords.length > 0 && (
        <Card className="p-4 md:p-5 shadow-sm bg-card border-border">
          <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
            <ListTree size={14} />
            Mã con ({childRecords.length})
          </div>
          <div className="flex flex-col gap-0.5">
            {childRecords.map(child => (
              <div
                key={child.maBenh}
                onClick={() => onNavigate?.(child.maBenh)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors hover:bg-primary/5 group"
              >
                <span className="font-mono text-xs font-bold text-primary shrink-0 w-[52px]">{child.maBenh}</span>
                <span className="text-sm text-foreground truncate">{child.tenTiengViet || '—'}</span>
                <ChevronRight size={14} className="text-muted-foreground/30 shrink-0 ml-auto group-hover:text-primary/50" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
