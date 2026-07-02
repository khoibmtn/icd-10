// src/App.tsx
import { useState, useEffect, useCallback } from 'react'
import { Search, Beaker, Database, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { SearchBar } from './components/SearchBar'
import { SearchResults } from './components/SearchResults'
import { DetailView } from './components/DetailView'
import { RulePlayground } from './components/RulePlayground'
import { seedDatabase, getRecord, getRulesForCode, getCodingRelations, getInfoRelations, getHierarchy, getChildRecords, getSiblingRecords } from './lib/db'
import { buildSearchIndex, search } from './lib/search'
import type { ICDRecord, ICDRule, CodingRelation, InformationalRelation, ICDHierarchy, ClinicalConcept } from './types/icd'

type AppView = 'search' | 'playground'

type InitStatus = 'loading' | 'ready' | 'error'

export default function App() {
  const [initStatus, setInitStatus] = useState<InitStatus>('loading')
  const [initMsg, setInitMsg] = useState('Đang khởi tạo...')
  const [activeView, setActiveView] = useState<AppView>('search')

  // Search state
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ICDRecord[]>([])
  const [hasStrongMatch, setHasStrongMatch] = useState(true)
  const [wholeWord, setWholeWord] = useState(false)
  const [rulesMap, setRulesMap] = useState<Map<string, ICDRule[]>>(new Map())

  // Detail state
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [detailRecord, setDetailRecord] = useState<ICDRecord | null>(null)
  const [detailRules, setDetailRules] = useState<ICDRule[]>([])
  const [detailCodingRels, setDetailCodingRels] = useState<CodingRelation[]>([])
  const [detailInfoRels, setDetailInfoRels] = useState<InformationalRelation[]>([])
  const [detailHierarchy, setDetailHierarchy] = useState<ICDHierarchy | undefined>()
  const [detailChildren, setDetailChildren] = useState<ICDRecord[]>([])
  const [detailSiblings, setDetailSiblings] = useState<ICDRecord[]>([])

  // Playground state
  const [allRules, setAllRules] = useState<ICDRule[]>([])
  const [allConcepts, setAllConcepts] = useState<ClinicalConcept[]>([])
  const [allCodingRels, setAllCodingRels] = useState<CodingRelation[]>([])

  // Init
  useEffect(() => {
    async function init() {
      try {
        setInitMsg('Đang tải 15.844 mã ICD-10...')
        await seedDatabase(setInitMsg)

        setInitMsg('Xây dựng chỉ mục tìm kiếm...')
        const searchData = await fetch('/build/search_index.json').then(r => r.json())
        await buildSearchIndex(searchData.data)

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

  // Search handler
  const handleSearch = useCallback(async (q: string, ww?: boolean) => {
    const useWholeWord = ww ?? wholeWord
    setQuery(q)
    if (!q) {
      setResults([])
      setRulesMap(new Map())
      setHasStrongMatch(true)
      return
    }
    setSearching(true)
    try {
      const { results: res, hasStrongMatch: strong } = await search(q, 30, useWholeWord)
      setResults(res)
      setHasStrongMatch(strong)
      const map = new Map<string, ICDRule[]>()
      await Promise.all(
        res.slice(0, 20).map(async r => {
          const rules = await getRulesForCode(r.maBenh)
          map.set(r.maBenh, rules)
        })
      )
      setRulesMap(map)
    } finally {
      setSearching(false)
    }
  }, [wholeWord])

  const handleToggleWholeWord = useCallback(() => {
    const next = !wholeWord
    setWholeWord(next)
    if (query) {
      handleSearch(query, next)
    }
  }, [wholeWord, query, handleSearch])

  // Select code (load detail)
  const handleSelectCode = useCallback(async (code: string) => {
    setSelectedCode(code)
    const [rec, rules, codingRels, infoRels, hier, children, siblings] = await Promise.all([
      getRecord(code),
      getRulesForCode(code),
      getCodingRelations(code),
      getInfoRelations(code),
      getHierarchy(code),
      getChildRecords(code),
      getSiblingRecords(code),
    ])
    if (rec) {
      setDetailRecord(rec)
      setDetailRules(rules)
      setDetailCodingRels(codingRels)
      setDetailInfoRels(infoRels)
      setDetailHierarchy(hier)
      setDetailChildren(children)
      setDetailSiblings(siblings)
    }
  }, [])

  const handleNavigate = useCallback((code: string) => {
    handleSelectCode(code)
    handleSearch(code)
  }, [handleSelectCode, handleSearch])

  // Loading screen
  if (initStatus === 'loading') {
    return (
      <div className="flex h-dvh items-center justify-center flex-col gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shadow-lg shadow-accent/30">
          <Database size={24} color="#fff" />
        </div>
        <div className="text-center">
          <div className="font-semibold text-base text-fg mb-1">ICD-10 Vietnam Explorer</div>
          <div className="text-fg-muted text-sm flex items-center gap-1.5 justify-center">
            <Loader2 size={14} className="anim-spin" />
            {initMsg}
          </div>
        </div>
      </div>
    )
  }

  if (initStatus === 'error') {
    return (
      <div className="flex h-dvh items-center justify-center flex-col gap-4">
        <AlertCircle size={32} className="text-danger" />
        <div className="text-center">
          <div className="font-semibold text-danger mb-1">Lỗi khởi tạo</div>
          <div className="text-fg-muted text-xs max-w-[400px]">{initMsg}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="h-[52px] shrink-0 bg-surface border-b border-line flex items-center px-4 md:px-5 gap-3">
        {/* Mobile: back button when detail is open */}
        {selectedCode && (
          <button
            onClick={() => setSelectedCode(null)}
            className="md:hidden flex items-center justify-center w-8 h-8 -ml-1 rounded-lg text-fg-muted hover:bg-elevated active:bg-dim transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center shrink-0">
            <Database size={14} color="#fff" />
          </div>
          <span className="font-bold text-sm text-fg hidden sm:inline">
            ICD-10 <span className="text-accent">VN</span>
          </span>
          <span className="text-[10px] px-1.5 py-px rounded bg-accent-soft text-accent font-semibold tracking-wide hidden sm:inline">
            PoC v0.1
          </span>
        </div>

        <div className="flex-1" />

        {/* Nav tabs */}
        <nav className="flex gap-1">
          <NavBtn active={activeView === 'search'} onClick={() => setActiveView('search')} Icon={Search} label="Explorer" />
          <NavBtn active={activeView === 'playground'} onClick={() => setActiveView('playground')} Icon={Beaker} label="Playground" />
        </nav>

        {/* Status */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-fg-muted">
          <CheckCircle size={12} className="text-ok" />
          Offline
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex relative">

        {activeView === 'search' ? (
          <>
            {/* Search panel — full on mobile, fixed width on desktop */}
            <div className={`
              w-full md:w-[360px] lg:w-[400px] md:max-w-[420px] md:min-w-[300px]
              ${selectedCode ? 'hidden md:flex' : 'flex'}
              flex-col md:border-r md:border-line
            `}>
              {/* Search bar */}
              <div className="p-3 md:p-4 border-b border-line">
                <SearchBar onSearch={handleSearch} loading={searching} wholeWord={wholeWord} onToggleWholeWord={handleToggleWholeWord} />
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto p-3">
                <SearchResults
                  results={results}
                  rules={rulesMap}
                  selectedCode={selectedCode}
                  onSelect={handleSelectCode}
                  query={query}
                  hasStrongMatch={hasStrongMatch}
                  onOpenPlayground={() => setActiveView('playground')}
                />
              </div>

              {/* Stats bar */}
              <div className="px-4 py-2 border-t border-line flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-fg-muted">
                <span>15.844 mã</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">5.856 quy tắc</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">10 khái niệm</span>
                <span>·</span>
                <span className="text-ok">100% offline</span>
              </div>
            </div>

            {/* Detail panel — overlay on mobile, side panel on desktop */}
            {selectedCode && detailRecord && (
              <div className="
                fixed inset-0 z-50 md:static md:z-auto
                md:flex-1 md:overflow-hidden
                anim-slide-right md:[animation:none]
                bg-surface
              ">
                <DetailView
                  record={detailRecord}
                  rules={detailRules}
                  codingRelations={detailCodingRels}
                  infoRelations={detailInfoRels}
                  hierarchy={detailHierarchy}
                  childRecords={detailChildren}
                  siblingRecords={detailSiblings}
                  onClose={() => setSelectedCode(null)}
                  onNavigate={handleNavigate}
                />
              </div>
            )}
          </>
        ) : (
          /* Playground view */
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 max-w-3xl mx-auto w-full">
            <RulePlayground
              rules={allRules}
              concepts={allConcepts}
              codingRelations={allCodingRels}
              onNavigate={(code) => { setActiveView('search'); handleSelectCode(code); handleSearch(code); }}
            />
          </div>
        )}
      </main>
    </div>
  )
}

function NavBtn({ active, onClick, Icon, label }: {
  active: boolean; onClick: () => void; Icon: React.ElementType; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-none text-xs font-medium
        cursor-pointer transition-all duration-150 font-[inherit]
        ${active
          ? 'bg-accent-soft text-accent font-semibold shadow-[0_0_0_1px_rgba(59,109,232,0.25)]'
          : 'bg-transparent text-fg-muted hover:bg-elevated hover:text-fg'
        }
      `}
    >
      <Icon size={13} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
