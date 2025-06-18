import { useState, useMemo } from 'react'

export function usePagedData<T>(data: T[], itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage))

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }, [data, currentPage, itemsPerPage])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const resetToFirstPage = () => setCurrentPage(1)

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    resetToFirstPage
  }
}
