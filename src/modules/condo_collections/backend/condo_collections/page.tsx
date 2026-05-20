'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { MessageCircle, FileText } from 'lucide-react'

type DebtorRow = {
  unit_id: string
  building_id: string
  owner_name: string
  unit_number: string
  total_debt: string
  receipt_count: number
  months_overdue: number
  oldest_pending_date: string
  owner_phone: string | null
  currency: string
}

export default function CondoCollectionsPage() {
  const router = useRouter()
  const [debtors, setDebtors] = React.useState<DebtorRow[]>([])
  const [totalDebt, setTotalDebt] = React.useState('0.00')
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: DebtorRow[]; total_debt: string }>(
        '/api/condo-collections/debtors',
        undefined,
        { fallback: { items: [], total_debt: '0.00' } },
      )
      if (res.ok && res.result) {
        setDebtors(res.result.items ?? [])
        setTotalDebt(res.result.total_debt ?? '0.00')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<DebtorRow>[] = [
    {
      accessorKey: 'unit_number',
      header: 'Unidad',
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.unit_number}</span>,
    },
    {
      accessorKey: 'owner_name',
      header: 'Propietario',
    },
    {
      accessorKey: 'total_debt',
      header: 'Deuda Total',
      cell: ({ row }) => (
        <span className="font-bold text-destructive">
          $ {Number(row.original.total_debt).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'months_overdue',
      header: 'Meses',
      cell: ({ row }) => {
        const months = row.original.months_overdue
        const variant = months >= 6 ? 'destructive' : months >= 3 ? 'secondary' : 'outline'
        return <Badge variant={variant}>{months} mes{months !== 1 ? 'es' : ''}</Badge>
      },
    },
    {
      accessorKey: 'receipt_count',
      header: 'Recibos',
      cell: ({ row }) => row.original.receipt_count,
    },
    {
      accessorKey: 'owner_phone',
      header: 'Teléfono',
      cell: ({ row }) => row.original.owner_phone ?? '—',
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cobranza</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/condo_collections/agreements')}>
              <FileText className="mr-2 size-4" />
              Acuerdos
            </Button>
            <Button type="button" onClick={() => router.push('/backend/condo_collections/whatsapp')}>
              <MessageCircle className="mr-2 size-4" />
              Cobro WhatsApp
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Morosos</p>
            <p className="text-lg font-bold text-destructive">{debtors.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Deuda Total</p>
            <p className="text-lg font-bold text-destructive">
              $ {Number(totalDebt).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">+6 Meses</p>
            <p className="text-lg font-bold">{debtors.filter((d) => d.months_overdue >= 6).length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Con Teléfono</p>
            <p className="text-lg font-bold">{debtors.filter((d) => d.owner_phone).length}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={debtors}
          isLoading={isLoading}
          searchPlaceholder="Buscar moroso..."
        />
      </PageBody>
    </Page>
  )
}
