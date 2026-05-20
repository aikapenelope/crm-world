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

type AgreementRow = {
  id: string
  agreement_number: string
  total_debt: string
  installments: number
  installment_amount: string
  currency: string
  start_date: string
  status: string
  paid_installments: number
  next_due_date: string | null
}

export default function AgreementsPage() {
  const router = useRouter()
  const [agreements, setAgreements] = React.useState<AgreementRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: AgreementRow[] }>(
        '/api/condo-collections/agreements?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (res.ok) {
        setAgreements(res.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const statusLabels: Record<string, string> = {
    active: 'Activo',
    completed: 'Completado',
    defaulted: 'Incumplido',
    cancelled: 'Cancelado',
  }

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    completed: 'secondary',
    defaulted: 'destructive',
    cancelled: 'outline',
  }

  const columns: ColumnDef<AgreementRow>[] = [
    {
      accessorKey: 'agreement_number',
      header: 'Acuerdo',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.agreement_number}</span>,
    },
    {
      accessorKey: 'total_debt',
      header: 'Deuda Total',
      cell: ({ row }) => `${row.original.currency} ${Number(row.original.total_debt).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: 'installments',
      header: 'Cuotas',
      cell: ({ row }) => `${row.original.paid_installments}/${row.original.installments}`,
    },
    {
      accessorKey: 'installment_amount',
      header: 'Monto Cuota',
      cell: ({ row }) => `${row.original.currency} ${Number(row.original.installment_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: 'next_due_date',
      header: 'Próximo Pago',
      cell: ({ row }) => row.original.next_due_date ?? '—',
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

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/condo_collections')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Acuerdos de Pago</h1>
        </div>

        <DataTable
          columns={columns}
          data={agreements}
          isLoading={isLoading}
          searchPlaceholder="Buscar acuerdo..."
        />
      </PageBody>
    </Page>
  )
}
