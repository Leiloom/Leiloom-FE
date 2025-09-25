import React from 'react'
import Pagination from './Pagination'

interface Column {
  key: string
  header: string
  render?: (value: any, item: any) => React.ReactNode
}

interface DataTableProps {
  data: any[]
  columns: Column[]
  currentPage: number
  totalPages: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  emptyStateTitle?: string
  emptyStateDescription?: string
  onCreateFirst?: () => void
  createFirstText?: string
}

export function DataTable({
  data,
  columns,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  isLoading = false,
  emptyStateTitle = "Nenhum item cadastrado.",
  emptyStateDescription,
  onCreateFirst,
  createFirstText = "Criar o primeiro item"
}: DataTableProps) {
  if (isLoading && !data.length) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        <p className="mt-2 text-gray-500">Carregando...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
        <p className="mt-2">{emptyStateTitle}</p>
        {emptyStateDescription && (
          <p className="text-sm text-gray-400 mt-1">{emptyStateDescription}</p>
        )}
        {onCreateFirst && (
          <button
            onClick={onCreateFirst}
            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
          >
            {createFirstText}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {column.render
                    ? column.render(item[column.key], item)
                    : item[column.key] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(p) => {
          if (p >= 1 && p <= totalPages) onPageChange(p)
        }}
      />
    </div>
  )
}