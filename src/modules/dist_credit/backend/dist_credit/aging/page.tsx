'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { BarChart3 } from 'lucide-react'

type AgingRow = {
  customer_id: string
  customer_name: string
  credit_limit: string
  current_balance: string
  bucket_0_30: number
  bucket_31_60: number
  bucket_61_90: number
  bucket_90_plus: number
  total_overdue: number
  status: string
}

type AgingSummary = {
  total_receivable: string
  total_0_30: string
  total_31_60: string
  total_61_90: string
  total_90_plus: string
  total_overdue: string
  customers_with_debt: number
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  suspended: 'secondary',
  blocked: 'destructive',
}

export default function AgingReportPage() {
  const [rows, setRows] = React.useState<AgingRow[]>([])
  const [summary, setSummary] = React.useState<AgingSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: AgingRow[]; summary: AgingSummary }>(
        '/api/dist-credit/aging',
        undefined,
        { fallback: { items: [], summary: null as any } },
      )
      if (call.ok && call.result) {
        setRows(call.result.items ?? [])
        setSummary(call.result.summary ?? null)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const fmt = (val: number | string) => Number(val).toLocaleString('es-VE', { minimumFractionDigits: 2 })

  const columns: ColumnDef<AgingRow>[] = [
    {
      accessorKey: 'customer_name',
      header: 'Cliente',
      cell: ({ row }) => <span className="font-medium">{row.original.customer_name}</span>,
    },
    {
      accessorKey: 'current_balance',
      header: 'Saldo Total',
      cell: ({ row }) => <span className="font-bold">USD {fmt(row.original.current_balance)}</span>,
    },
    {
      accessorKey: 'bucket_0_30',
      header: '0-30 días',
      cell: ({ row }) => row.original.bucket_0_30 > 0 ? `USD ${fmt(row.original.bucket_0_30)}` : '—',
    },
    {
      accessorKey: 'bucket_31_60',
      header: '31-60 días',
      cell: ({ row }) => row.original.bucket_31_60 > 0
        ? <span className="text-foreground font-medium">USD {fmt(row.original.bucket_31_60)}</span>
        : '—',
    },
    {
      accessorKey: 'bucket_61_90',
      header: '61-90 días',
      cell: ({ row }) => row.original.bucket_61_90 > 0
        ? <span className="text-foreground font-medium">USD {fmt(row.original.bucket_61_90)}</span>
        : '—',
    },
    {
      accessorKey: 'bucket_90_plus',
      header: '90+ días',
      cell: ({ row }) => row.original.bucket_90_plus > 0
        ? <span className="text-destructive font-bold">USD {fmt(row.original.bucket_90_plus)}</span>
        : '—',
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'outline'}>
          {row.original.status === 'active' ? 'Activo' : row.original.status === 'suspended' ? 'Suspendido' : 'Bloqueado'}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Antigüedad de Saldos</h1>
            <p className="text-sm text-muted-foreground">Reporte de cuentas por cobrar por rango de vencimiento</p>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total por Cobrar</p>
              <p className="text-lg font-bold">USD {fmt(summary.total_receivable)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">0-30 días</p>
              <p className="text-lg font-bold">USD {fmt(summary.total_0_30)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">31-60 días</p>
              <p className="text-lg font-bold">USD {fmt(summary.total_31_60)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">61-90 días</p>
              <p className="text-lg font-bold">USD {fmt(summary.total_61_90)}</p>
            </div>
            <div className="rounded-lg border p-4 border-destructive/30">
              <p className="text-xs text-muted-foreground">90+ días</p>
              <p className="text-lg font-bold text-destructive">USD {fmt(summary.total_90_plus)}</p>
            </div>
          </div>
        )}

        {/* Table */}
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          searchPlaceholder="Buscar cliente..."
        />
      </PageBody>
    </Page>
  )
}
