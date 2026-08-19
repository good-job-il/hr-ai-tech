import { useState, useCallback, useEffect } from "react"
import {
  DataTableState,
  SortConfig,
  FilterConfig,
  SortOrder,
  FilterOperator,
} from "@/types/datatable"

export const useDataTable = <T>(initialData: T[] = []) => {
  const [state, setState] = useState<DataTableState<T>>({
    data: initialData,
    isLoading: false,
    pagination: {
      page: 1,
      limit: 20,
      total: initialData.length,
      totalPages: Math.ceil(initialData.length / 20),
    },
    sort: null,
    filters: [],
    selectedRows: new Set(),
    expandedRows: new Set(),
  })

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }))
  }, [])

  const setError = useCallback((error: Error | null) => {
    setState((prev) => ({ ...prev, error }))
  }, [])

  const setData = useCallback((data: T[]) => {
    setState((prev) => ({
      ...prev,
      data,
      pagination: {
        ...prev.pagination,
        total: data.length,
        totalPages: Math.ceil(data.length / prev.pagination.limit),
      },
    }))
  }, [])

  const setPageSize = useCallback((limit: number) => {
    setState((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        limit,
        totalPages: Math.ceil(prev.pagination.total / limit),
      },
    }))
  }, [])

  const goToPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        page: Math.max(1, Math.min(page, prev.pagination.totalPages)),
      },
    }))
  }, [])

  const sort = useCallback((columnId: string, order: SortOrder) => {
    setState((prev) => ({
      ...prev,
      sort: order ? { columnId, order } : null,
    }))
  }, [])

  const addFilter = useCallback((columnId: string, operator: FilterOperator, value: any) => {
    setState((prev) => {
      const existingIndex = prev.filters.findIndex((f) => f.columnId === columnId)
      const newFilters = [...prev.filters]

      if (existingIndex >= 0) {
        newFilters[existingIndex] = { columnId, operator, value }
      } else {
        newFilters.push({ columnId, operator, value })
      }

      return { ...prev, filters: newFilters }
    })
  }, [])

  const removeFilter = useCallback((columnId: string) => {
    setState((prev) => ({
      ...prev,
      filters: prev.filters.filter((f) => f.columnId !== columnId),
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: [] }))
  }, [])

  const toggleRowSelection = useCallback((rowId: string | number) => {
    setState((prev) => {
      const newSelected = new Set(prev.selectedRows)
      if (newSelected.has(rowId)) {
        newSelected.delete(rowId)
      } else {
        newSelected.add(rowId)
      }
      return { ...prev, selectedRows: newSelected }
    })
  }, [])

  const selectAllRows = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedRows: new Set(prev.data.map((_, i) => i)),
    }))
  }, [])

  const deselectAllRows = useCallback(() => {
    setState((prev) => ({ ...prev, selectedRows: new Set() }))
  }, [])

  const toggleRowExpansion = useCallback((rowId: string | number) => {
    setState((prev) => {
      const newExpanded = new Set(prev.expandedRows)
      if (newExpanded.has(rowId)) {
        newExpanded.delete(rowId)
      } else {
        newExpanded.add(rowId)
      }
      return { ...prev, expandedRows: newExpanded }
    })
  }, [])

  return {
    state,
    setLoading,
    setError,
    setData,
    setPageSize,
    goToPage,
    sort,
    addFilter,
    removeFilter,
    clearFilters,
    toggleRowSelection,
    selectAllRows,
    deselectAllRows,
    toggleRowExpansion,
  }
}
