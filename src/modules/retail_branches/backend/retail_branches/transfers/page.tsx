'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, ArrowRight } from 'lucide-react'

type TransferRow = {
  id: string
  transfer_number: string
  from_branch_id: string
  to_branch_id: string
  status: string
  requested_by: string
  created_at: string
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente',
  approved: 'Aprobada',
  in_transit: 'En Tránsito',
  received: 'Recibida',
  cancelled: 'Cancelada',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  pending_approval: 'secondary',
  approved: 'default',
  in_transit: 'default',
  received: 'default',
  cancelled: 'destructive',
}

export default function TransfersPage() {
  const router = useRouter()
  const [transfers, setTransfers] = React.useState<TransferRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: TransferRow[] }>(
        '/api/retail-branches/transfers?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setTransfers(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<TransferRow>[] = [
    {
      accessorKey: 'transfer_number',
      header: 'Número',
      cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.transfer_number}</span>,
    },
    {
      accessorKey: 'from_branch_id',
      header: 'Ruta',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-xs">{row.original.from_branch_id.slice(0, 8)}</span>
          <ArrowRight className="size-3 text-muted-foreground" />
          <span className="font-mono text-xs">{row.original.to_branch_id.slice(0, 8)}</span>
        </div>
      ),
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
          <div>
            <h1 className="text-2xl font-bold">Transferencias</h1>
            <p className="text-sm text-muted-foreground">Movimientos de inventario entre sucursales</p>
          </div>
          <Button type="button" onClick={() => router.push('/backend/retail_branches/transfers/create')}>
            <Plus className="mr-2 size-4" />
            Nueva Transferencia
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={transfers}
          isLoading={isLoading}
        />
      </PageBody>
    </Page>
  )
}
