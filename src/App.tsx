// src/App.tsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Beaker, LayoutGrid, Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { SearchBar } from './components/SearchBar'
import { SearchResults } from './components/SearchResults'
import { DetailView } from './components/DetailView'
import { RulePlayground } from './components/RulePlayground'
import { seedDatabase, getRecord, getRulesForCode, getCodingRelations, getInfoRelations, getHierarchy, getAllConcepts } from './lib/db'
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
  const [rulesMap, setRulesMap] = useState<Map<string, ICDRule[]>>(new Map())

  // Detail state
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [detailRecord, setDetailRecord] = useState<ICDRecord | null>(null)
  const [detailRules, setDetailRules] = useState<ICDRule[]>([])
  const [detailCodingRels, setDetailCodingRels] = useState<CodingRelation[]>([])
  const [detailInfoRels, setDetailInfoRels] = useState<InformationalRelation[]>([])
  const [detailHierarchy, setDetailHierarchy] = useState<ICDHierarchy | undefined>()

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

        // Pre-load rules + concepts for playground
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
  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (!q) {
      setResults([])
      setRulesMap(new Map())
      setHasStrongMatch(true)
      return
    }
    setSearching(true)
    try {
      const { results: res, hasStrongMatch: strong } = await search(q, 30)
      setResults(res)
      setHasStrongMatch(strong)
      // Load rules for results (for badges)
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
  }, [])

  // Select code (load detail)
  const handleSelectCode = useCallback(async (code: string) => {
    setSelectedCode(code)
    const [rec, rules, codingRels, infoRels, hier] = await Promise.all([
      getRecord(code),
      getRulesForCode(code),
      getCodingRelations(code),
      getInfoRelations(code),
      getHierarchy(code),
    ])
    if (rec) {
      setDetailRecord(rec)
      setDetailRules(rules)
      setDetailCodingRels(codingRels)
      setDetailInfoRels(infoRels)
      setDetailHierarchy(hier)
    }
  }, [])

  // Navigate to another code from detail view
  const handleNavigate = useCallback((code: string) => {
    handleSelectCode(code)
    // Also search for the code
    handleSearch(code)
  }, [handleSelectCode, handleSearch])

  // Loading screen
  if (initStatus === 'loading') {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #5b8af5, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(91,138,245,0.3)',
        }}>
          <Database size={24} color="#fff" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>
            ICD-10 Vietnam Explorer
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            {initMsg}
          </div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (initStatus === 'error') {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <AlertCircle size={32} style={{ color: 'var(--error)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--error)', marginBottom: 6 }}>Lỗi khởi tạo</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: 400 }}>{initMsg}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top Nav */}
      <header style={{
        height: 52, flexShrink: 0,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #5b8af5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Database size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
            ICD-10 <span style={{ color: 'var(--accent)' }}>VN</span>
          </span>
          <span style={{
            fontSize: 10, padding: '1px 6px', borderRadius: 4,
            background: 'rgba(91,138,245,0.15)', color: 'var(--accent)',
            fontWeight: 600, letterSpacing: '0.04em',
          }}>PoC v0.1</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Nav tabs */}
        <nav style={{ display: 'flex', gap: 4 }}>
          <NavBtn active={activeView === 'search'} onClick={() => setActiveView('search')} Icon={Search} label="Explorer" />
          <NavBtn active={activeView === 'playground'} onClick={() => setActiveView('playground')} Icon={Beaker} label="Playground" />
        </nav>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          <CheckCircle size={12} style={{ color: 'var(--success)' }} />
          Offline Ready
        </div>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {activeView === 'search' ? (
          <>
            {/* Left: search panel */}
            <div style={{
              width: selectedCode ? 360 : '100%',
              maxWidth: selectedCode ? 420 : 640,
              minWidth: 300,
              borderRight: selectedCode ? '1px solid var(--border)' : 'none',
              display: 'flex', flexDirection: 'column',
              transition: 'width 0.2s ease',
            }}>
              {/* Search bar */}
              <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
                <SearchBar onSearch={handleSearch} loading={searching} />
              </div>

              {/* Results */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
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
              <div style={{
                padding: '8px 16px', borderTop: '1px solid var(--border)',
                display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)',
              }}>
                <span>15.844 mã</span>
                <span>·</span>
                <span>5.856 quy tắc</span>
                <span>·</span>
                <span>10 khái niệm</span>
                <span>·</span>
                <span style={{ color: 'var(--success)' }}>100% offline</span>
              </div>
            </div>

            {/* Right: detail view */}
            {selectedCode && detailRecord && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <DetailView
                  record={detailRecord}
                  rules={detailRules}
                  codingRelations={detailCodingRels}
                  infoRelations={detailInfoRels}
                  hierarchy={detailHierarchy}
                  onClose={() => setSelectedCode(null)}
                  onNavigate={handleNavigate}
                />
              </div>
            )}

            {/* Empty detail placeholder */}
            {!selectedCode && (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)', flexDirection: 'column', gap: 10,
                borderLeft: '1px solid var(--border)', display: 'none',
              }} />
            )}
          </>
        ) : (
          /* Playground view */
          <div style={{
            flex: 1, overflowY: 'auto', padding: 24,
            maxWidth: 800, margin: '0 auto', width: '100%',
          }}>
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
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 8, border: 'none',
        cursor: 'pointer', fontSize: 12, fontWeight: 500,
        background: active ? 'var(--bg-overlay)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        boxShadow: active ? '0 0 0 1px var(--border-hover)' : 'none',
        transition: 'all 0.15s', fontFamily: 'inherit',
      }}
    >
      <Icon size={13} />
      {label}
    </button>
  )
}
