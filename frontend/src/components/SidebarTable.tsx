import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import type { CMSItem } from '../types'

interface SidebarTableProps {
  items: CMSItem[]
  selectedItems: Set<string>
  onToggleItem: (id: string) => void
}

const columns: ColumnDef<CMSItem>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Collection',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'images',
    header: () => <span className="text-right block">Items</span>,
    cell: ({ row }) => {
      const images = row.getValue<CMSItem['images']>('images')
      return (
        <span className="text-right block text-muted-foreground tabular-nums">
          {images.length}
        </span>
      )
    },
  },
]

export function SidebarTable({
  items,
  selectedItems,
  onToggleItem,
}: SidebarTableProps) {
  const rowSelection: RowSelectionState = {}
  items.forEach((item, index) => {
    if (selectedItems.has(item.id)) {
      rowSelection[index] = true
    }
  })

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelection) : updater

      const prevKeys = new Set(
        Object.entries(rowSelection)
          .filter(([, v]) => v)
          .map(([i]) => items[Number(i)]?.id)
          .filter(Boolean)
      )
      const nextKeys = new Set(
        Object.entries(next)
          .filter(([, v]) => v)
          .map(([i]) => items[Number(i)]?.id)
          .filter(Boolean)
      )

      for (const id of [...prevKeys, ...nextKeys]) {
        if (prevKeys.has(id) !== nextKeys.has(id)) {
          onToggleItem(id)
        }
      }
    },
    enableRowSelection: true,
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalItems = items.length
  const from = totalItems === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalItems)

  return (
    <div className="flex flex-col h-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? 'selected' : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                No collections loaded.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalItems > pageSize && (
        <div className="flex items-center justify-between px-3 py-2 border-t mt-auto">
          <span className="text-xs text-muted-foreground">
            {from}–{to} of {totalItems}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
