// src/App.tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Database, Loader2, AlertCircle, ArrowLeft, ListTree, Filter } from 'lucide-react'
import { SearchBar } from './components/SearchBar'
import { SearchResults } from './components/SearchResults'
import { DetailView } from './components/DetailView'
import { RulePlayground } from './components/RulePlayground'
import { TreeView } from './components/TreeView'
import { seedDatabase, getRecord, getRulesForCode, getChildRecords, getSiblingRecords } from './lib/db'
import { buildSearchIndex, search } from './lib/search'
import { buildTree } from './lib/tree'
import type { ICDRecord, ICDRule, CodingRelation, ClinicalConcept } from './types/icd'
import { Button } from '@/components/ui/button'


type AppView = 'search' | 'playground'
type LeftTab = 'search' | 'tree'
type InitStatus = 'loading' | 'ready' | 'error'

// Tree filter definitions
const TREE_FILTERS = [
  { id: 'khongDungBenhChinh', label: 'Không dùng làm bệnh chính', pred: (r: ICDRecord) => r.dieuKienSuDung.khongDungLaBenhChinh },
  { id: 'khongKhuyenKhich', label: 'Không khuyến khích bệnh chính', pred: (r: ICDRecord) => r.dieuKienSuDung.khongKhuyenKhichDungLaBenhChinh },
  { id: 'coMaCuTheHon', label: 'Có mã cụ thể hơn', pred: (r: ICDRecord) => r.dieuKienSuDung.khongSuDungViCoMaCuTheHon },
  { id: 'tuVong', label: 'Mã tử vong', pred: (r: ICDRecord) => r.dieuKienSuDung.chiSuDungMaHoaNguyenNhanTuVong },
  { id: 'dagger', label: 'Mã kiếm (†)', pred: (r: ICDRecord) => r.codingSymbol === '\u2020' },
  { id: 'asterisk', label: 'Mã sao (*)', pred: (r: ICDRecord) => r.codingSymbol === '*' },
  { id: 'namGioi', label: 'Mã nam giới', pred: (r: ICDRecord) => r.dieuKienSuDung.chiCoONamGioi },
  { id: 'nuGioi', label: 'Mã nữ giới', pred: (r: ICDRecord) => r.dieuKienSuDung.chiCoONuGioi },
  { id: 'nguyenNhanNgoai', label: 'Nguyên nhân ngoại (Ch.XX)', pred: (r: ICDRecord) => r.chuongStt === 'XX' },
  { id: 'diChung', label: 'Di chứng', pred: (r: ICDRecord) => r.tenTiengViet.toLowerCase().includes('di chứng') },
  { id: 'taiKham', label: 'Tái khám / theo dõi', pred: (r: ICDRecord) => r.tenTiengViet.toLowerCase().includes('tái khám') || r.maBenh.startsWith('Z09') },
] as const

