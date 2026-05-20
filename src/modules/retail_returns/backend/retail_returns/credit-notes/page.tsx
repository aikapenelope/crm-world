'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import type { ColumnDef } from '@tanstack/react-table'

type CreditNoteRow = { id: string; credit_note_number: string; customer_id: string; amount: string; balance: string; currency: string; status: string; created_at: string }

const statusLabels: Record<string, string> = { active: 'Activa', partially_used: 'Parcial', fully_used: 'Usada', expired: 'Expirada', cancelled: 'Cancelada' }
const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { active: 'default', partially_used: 'secondary', fully_used: 'outline', expired: 'destructive', cancelled: 'destructive' }

export default function CreditNotesPage() {
  const [notes, setNotes] = React.useState<CreditNoteRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: CreditNoteRow[] }>('/api/retail-returns/credit-notes?pageSize=100', undefined, { fallback: { items: [] } })
      if (call.ok) setNotes(call.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const fmt = (v: string) => Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2 })

  const columns: ColumnDef<CreditNoteRow>[] = [
    { accessorKey: 'credit_note_number', header: 'Número', cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.credit_note_number}</span> },
    { accessorKey: 'customer_id', header: 'Cliente', cell: ({ row }) => <span className="font-mono text-xs">{row.original.customer_id.slice(0, 8)}...</span> },
    { accessorKey: 'amount', header: 'Monto', cell: ({ row }) => <span>{row.original.currency} {fmt(row.original.amount)}</span> },
    { accessorKey: 'balance', header: 'Saldo', cell: ({ row }) => <span className="font-bold">{row.original.currency} {fmt(row.original.balance)}</span> },
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => <Badge variant={statusVariants[row.original.status] ?? 'outline'}>{statusLabels[row.original.status] ?? row.original.status}</Badge> },
    { accessorKey: 'created_at', header: 'Fecha', cell: ({ row }) => <span className="text-sm text-muted-foreground">{new Date(row.original.created_at).toLocaleDateString('es-VE')}</span> },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Notas de Crédito</h1>
          <p className="text-sm text-muted-foreground">Notas de crédito emitidas por devoluciones</p>
        </div>
        <DataTable columns={columns} data={notes} isLoading={isLoading} />
      </PageBody>
    </Page>
  )
}
