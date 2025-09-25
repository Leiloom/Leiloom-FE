import React, { useState, useEffect, useMemo } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  autoFocus?: boolean
  debounceMs?: number
  onSearch?: (value: string) => void // Callback quando a busca é executada
  onClear?: () => void
  showResults?: boolean
  resultCount?: number
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function SearchBar({ 
  value, 
  onChange, 
  placeholder = "Pesquisar...",
  className = "",
  disabled = false,
  autoFocus = false,
  debounceMs = 0,
  onSearch,
  onClear,
  showResults = false,
  resultCount,
  isLoading = false,
  size = 'md'
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value)
  const [isFocused, setIsFocused] = useState(false)

  // Debounce logic
  useEffect(() => {
    if (debounceMs > 0) {
      const timer = setTimeout(() => {
        onChange(internalValue)
        if (onSearch) {
          onSearch(internalValue)
        }
      }, debounceMs)

      return () => clearTimeout(timer)
    } else {
      onChange(internalValue)
      if (onSearch) {
        onSearch(internalValue)
      }
    }
  }, [internalValue, debounceMs, onChange, onSearch])

  // Sync external value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInternalValue(newValue)
    
    if (debounceMs === 0) {
      onChange(newValue)
      if (onSearch) {
        onSearch(newValue)
      }
    }
  }

  const handleClear = () => {
    setInternalValue('')
    onChange('')
    if (onClear) {
      onClear()
    }
    if (onSearch) {
      onSearch('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (onSearch) {
        onSearch(internalValue)
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      if (internalValue) {
        handleClear()
      }
    }
  }

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-3',
          input: 'py-1.5 pl-8 pr-8 text-sm',
          icon: 'h-4 w-4',
          iconContainer: 'left-2'
        }
      case 'lg':
        return {
          container: 'p-6',
          input: 'py-3 pl-12 pr-12 text-lg',
          icon: 'h-6 w-6',
          iconContainer: 'left-3'
        }
      default: // md
        return {
          container: 'p-4',
          input: 'py-2 pl-10 pr-10 text-base',
          icon: 'h-5 w-5',
          iconContainer: 'left-3'
        }
    }
  }, [size])

  const hasValue = internalValue.length > 0
  const showClearButton = hasValue && !disabled

  return (
    <div className={`w-full ${sizeClasses.container} ${className}`}>
      <div className="relative">
        {/* Search Icon */}
        <div className={`absolute inset-y-0 ${sizeClasses.iconContainer} flex items-center pointer-events-none`}>
          {isLoading ? (
            <div className={`animate-spin rounded-full border-b-2 border-gray-400 ${sizeClasses.icon}`} />
          ) : (
            <MagnifyingGlassIcon className={`${sizeClasses.icon} text-gray-400`} />
          )}
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={internalValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full border rounded-lg shadow-sm transition-all duration-200
            ${sizeClasses.input}
            ${disabled 
              ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200' 
              : isFocused
                ? 'border-yellow-500 ring-2 ring-yellow-200 text-gray-900'
                : hasValue
                  ? 'border-gray-400 text-gray-900'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
            }
            focus:outline-none
          `}
        />

        {/* Clear Button */}
        {showClearButton && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              aria-label="Limpar busca"
            >
              <XMarkIcon className={sizeClasses.icon} />
            </button>
          </div>
        )}
      </div>

      {/* Results Info */}
      {showResults && (hasValue || resultCount !== undefined) && (
        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            {hasValue && (
              <span>
                Buscando por: <span className="font-medium text-gray-900">"{internalValue}"</span>
              </span>
            )}
          </div>
          
          {resultCount !== undefined && (
            <span className="text-gray-500">
              {resultCount === 0 
                ? 'Nenhum resultado'
                : resultCount === 1 
                  ? '1 resultado'
                  : `${resultCount.toLocaleString()} resultados`
              }
            </span>
          )}
        </div>
      )}

      {/* Search Tips */}
      {isFocused && !hasValue && (
        <div className="mt-2 text-xs text-gray-500">
          <div className="flex flex-wrap gap-4">
            <span>💡 Dica: Use palavras-chave específicas</span>
            <span>⌨️ Enter para buscar, Esc para limpar</span>
          </div>
        </div>
      )}
    </div>
  )
}