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
    <div className="flex flex-col gap-2">
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none flex items-center">
          {loading
            ? <Loader2 size={18} className="animate-spin" />
            : <Search size={18} />
          }
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder ?? 'Tìm mã ICD, tên bệnh... (⌘K)'}
          autoComplete="off"
          spellCheck={false}
          className="w-full bg-surface border border-border rounded-xl py-3 pl-11 pr-10 text-[15px] text-text placeholder:text-text-muted outline-none transition-all duration-200 focus:border-accent focus:ring-3 focus:ring-accent/15 font-[inherit]"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-text-muted hover:text-text-secondary bg-transparent border-none cursor-pointer flex items-center"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Whole-word toggle */}
      {onToggleWholeWord && (
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleWholeWord}
            role="switch"
            aria-checked={wholeWord}
            className={`
              relative w-8 h-[18px] rounded-full border-none cursor-pointer p-0 shrink-0
              transition-colors duration-200
              ${wholeWord ? 'bg-accent' : 'bg-black/12'}
            `}
          >
            <span className={`
              absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm
              transition-[left] duration-200
              ${wholeWord ? 'left-4' : 'left-0.5'}
            `} />
          </button>
          <span
            onClick={onToggleWholeWord}
            className={`
              text-[11px] cursor-pointer select-none transition-colors duration-150
              ${wholeWord ? 'text-accent font-semibold' : 'text-text-muted font-normal'}
            `}
          >
            Từ nguyên
          </span>
        </div>
      )}
    </div>
  )
}
