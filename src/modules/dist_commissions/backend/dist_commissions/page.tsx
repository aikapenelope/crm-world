'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

type RecordRow = {
  id: string
  seller_id: string
  period_month: string
  type: string
  base_amount: string
  rate_applied: string
  commission_amount: string
  status: string
}

const TYPE_LABELS: Record<string, string> = { sale: 'Venta', collection: 'Cobranza', goal_bonus: 'Bonus Meta' }
const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', approved: 'Aprobada', paid: 'Pagada' }
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = { pending: 'outline', approved: 'secondary', paid: 'default' }

export default function DistCommissionsPage() {
  const router = useRouter()
  const [records, setRecords] = React.useState<RecordRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: RecordRow[] }>(
        '/api/dist-commissions/records?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) { setRecords(call.result?.items ?? []) }
      setIsLoading(false)
    }
    load()
  }, [])

  const summary = React.useMemo(() => {
    const total = records.reduce((s, r) => s + Number(r.commission_amount), 0)
    const pending = records.filter((r) => r.status === 'pending').reduce((s, r) => s + Number(r.commission_amount), 0)
    return { total, pending, count: records.length }
  }, [records])

  const columns: ColumnDef<RecordRow>[] = [
    { accessorKey: 'period_month', header: 'Período' },
    { accessorKey: 'seller_id', header: 'Vendedor', cell: ({ row }) => <span className="font-mono text-xs">{row.original.seller_id.slice(0, 8)}...</span> },
    { accessorKey: 'type', header: 'Tipo', cell: ({ row }) => TYPE_LABELS[row.original.type] ?? row.original.type },
    { accessorKey: 'base_amount', header: 'Base', cell: ({ row }) => `USD ${Number(row.original.base_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` },
    { accessorKey: 'rate_applied', header: '%', cell: ({ row }) => `${row.original.rate_applied}%` },
    { accessorKey: 'commission_amount', header: 'Comisión', cell: ({ row }) => <span className="font-bold">USD {Number(row.original.commission_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span> },
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'outline'}>{STATUS_LABELS[row.original.status] ?? row.original.status}</Badge> },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Comisiones</h1>
          <Button type="button" variant="outline" onClick={() => router.push('/backend/dist_commissions/create')}>
            <Plus className="mr-2 size-4" />
            Reglas
          </Button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Comisiones</p>
            <p className="text-lg font-bold">USD {summary.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Pendientes por Aprobar</p>
            <p className="text-lg font-bold">USD {summary.pending.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Registros</p>
            <p className="text-lg font-bold">{summary.count}</p>
          </div>
        </div>

        <DataTable columns={columns} data={records} isLoading={isLoading} searchPlaceholder="Buscar comisión..." />
      </PageBody>
    </Page>
  )
}
