import { ChangeEvent } from 'react'

interface InputProps {
    id: string
    name: string
    type?: string
    placeholder?: string
    value?: string
    defaultValue?: string
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void
    required?: boolean
    disabled?: boolean
    step?: string
    min?: string
}

export function Input({
    id,
    name,
    type = 'text',
    placeholder = '',
    value,
    defaultValue,
    onChange,
    required = false,
    disabled = false,
    step,
    min
}: InputProps) {
  return (
    <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        className={`w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors ${
          disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'text-gray-900 bg-white'
        }`}
        disabled={disabled}
        step={step}
        min={min}
    />
  )
}