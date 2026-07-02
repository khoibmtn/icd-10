// src/components/SearchBar.tsx
import { useRef, useState, useCallback, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  loading?: boolean
  placeholder?: string
  wholeWord?: boolean
  onToggleWholeWord?: () => void
}

export function SearchBar({ onSearch, loading = false, placeholder, wholeWord = false, onToggleWholeWord }: SearchBarProps) {
  const [value, setValue] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setValue(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(v.trim())
    }, 250)
  }, [onSearch])

  const handleClear = () => {
    setValue('')
    onSearch('')
    inputRef.current?.focus()
  }

  // Keyboard shortcut: Cmd+K to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex', alignItems: 'center',
        }}>
          {loading
            ? <Loader2 size={18} className="loading-dot" style={{ animation: 'spin 1s linear infinite' }} />
            : <Search size={18} />
          }
        </div>
        <input
          ref={inputRef}
          className="search-input"
          value={value}
          onChange={handleChange}
          placeholder={placeholder ?? 'Tìm mã ICD, tên bệnh, thuật ngữ lâm sàng... (⌘K)'}
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              padding: 4, borderRadius: 4,
            }}
          >
            <X size={15} />
          </button>
        )}
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Whole-word toggle switch */}
      {onToggleWholeWord && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onToggleWholeWord}
            role="switch"
            aria-checked={wholeWord}
            title={wholeWord
              ? 'Đang tìm từ nguyên — nhấn để tắt'
              : 'Đang tìm chứa trong từ — nhấn để bật tìm từ nguyên'}
            style={{
              position: 'relative',
              width: 32, height: 18, borderRadius: 9,
              border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
              background: wholeWord ? 'var(--accent)' : 'rgba(0,0,0,0.12)',
              transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute',
              top: 2, left: wholeWord ? 16 : 2,
              width: 14, height: 14, borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              transition: 'left 0.2s',
            }} />
          </button>
          <span
            onClick={onToggleWholeWord}
            style={{
              fontSize: 11, color: wholeWord ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer', userSelect: 'none', fontWeight: wholeWord ? 600 : 400,
              transition: 'color 0.15s',
            }}
          >
            Từ nguyên
          </span>
        </div>
      )}
    </div>
  )
}
