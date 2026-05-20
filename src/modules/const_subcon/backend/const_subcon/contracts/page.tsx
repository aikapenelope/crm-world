'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft } from 'lucide-react'

type ContractRow = {
  id: string; project_id: string; subcontractor_name: string; contract_number: string
  contract_amount: string; amount_paid: string; retention_percent: string; status: string; currency: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', active: 'Activo', completed: 'Completado', terminated: 'Terminado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary', active: 'default', completed: 'secondary', terminated: 'destructive',
}

export default function ConstSubconContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = React.useState<ContractRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: ContractRow[] }>('/api/const-subcon/contracts?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) setContracts(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<ContractRow>[] = [
    {
      accessorKey: 'contract_number',
      header: 'Contrato',
      cell: ({ row }) => <span className="font-mono font-bold">{row.original.contract_number}</span>,
    },
    { accessorKey: 'subcontractor_name', header: 'Subcontratista' },
    {
      accessorKey: 'contract_amount',
      header: 'Monto Contrato',
      cell: ({ row }) => (
        <span className="font-mono">
          {row.original.currency} {Number(row.original.contract_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'amount_paid',
      header: 'Pagado',
      cell: ({ row }) => {
        const pct = Number(row.original.contract_amount) > 0
          ? Math.round((Number(row.original.amount_paid) / Number(row.original.contract_amount)) * 100)
          : 0
        return (
          <div>
            <span className="font-mono text-sm">
              {row.original.currency} {Number(row.original.amount_paid).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-muted-foreground">{pct}% cobrado</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'retention_percent',
      header: 'Retención',
      cell: ({ row }) => <span className="text-sm">{row.original.retention_percent}%</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'secondary'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/const_subcon')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Contratos de Subcontrato</h1>
        </div>
        <DataTable columns={columns} data={contracts} isLoading={isLoading} searchPlaceholder="Buscar contrato..." />
      </PageBody>
    </Page>
  )
}
