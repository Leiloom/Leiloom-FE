import { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'danger' | 'neutral' | 'add'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
  className?: string
}

export function Button({
  type = 'button',
  variant = 'neutral',
  children,
  className = '',
  disabled = false,
  ...rest
}: ButtonProps) {
  const baseClasses =
    'rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-yellow-400 text-black px-4 py-2 hover:bg-yellow-500 focus:ring-yellow-500',
  danger: 'bg-red-600 text-white px-4 py-2 hover:bg-red-700 focus:ring-red-500',
  neutral: 'border border-gray-300 text-gray-700 bg-white px-4 py-2 hover:bg-gray-50 focus:ring-gray-500',
  add: 'bg-yellow-400 text-black px-5 py-2 rounded-md hover:bg-yellow-500 transition-colors flex items-center gap-2',
}


  const disabledClasses = disabled ? 'cursor-not-allowed' : ''

  return (
    <button
      type={type}
      className={clsx(baseClasses, variantClasses[variant], disabledClasses, className)}
      disabled={disabled}
      {...rest}
    >
      {variant === 'add' && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
      </svg>}
      {children}
    </button>
  )
}
