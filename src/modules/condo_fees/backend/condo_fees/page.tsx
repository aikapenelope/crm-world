'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, FileText } from 'lucide-react'

type FeeConfigRow = {
  id: string
  name: string
  fee_type: string
  period_month: string
  base_amount: string
  currency: string
  distribution_method: string
  due_date: string
  status: string
}

export default function CondoFeesPage() {
  const router = useRouter()
  const [configs, setConfigs] = React.useState<FeeConfigRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: FeeConfigRow[] }>(
        '/api/condo-fees/configs?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (res.ok) {
        setConfigs(res.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const feeTypeLabels: Record<string, string> = {
    ordinary: 'Ordinaria',
    extraordinary: 'Extraordinaria',
    special: 'Especial',
  }

  const statusLabels: Record<string, string> = {
    draft: 'Borrador',
    approved: 'Aprobada',
    generated: 'Generada',
    closed: 'Cerrada',
  }

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary',
    approved: 'outline',
    generated: 'default',
    closed: 'secondary',
  }

  const columns: ColumnDef<FeeConfigRow>[] = [
    {
      accessorKey: 'name',
      header: 'Cuota',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'fee_type',
      header: 'Tipo',
      cell: ({ row }) => feeTypeLabels[row.original.fee_type] ?? row.original.fee_type,
    },
    {
      accessorKey: 'period_month',
      header: 'Período',
    },
    {
      accessorKey: 'base_amount',
      header: 'Monto Base',
      cell: ({ row }) => `${row.original.currency} ${Number(row.original.base_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: 'due_date',
      header: 'Vencimiento',
      cell: ({ row }) => row.original.due_date,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status] ?? 'secondary'}>
          {statusLabels[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
  ]

  // Summary
  const summary = React.useMemo(() => {
    const generated = configs.filter((c) => c.status === 'generated').length
    const draft = configs.filter((c) => c.status === 'draft').length
    return { total: configs.length, generated, draft }
  }, [configs])

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cuotas de Condominio</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/condo_fees/receipts')}>
              <FileText className="mr-2 size-4" />
              Recibos
            </Button>
            <Button type="button" onClick={() => router.push('/backend/condo_fees/configs/create')}>
              <Plus className="mr-2 size-4" />
              Nueva Cuota
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Cuotas</p>
            <p className="text-lg font-bold">{summary.total}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Generadas</p>
            <p className="text-lg font-bold">{summary.generated}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Borradores</p>
            <p className="text-lg font-bold">{summary.draft}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={configs}
          isLoading={isLoading}
          searchPlaceholder="Buscar cuota..."
        />
      </PageBody>
    </Page>
  )
}
