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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  pageSize = 10,
  toolbar,
  emptyMessage = "No records found.",
  searchPlaceholder = "Search…"
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [search, setSearch] = React.useState("")

  const filteredData = React.useMemo(() => {
    if (!searchKey || !search.trim()) return data
    const query = search.toLowerCase()
    return data.filter((row) =>
      String((row as Record<string, unknown>)[searchKey] ?? "")
        .toLowerCase()
        .includes(query)
    )
  }, [data, search, searchKey])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } }
  })

  return (
    <div data-slot="data-table" className="flex flex-col gap-3">
      {(searchKey || toolbar) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {searchKey && (
            <div className="relative w-full max-w-64">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
                    <TableHead key={header.id} className={cn(header.column.getSize() !== 150 && header.column.id !== "actions" && "min-w-24")}>
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
            Showing {filteredData.length === 0 ? 0 : table.getState().pagination.pageIndex * pageSize + 1}–
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              filteredData.length
            )}{" "}
            of {filteredData.length}
          </span>
          <Select
            value={String(table.getState().pagination.pageSize)}
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
            Page {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
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