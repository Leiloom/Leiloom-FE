import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav className="flex items-center text-gray-500 justify-center space-x-2 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border text-sm text-gray-500 disabled:opacity-50"
      >
        Anterior
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={
            `px-3 py-1 rounded text-sm text-gray-500 border ` +
            (p === currentPage
              ? 'bg-yellow-400 text-black'
              : 'hover:bg-gray-100')
          }
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded border text-gray-500 text-sm disabled:opacity-50"
      >
        Próxima
      </button>
    </nav>
  )
}