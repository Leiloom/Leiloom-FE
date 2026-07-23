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

  const visiblePages = (() => {
    if (totalPages <= 7) {
      return pages
    }

    const pageSet = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
    const sorted = Array.from(pageSet)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b)

    const compacted: Array<number | 'ellipsis'> = []
    let previous = 0

    sorted.forEach((page) => {
      if (previous && page - previous > 1) {
        compacted.push('ellipsis')
      }
      compacted.push(page)
      previous = page
    })

    return compacted
  })()

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 py-4 text-gray-500">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border text-xs text-gray-500 disabled:opacity-50"
      >
        Anterior
      </button>

      {visiblePages.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="px-1 text-xs text-gray-400">
              ...
            </span>
          )
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={
              `px-3 py-1 rounded text-xs border ` +
              (page === currentPage
                ? 'bg-yellow-400 text-black'
                : 'text-gray-500 hover:bg-gray-100')
            }
          >
            {page}
          </button>
        )
      })}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded border text-xs text-gray-500 disabled:opacity-50"
      >
        Próxima
      </button>
    </nav>
  )
}