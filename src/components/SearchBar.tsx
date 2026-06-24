// src/components/SearchBar.tsx
import { useRef, useState, useCallback, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  loading?: boolean
  placeholder?: string
}

export function SearchBar({ onSearch, loading = false, placeholder }: SearchBarProps) {
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
  )
}
