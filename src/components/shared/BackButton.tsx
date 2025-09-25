'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'

interface BackButtonProps {
  label?: string
  className?: string
}

export function BackButton({ label = 'Voltar', className = '' }: BackButtonProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className={`inline-flex items-center gap-2 text-mx font-medium text-gray-700 hover:text-yellow-600 transition ${className}`}
    >
      <ArrowLeftIcon className="h-10 w-10" />
    </button>
  )
}
