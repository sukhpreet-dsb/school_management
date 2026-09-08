"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** If provided, shows a search box filtering rows by this field. */
  searchKey?: string
  pageSize?: number
  toolbar?: React.ReactNode
  emptyMessage?: string
  searchPlaceholder?: string
  /**
   * "client" (default): paginate + filter the fetched array in the browser.
   * "server": the parent owns the page/pageSize/search state and refetches;
   * this component renders the current page and reports changes via callbacks.
   */
  mode?: "client" | "server"
  /** Server mode: 1-based current page. */
  page?: number
  /** Server mode: the search value the parent is currently fetching with. */
  search?: string
  /** Server mode: total rows across all pages. */
  total?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  onSearchChange?: (search: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  pageSize = 10,
  toolbar,
  emptyMessage = "No records found.",
  searchPlaceholder = "Search…",
  mode = "client",
  page = 1,
  search = "",
  total = 0,
  onPageChange,
  onPageSizeChange,
  onSearchChange
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [query, setQuery] = React.useState("")
  const serverMode = mode === "server"

  // Server mode: keep the input responsive while the parent debounces the
  // applied search. Re-sync when the parent's value actually changes.
  const [input, setInput] = React.useState(search)
  const [prevSearch, setPrevSearch] = React.useState(search)
  if (serverMode && prevSearch !== search) {
    setPrevSearch(search)
    setInput(search)
  }

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleInputChange(value: string) {
    if (!serverMode) {
      setQuery(value)
      return
    }
    setInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onSearchChange?.(value), 300)
  }

  const filteredData = React.useMemo(() => {
    if (serverMode || !searchKey || !query.trim()) return data
    const q = query.toLowerCase()
    return data.filter((row) =>
      String((row as Record<string, unknown>)[searchKey] ?? "")
        .toLowerCase()
        .includes(q)
    )
  }, [data, searchKey, query, serverMode])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      ...(serverMode ? { pagination: { pageIndex: Math.max(0, page - 1), pageSize } } : {})
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      if (!serverMode || !onPageChange) return
      const current = { pageIndex: Math.max(0, page - 1), pageSize }
      const next = typeof updater === "function" ? updater(current) : updater
      if (next.pageSize !== current.pageSize && onPageSizeChange) {
        onPageSizeChange(next.pageSize)
      }
      if (typeof next.pageIndex === "number" && next.pageIndex !== current.pageIndex) {
        onPageChange(next.pageIndex + 1)
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(serverMode
      ? {
          manualPagination: true,
          manualFiltering: true,
          rowCount: total,
          pageCount: pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1
        }
      : {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } }
        })
  })

  const pageIndex = table.getState().pagination.pageIndex
  const perPage = table.getState().pagination.pageSize
  const totalCount = serverMode ? total : filteredData.length
  const from = totalCount === 0 ? 0 : pageIndex * perPage + 1
  const to = Math.min((pageIndex + 1) * perPage, totalCount)

  return (
    <div data-slot="data-table" className="flex flex-col gap-3">
      {(searchKey || toolbar) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {searchKey && (
            <div className="relative w-full max-w-64">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={serverMode ? input : query}
                onChange={(event) => handleInputChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="pl-8"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      <div className="bg-card rounded-2xl border shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort()
                  const sortDirection = isSortable
                    ? table.getState().sorting.find((s) => s.id === header.id)?.desc === undefined
                      ? null
                      : table.getState().sorting.find((s) => s.id === header.id)?.desc
                        ? "desc"
                        : "asc"
                    : null
                  return (
                    <TableHead key={header.id}>
                      <button
                        type="button"
                        disabled={!isSortable}
                        onClick={() => isSortable && header.column.toggleSorting()}
                        className={cn(
                          "flex items-center gap-1.5",
                          isSortable ? "hover:text-foreground cursor-pointer" : "cursor-default"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {isSortable &&
                          (sortDirection === "asc" ? (
                            <ArrowUpDown className="text-muted-foreground size-3.5" />
                          ) : sortDirection === "desc" ? (
                            <ChevronDown className="text-muted-foreground size-3.5" />
                          ) : (
                            <ChevronsUpDown className="text-muted-foreground size-3.5" />
                          ))}
                      </button>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>
            Showing {from}–{to} of {totalCount}
          </span>
          <Select
            value={String(perPage)}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="h-7 w-20 text-xs"
            aria-label="Rows per page"
          >
            {[pageSize, 25, 50].map((size) => (
              <option key={size} value={String(size)}>
                {size} / page
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft />
            <span>Prev</span>
          </Button>
          <span className="text-muted-foreground px-1 text-sm">
            Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span>Next</span>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}