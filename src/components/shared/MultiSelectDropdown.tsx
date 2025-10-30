import { Fragment, useEffect, useRef, useState } from 'react'
import { Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

interface Option<T> {
  label: string
  value: T
}

interface MultiSelectDropdownProps<T> {
  label: string
  options: Option<T>[]
  selected: T[]
  onChange: (newValues: T[]) => void
}

export function MultiSelectDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 🔹 Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function toggleValue(value: T) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="w-full max-w-xs" ref={dropdownRef}>
      <div className="relative">
        {/* Botão principal */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative w-full border text-gray-700 border-gray-300 rounded-md p-2 shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
        >
          <span className="block truncate">
            <span className="text-gray-500 mr-1">{label}:</span>
            {selected.length ? `${selected.length} selecionado(s)` : 'Nenhum'}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </button>

        {/* Opções */}
        <Transition
          as={Fragment}
          show={isOpen}
          enter="transition ease-out duration-100"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 sm:text-sm">
            {options.map((option) => {
              const isSelected = selected.includes(option.value)
              return (
                <li
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleValue(option.value)
                  }}
                  className={`relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    isSelected
                      ? 'bg-yellow-100 text-yellow-900'
                      : 'text-gray-900 hover:bg-yellow-50'
                  }`}
                >
                  <span
                    className={`block truncate ${
                      isSelected ? 'font-medium' : 'font-normal'
                    }`}
                  >
                    {option.label}
                  </span>
                  {isSelected && (
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-700">
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </Transition>
      </div>
    </div>
  )
}
