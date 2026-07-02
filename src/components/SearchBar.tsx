// src/components/SearchBar.tsx
import { useRef, useState, useCallback, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

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
    debounceRef.current = setTimeout(() => onSearch(v.trim()), 250)
  }, [onSearch])

  const handleClear = () => { setValue(''); onSearch(''); inputRef.current?.focus() }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </div>
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder ?? 'Tìm mã ICD, tên bệnh... (⌘K)'}
          autoComplete="off"
          spellCheck={false}
          className="pl-10 pr-10 h-11 bg-muted/50 focus-visible:bg-background border-border"
        />
        {value && (
          <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center bg-transparent border-none">
            <X size={16} />
          </button>
        )}
      </div>
      {onToggleWholeWord && (
        <div className="flex items-center gap-2 px-1">
          <Switch 
            id="whole-word-mode" 
            checked={wholeWord} 
            onCheckedChange={onToggleWholeWord} 
          />
          <Label 
            htmlFor="whole-word-mode" 
            className={`text-xs cursor-pointer select-none transition-colors ${wholeWord ? 'text-primary font-medium' : 'text-muted-foreground'}`}
          >
            Từ nguyên
          </Label>
        </div>
      )}
    </div>
  )
}
