'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { CreditCard } from 'lucide-react'

type PayableRow = { id: string; supplier_id: string; document_number: string | null; amount: string; balance: string; currency: string; status: string; due_date: string }

const statusLabels: Record<string, string> = { pending: 'Pendiente', partially_paid: 'Parcial', paid: 'Pagada', overdue: 'Vencida', cancelled: 'Cancelada' }
const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = { pending: 'outline', partially_paid: 'secondary', paid: 'default', overdue: 'destructive', cancelled: 'destructive' }

export default function PayablesPage() {
  const [payables, setPayables] = React.useState<PayableRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: PayableRow[] }>('/api/retail-purchasing/payables?pageSize=100', undefined, { fallback: { items: [] } })
      if (call.ok) setPayables(call.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  async function registerPayment(payableId: string) {
    const amount = prompt('Monto a pagar (USD):')
    if (!amount) return
    const call = await apiCall('/api/retail-purchasing/payables', {
      method: 'POST', body: JSON.stringify({ payable_id: payableId, amount }),
    })
    if (call.ok) {
      flash('Pago registrado', 'success')
      // Reload
      const reload = await apiCall<{ items: PayableRow[] }>('/api/retail-purchasing/payables?pageSize=100', undefined, { fallback: { items: [] } })
      if (reload.ok) setPayables(reload.result?.items ?? [])
    }
  }

  const fmt = (v: string) => Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2 })
  const totalPending = payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled').reduce((sum, p) => sum + Number(p.balance), 0)

  const columns: ColumnDef<PayableRow>[] = [
    { accessorKey: 'document_number', header: 'Documento', cell: ({ row }) => <span className="font-mono text-sm">{row.original.document_number ?? '—'}</span> },
    { accessorKey: 'supplier_id', header: 'Proveedor', cell: ({ row }) => <span className="font-mono text-xs">{row.original.supplier_id.slice(0, 8)}...</span> },
    { accessorKey: 'amount', header: 'Monto', cell: ({ row }) => <span>{row.original.currency} {fmt(row.original.amount)}</span> },
    { accessorKey: 'balance', header: 'Saldo', cell: ({ row }) => <span className="font-bold">{row.original.currency} {fmt(row.original.balance)}</span> },
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => <Badge variant={statusVariants[row.original.status] ?? 'outline'}>{statusLabels[row.original.status]}</Badge> },
    { accessorKey: 'due_date', header: 'Vence', cell: ({ row }) => {
      const isOverdue = new Date(row.original.due_date) < new Date() && row.original.status !== 'paid'
      return <span className={`text-sm ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>{new Date(row.original.due_date).toLocaleDateString('es-VE')}</span>
    }},
    { id: 'actions', header: '', cell: ({ row }) => (
      row.original.status !== 'paid' && row.original.status !== 'cancelled' ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => registerPayment(row.original.id)}>Pagar</Button>
      ) : null
    )},
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Cuentas por Pagar</h1>
              <p className="text-sm text-muted-foreground">Total pendiente: USD {fmt(totalPending.toFixed(2))}</p>
            </div>
          </div>
        </div>
        <DataTable columns={columns} data={payables} isLoading={isLoading} />
      </PageBody>
    </Page>
  )
}
