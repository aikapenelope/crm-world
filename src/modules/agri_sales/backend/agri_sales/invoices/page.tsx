'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import type { ColumnDef } from '@tanstack/react-table'

type InvoiceRow = {
  id: string; invoice_number: string; control_number: string | null
  issue_date: string; due_date: string; total_usd: string
  paid_amount_usd: string; igtf_amount_usd: string; status: string
}

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'error' | 'neutral' | 'info'> = {
  pending: 'warning', partial: 'info', paid: 'success', overdue: 'error', cancelled: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente', partial: 'Parcial', paid: 'Pagada', overdue: 'Vencida', cancelled: 'Cancelada',
}

export default function SaleInvoicesPage() {
  const { runMutation } = useGuardedMutation()
  const [invoices, setInvoices] = React.useState<InvoiceRow[]>([])
  const [isLoading, setLoading] = React.useState(true)
  const [statusFilter, setFilter] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const res = await apiCall<{ items: InvoiceRow[] }>(`/api/agri-sales/sale-invoices?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setInvoices(res.result?.items ?? [])
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleMarkPaid = (inv: InvoiceRow) => {
    runMutation({
      operation: 'update',
      context: { entityId: 'agri_sales.invoice', recordId: inv.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/agri-sales/sale-invoices', {
          method: 'PUT',
          body: JSON.stringify({ id: inv.id, status: 'paid', paid_amount_usd: inv.total_usd, paid_at: new Date().toISOString() }),
        })
        flash('Factura marcada como pagada', 'success')
        load()
      },
    })
  }

  const pendingCount  = invoices.filter(i => i.status === 'pending' || i.status === 'partial').length
  const overdueCount  = invoices.filter(i => i.status === 'overdue').length
  const totalPending  = invoices.filter(i => ['pending', 'partial', 'overdue'].includes(i.status)).reduce((s, i) => s + Number(i.total_usd) - Number(i.paid_amount_usd), 0)

  const columns: ColumnDef<InvoiceRow>[] = [
    { accessorKey: 'invoice_number', header: 'Factura', cell: ({ row }) => <span className="font-mono font-semibold">{row.original.invoice_number}</span> },
    { accessorKey: 'control_number', header: 'N° Control', cell: ({ row }) => row.original.control_number ?? '—' },
    { accessorKey: 'issue_date', header: 'Emisión', cell: ({ row }) => new Date(row.original.issue_date).toLocaleDateString('es-VE') },
    { accessorKey: 'due_date', header: 'Vencimiento', cell: ({ row }) => {
      const isOverdue = new Date(row.original.due_date) < new Date() && row.original.status !== 'paid'
      return <span className={isOverdue ? 'text-status-error-text font-semibold' : ''}>{new Date(row.original.due_date).toLocaleDateString('es-VE')}</span>
    }},
    { accessorKey: 'total_usd', header: 'Total', cell: ({ row }) => <span className="font-semibold">USD {row.original.total_usd}</span> },
    { accessorKey: 'paid_amount_usd', header: 'Cobrado', cell: ({ row }) => (
      <span className={Number(row.original.paid_amount_usd) >= Number(row.original.total_usd) ? 'text-status-success-text' : ''}>
        USD {row.original.paid_amount_usd}
      </span>
    )},
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>{STATUS_LABEL[row.original.status] ?? row.original.status}</StatusBadge>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        ['pending', 'partial', 'overdue'].includes(row.original.status) ? (
          <Button type="button" size="sm" variant="outline" onClick={() => handleMarkPaid(row.original)}>
            Registrar pago
          </Button>
        ) : null
      ),
    },
  ]

  const FILTERS = [
    { value: '', label: 'Todas' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'overdue', label: 'Vencidas' },
    { value: 'paid', label: 'Pagadas' },
  ]

  const desc = [
    pendingCount > 0 && `${pendingCount} pendiente(s)`,
    overdueCount > 0 && `${overdueCount} vencida(s)`,
    totalPending > 0 && `USD ${totalPending.toFixed(2)} por cobrar`,
  ].filter(Boolean).join(' · ')

  return (
    <Page>
      <PageHeader
        title="Facturas"
        description={desc || 'Sin facturas pendientes de cobro'}
        actions={
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <Button key={f.value} type="button" size="sm"
                variant={statusFilter === f.value ? 'default' : 'outline'}
                onClick={() => setFilter(f.value)}>
                {f.label}
              </Button>
            ))}
          </div>
        }
      />
      <PageBody>
        <DataTable
          entityId="agri_sales.invoice"
          extensionTableId="agri-sales-invoices-list"
          data={invoices}
          columns={columns}
          isLoading={isLoading}
          emptyState='Sin facturas'
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
