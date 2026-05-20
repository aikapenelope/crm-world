'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ReceiptRow = {
  id: string
  receipt_number: string
  period_month: string
  unit_number: string
  owner_name: string
  aliquot_percent: string
  amount_usd: string
  amount_ves: string | null
  total_amount: string
  paid_amount: string
  status: string
  due_date: string
  payment_method: string | null
}

export default function CondoReceiptsPage() {
  const router = useRouter()
  const [receipts, setReceipts] = React.useState<ReceiptRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [payingId, setPayingId] = React.useState<string | null>(null)

  async function loadReceipts() {
    setIsLoading(true)
    const res = await apiCall<{ items: ReceiptRow[] }>(
      '/api/condo-fees/receipts?pageSize=100',
      undefined,
      { fallback: { items: [] } },
    )
    if (res.ok) {
      setReceipts(res.result?.items ?? [])
    }
    setIsLoading(false)
  }

  React.useEffect(() => { loadReceipts() }, [])

  async function handleQuickPay(receiptId: string, totalAmount: string) {
    setPayingId(receiptId)
    const result = await apiCall('/api/condo-fees/receipts/pay', {
      method: 'POST',
      body: JSON.stringify({
        receipt_id: receiptId,
        paid_amount: totalAmount,
        payment_method: 'transfer',
      }),
    })
    if (result.ok) {
      flash({ type: 'success', message: 'Pago registrado' })
      await loadReceipts()
    } else {
      flash({ type: 'error', message: 'Error al registrar pago' })
    }
    setPayingId(null)
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    partial: 'Parcial',
    paid: 'Pagado',
    overdue: 'Vencido',
    cancelled: 'Cancelado',
  }

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    partial: 'secondary',
    paid: 'default',
    overdue: 'destructive',
    cancelled: 'secondary',
  }

  const columns: ColumnDef<ReceiptRow>[] = [
    {
      accessorKey: 'receipt_number',
      header: 'Recibo',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.receipt_number}</span>,
    },
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
      accessorKey: 'period_month',
      header: 'Período',
    },
    {
      accessorKey: 'total_amount',
      header: 'Monto USD',
      cell: ({ row }) => `$ ${Number(row.original.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    },
    {
      accessorKey: 'paid_amount',
      header: 'Pagado',
      cell: ({ row }) => {
        const paid = Number(row.original.paid_amount)
        return paid > 0 ? `$ ${paid.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '—'
      },
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
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (row.original.status === 'paid' || row.original.status === 'cancelled') return null
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={payingId === row.original.id}
            onClick={() => handleQuickPay(row.original.id, row.original.total_amount)}
          >
            <DollarSign className="mr-1 size-3" />
            Pagar
          </Button>
        )
      },
    },
  ]

  // Summary
  const summary = React.useMemo(() => {
    const pending = receipts.filter((r) => r.status === 'pending' || r.status === 'overdue')
    const paid = receipts.filter((r) => r.status === 'paid')
    const totalPending = pending.reduce((s, r) => s + Number(r.total_amount) - Number(r.paid_amount), 0)
    const totalCollected = paid.reduce((s, r) => s + Number(r.paid_amount), 0)
    return { pendingCount: pending.length, paidCount: paid.length, totalPending, totalCollected }
  }, [receipts])

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/condo_fees')}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">Recibos</h1>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Recibos</p>
            <p className="text-lg font-bold">{receipts.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="text-lg font-bold text-destructive">{summary.pendingCount}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Por Cobrar</p>
            <p className="text-lg font-bold">$ {summary.totalPending.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Cobrado</p>
            <p className="text-lg font-bold">$ {summary.totalCollected.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={receipts}
          isLoading={isLoading}
          searchPlaceholder="Buscar recibo..."
        />
      </PageBody>
    </Page>
  )
}