export default function App() {
  const [initStatus, setInitStatus] = useState<InitStatus>('loading')
  const [initMsg, setInitMsg] = useState('Đang khởi tạo...')
  const [activeView, setActiveView] = useState<AppView>('search')
  const [leftTab, setLeftTab] = useState<LeftTab>('search')

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ICDRecord[]>([])
  const [hasStrongMatch, setHasStrongMatch] = useState(true)
  const [wholeWord, setWholeWord] = useState(true)
  const [rulesMap, setRulesMap] = useState<Map<string, ICDRule[]>>(new Map())

  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [detailRecord, setDetailRecord] = useState<ICDRecord | null>(null)
  const [detailRules, setDetailRules] = useState<ICDRule[]>([])

  const [detailChildren, setDetailChildren] = useState<ICDRecord[]>([])
  const [detailSiblings, setDetailSiblings] = useState<ICDRecord[]>([])

  const [allRules, setAllRules] = useState<ICDRule[]>([])
  const [allConcepts, setAllConcepts] = useState<ClinicalConcept[]>([])
  const [allCodingRels, setAllCodingRels] = useState<CodingRelation[]>([])
  const [allRecords, setAllRecords] = useState<ICDRecord[]>([])

  // Tree state
  const [treeExpandTarget, setTreeExpandTarget] = useState<string | null>(null)
  const [treeFilter, setTreeFilter] = useState<string>('all')

  // Build tree from records, filtered if needed
  const tree = useMemo(() => {
    if (allRecords.length === 0) return []
    if (treeFilter === 'all') return buildTree(allRecords)
    const filterDef = TREE_FILTERS.find(f => f.id === treeFilter)
    if (!filterDef) return buildTree(allRecords)
    const filtered = allRecords.filter(filterDef.pred)
    return buildTree(filtered)
  }, [allRecords, treeFilter])

  useEffect(() => {
    async function init() {
      try {
        setInitMsg('Đang tải 15.844 mã ICD-10...')
        await seedDatabase(setInitMsg)
        setInitMsg('Xây dựng chỉ mục tìm kiếm...')
        const searchData = await fetch('/build/search_index.json').then(r => r.json())
        await buildSearchIndex(searchData.data)
        setAllRecords(searchData.data) // store for tree building
        const [rulesData, conceptsData, codingData] = await Promise.all([
          fetch('/build/rules.json').then(r => r.json()),
          fetch('/build/concepts.json').then(r => r.json()),
          fetch('/build/coding_relations.json').then(r => r.json()),
        ])
        setAllRules(rulesData.data)
        setAllConcepts(conceptsData.data)
        setAllCodingRels(codingData.data)
        setInitStatus('ready')
      } catch (err) {
        console.error('Init error:', err)
        setInitStatus('error')
        setInitMsg(String(err))
      }
    }
    init()
  }, [])

  const handleSearch = useCallback(async (q: string, ww?: boolean) => {
    const useWholeWord = ww ?? wholeWord
    setQuery(q)
    if (!q) { setResults([]); setRulesMap(new Map()); setHasStrongMatch(true); return }
    setSearching(true)
    try {
      const { results: res, hasStrongMatch: strong } = await search(q, 30, useWholeWord)
      setResults(res)
      setHasStrongMatch(strong)
      const map = new Map<string, ICDRule[]>()
      await Promise.all(res.slice(0, 20).map(async r => {
        const rules = await getRulesForCode(r.maBenh)
        map.set(r.maBenh, rules)
      }))
      setRulesMap(map)
    } finally { setSearching(false) }
  }, [wholeWord])

  const handleToggleWholeWord = useCallback(() => {
    const next = !wholeWord
    setWholeWord(next)
    if (query) handleSearch(query, next)
  }, [wholeWord, query, handleSearch])

  const handleSelectCode = useCallback(async (code: string) => {
    setSelectedCode(code)
    // Always expand tree to this code (even if search tab is active)
    setTreeFilter('all')  // reset to full tree so the code is always visible
    setTreeExpandTarget(code)
    const [rec, rules, children, siblings] = await Promise.all([
      getRecord(code), getRulesForCode(code), getChildRecords(code), getSiblingRecords(code),
    ])
    if (rec) {
      setDetailRecord(rec); setDetailRules(rules)
      setDetailChildren(children); setDetailSiblings(siblings)
    }
  }, [])

  // Navigate from detail panel: switch left to tree, auto-expand
  const handleNavigate = useCallback((code: string) => {
    handleSelectCode(code)
    // Switch left panel to tree and expand to the code
    setLeftTab('tree')
    setTreeExpandTarget(code)
  }, [handleSelectCode])

  const handleTreeSelect = useCallback((code: string) => {
    handleSelectCode(code)
  }, [handleSelectCode])

  const handleExpandHandled = useCallback(() => {
    setTreeExpandTarget(null)
  }, [])

  if (initStatus === 'loading') {
    return (
      <div className="flex h-dvh items-center justify-center flex-col gap-4 bg-background">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
          <Database size={24} color="#fff" />
        </div>
        <div className="text-center">
          <div className="font-semibold text-base text-foreground mb-0.5">Phòng KHNV - Trung tâm Y tế Thủy Nguyên</div>
          <div className="text-sm text-muted-foreground mb-3">Ứng dụng tra cứu mã ICD-10 theo Thông tư 06/2026/TT-BYT</div>
          <div className="text-muted-foreground text-sm flex items-center gap-2 justify-center">
            <Loader2 size={16} className="animate-spin" />
            {initMsg}
          </div>
        </div>
      </div>
    )
  }

  if (initStatus === 'error') {
    return (
      <div className="flex h-dvh items-center justify-center flex-col gap-4 bg-background">
        <AlertCircle size={32} className="text-destructive" />
        <div className="text-center">
          <div className="font-semibold text-destructive mb-1">Lỗi khởi tạo</div>
          <div className="text-muted-foreground text-sm max-w-[400px]">{initMsg}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* ── Header ── */}
      <header className="h-14 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border flex items-center px-4 md:px-6 gap-4 sticky top-0 z-50">
        {selectedCode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedCode(null)}
            className="md:hidden -ml-2"
          >
            <ArrowLeft size={18} />
          </Button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
            <Database size={16} className="text-primary-foreground" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-sm text-foreground tracking-tight leading-tight">
              Tra cứu ICD-10 <span className="text-primary">theo TT 06/2026/TT-BYT</span>
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight">
              Phòng KHNV TTYT Thủy Nguyên
            </span>
          </div>
        </div>
        <div className="flex-1" />
        {/* Playground nav disabled — uncomment to re-enable
        <nav className="flex gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/50">
          <Button 
            variant={activeView === 'search' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveView('search')}
            className={`h-7 px-3 text-xs ${activeView !== 'search' && 'text-muted-foreground hover:text-foreground'}`}
          >
            <Search size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Explorer</span>
          </Button>
          <Button 
            variant={activeView === 'playground' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveView('playground')}
            className={`h-7 px-3 text-xs ${activeView !== 'playground' && 'text-muted-foreground hover:text-foreground'}`}
          >
            <Beaker size={14} className="mr-1.5" />
            <span className="hidden sm:inline">Playground</span>
          </Button>
        </nav>
        */}

      </header>

      {/* ── Main ── */}
      <main className="flex-1 overflow-hidden flex relative bg-muted/20">
        {activeView === 'search' ? (
          <>
            {/* Left panel with tabs */}
            <div className={`
              w-full md:w-[380px] lg:w-[420px] shrink-0
              ${selectedCode ? 'hidden md:flex' : 'flex'}
              flex-col md:border-r md:border-border bg-background shadow-sm z-10
            `}>
              {/* Left panel tab switcher */}
              <div className="flex border-b border-border bg-muted/30">
                <button
                  onClick={() => setLeftTab('search')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer bg-transparent
                    ${leftTab === 'search'
                      ? 'border-primary text-primary bg-background'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  <Search size={14} />
                  Tìm kiếm
                </button>
                <button
                  onClick={() => setLeftTab('tree')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer bg-transparent
                    ${leftTab === 'tree'
                      ? 'border-primary text-primary bg-background'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  <ListTree size={14} />
                  DM đầy đủ
                </button>
              </div>

              {/* Left panel content */}
              {leftTab === 'search' ? (
                <>
                  <div className="p-4 border-b border-border bg-background">
                    <SearchBar onSearch={handleSearch} loading={searching} wholeWord={wholeWord} onToggleWholeWord={handleToggleWholeWord} />
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    <SearchResults results={results} rules={rulesMap} selectedCode={selectedCode} onSelect={handleSelectCode} query={query} hasStrongMatch={hasStrongMatch} onOpenPlayground={() => setActiveView('playground')} />
                  </div>
                </>
              ) : (
                <>
                  {/* Filter bar */}
                  <div className="px-3 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2">
                    <button
                      onClick={() => setTreeFilter('all')}
                      className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-colors cursor-pointer border
                        ${treeFilter === 'all'
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground'
                        }`}
                    >
                      Tất cả
                    </button>
                    <div className="relative flex-1">
                      <Filter size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <select
                        value={treeFilter === 'all' ? '' : treeFilter}
                        onChange={e => setTreeFilter(e.target.value || 'all')}
                        className={`w-full pl-7 pr-3 py-1.5 text-[11px] font-medium rounded-md border appearance-none cursor-pointer transition-colors bg-background
                          ${treeFilter !== 'all'
                            ? 'border-primary text-primary bg-primary/5 font-semibold'
                            : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                          }`}
                      >
                        <option value="">Tùy chọn lọc...</option>
                        {TREE_FILTERS.map(f => (
                          <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Filtered count */}
                  {treeFilter !== 'all' && (
                    <div className="px-3 py-1.5 text-[10px] text-muted-foreground bg-primary/5 border-b border-primary/10 font-medium">
                      Đang lọc: <span className="text-primary font-bold">{TREE_FILTERS.find(f => f.id === treeFilter)?.label}</span>
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto p-2">
                    {tree.length > 0 ? (
                      <TreeView
                        tree={tree}
                        selectedCode={selectedCode}
                        expandTarget={treeExpandTarget}
                        onSelect={handleTreeSelect}
                        onExpandHandled={handleExpandHandled}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        {treeFilter !== 'all' ? 'Không có mã phù hợp' : 'Đang xây dựng cây...'}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="px-4 py-3 border-t border-border bg-muted/30 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                <span>15.844 mã</span>
                <span>· 5.856 quy tắc</span>
              </div>
            </div>
            {/* Detail panel */}
            {selectedCode && detailRecord && (
              <div className="fixed inset-0 z-50 md:static md:z-auto md:flex-1 md:overflow-hidden anim-slide-right md:[animation:none] bg-background">
                <DetailView record={detailRecord} rules={detailRules} childRecords={detailChildren} siblingRecords={detailSiblings} onClose={() => setSelectedCode(null)} onNavigate={handleNavigate} />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8 max-w-4xl mx-auto w-full">
            <RulePlayground rules={allRules} concepts={allConcepts} codingRelations={allCodingRels} onNavigate={(code) => { setActiveView('search'); handleSelectCode(code); handleSearch(code) }} />
          </div>
        )}
      </main>
    </div>
  )
}
