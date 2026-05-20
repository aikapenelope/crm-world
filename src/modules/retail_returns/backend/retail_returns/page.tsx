'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, RotateCcw } from 'lucide-react'

type ReturnRow = {
  id: string
  return_number: string
  branch_id: string
  customer_id: string | null
  status: string
  reason: string
  refund_amount: string
  currency: string
  created_at: string
}

const statusLabels: Record<string, string> = {
  requested: 'Solicitada',
  approved: 'Aprobada',
  inspecting: 'Inspección',
  completed: 'Completada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  requested: 'outline',
  approved: 'secondary',
  inspecting: 'secondary',
  completed: 'default',
  rejected: 'destructive',
  cancelled: 'destructive',
}

const reasonLabels: Record<string, string> = {
  defective: 'Defectuoso',
  wrong_item: 'Producto equivocado',
  not_as_described: 'No como se describió',
  changed_mind: 'Cambio de opinión',
  damaged_shipping: 'Dañado en envío',
  other: 'Otro',
}

export default function RetailReturnsPage() {
  const router = useRouter()
  const [returns, setReturns] = React.useState<ReturnRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: ReturnRow[] }>(
        '/api/retail-returns/returns?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setReturns(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<ReturnRow>[] = [
    {
      accessorKey: 'return_number',
      header: 'Número',
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.return_number}</span>,
    },
    {
      accessorKey: 'reason',
      header: 'Razón',
      cell: ({ row }) => <span className="text-sm">{reasonLabels[row.original.reason] ?? row.original.reason}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status] ?? 'outline'}>
          {statusLabels[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'refund_amount',
      header: 'Monto',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.currency} {Number(row.original.refund_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('es-VE')}
        </span>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <RotateCcw className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Devoluciones</h1>
              <p className="text-sm text-muted-foreground">Gestión de devoluciones y cambios</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/retail_returns/policies')}>
              Políticas
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/backend/retail_returns/credit-notes')}>
              Notas de Crédito
            </Button>
            <Button type="button" onClick={() => router.push('/backend/retail_returns/create')}>
              <Plus className="mr-2 size-4" />
              Nueva Devolución
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={returns}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/backend/retail_returns/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
