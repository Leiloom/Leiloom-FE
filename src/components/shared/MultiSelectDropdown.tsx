import { Listbox, Transition } from '@headlessui/react'
import { Fragment } from 'react'
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
  onChange
}: MultiSelectDropdownProps<T>) {
  function toggleValue(value: T) {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="w-full max-w-xs">
      <Listbox value={selected} onChange={() => {}}>
        <div className="relative">
         <Listbox.Button className="relative w-full border text-gray-700 border-gray-300 rounded-md p-2 shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500">
            <span className="block truncate">
              <span className="text-gray-500 mr-1">{label}:</span>
              {selected.length ? `${selected.length} selecionado(s)` : 'Nenhum'}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100 text-gray-700"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                key={option.value}
                value={option.value}
                onClick={() => toggleValue(option.value)}
                className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-yellow-100 text-yellow-900' : 'text-gray-900'
                    }`
                }
                >
                  {() => {
                    const isSelected = selected.includes(option.value)
                    return (
                        <>
                        <span className={`block truncate ${isSelected ? 'font-medium' : 'font-normal'}`}>
                            {option.label}
                        </span>
                        {isSelected ? (
                            <span className="absolute text-green-900 inset-y-0 left-0 flex items-center pl-3">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                        ) : null}
                        </>
                    )
                    }}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}
