'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { Zap } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type InvoiceRow = {
  id: string
  invoice_number: string
  period_month: string
  subscriber_id: string
  due_date: string
  status: string
  total_usd: string
  paid_amount_usd: string
  balance_usd: string
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  paid: 'success', partial: 'info', pending: 'warning', overdue: 'error',
  cancelled: 'neutral', in_dispute: 'warning',
}
const STATUS_LABEL: Record<string, string> = {
  paid: 'Pagada', partial: 'Parcial', pending: 'Pendiente', overdue: 'Vencida',
  cancelled: 'Cancelada', in_dispute: 'En disputa',
}

export default function IspBillingPage() {
  const router = useRouter()
  const [invoices, setInvoices] = React.useState<InvoiceRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [kpis, setKpis] = React.useState<any>(null)
  const [statusFilter, setStatusFilter] = React.useState('')
  const [generating, setGenerating] = React.useState(false)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const [invRes, kpisRes] = await Promise.all([
      apiCall<{ items: InvoiceRow[] }>(`/api/isp-billing/invoices?${params}`, undefined, { fallback: { items: [] } }),
      apiCall<any>('/api/isp-billing/dashboard', undefined, { fallback: null }),
    ])
    if (invRes.ok) setInvoices(invRes.result?.items ?? [])
    if (kpisRes.ok) setKpis(kpisRes.result)
    setIsLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const generateInvoices = async () => {
    const today = new Date()
    const periodMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    setGenerating(true)
    try {
      await apiCall<any>('/api/isp-billing/invoices/generate', {
        method: 'POST',
        body: JSON.stringify({ period_month: periodMonth }),
      })
      load()
    } finally {
      setGenerating(false)
    }
  }

  const columns: ColumnDef<InvoiceRow>[] = [
    {
      accessorKey: 'invoice_number', header: 'Factura',
      cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.invoice_number}</span>,
    },
    { accessorKey: 'period_month', header: 'Período' },
    { accessorKey: 'due_date', header: 'Vencimiento', cell: ({ row }) => new Date(row.original.due_date).toLocaleDateString('es-VE') },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {STATUS_LABEL[row.original.status] ?? row.original.status}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'total_usd', header: 'Total',
      cell: ({ row }) => <span className="font-semibold">USD {row.original.total_usd}</span>,
    },
    {
      accessorKey: 'balance_usd', header: 'Saldo',
      cell: ({ row }) => {
        const bal = parseFloat(row.original.balance_usd)
        return (
          <span className={bal > 0 ? 'text-status-error-text font-semibold' : 'text-status-success-text'}>
            USD {row.original.balance_usd}
          </span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'open', label: 'Ver / Cobrar', onSelect: () => router.push(`/backend/isp-billing/${row.original.id}`) },
        ]} />
      ),
    },
  ]

  const STATUS_FILTERS = [
    { value: '', label: 'Todas' }, { value: 'pending', label: 'Pendientes' },
    { value: 'overdue', label: 'Vencidas' }, { value: 'paid', label: 'Pagadas' },
    { value: 'partial', label: 'Parciales' },
  ]

  const collected = kpis?.this_month?.collected_usd?.toFixed(2) ?? '0.00'
  const pending = kpis?.this_month?.pending_usd?.toFixed(2) ?? '0.00'

  return (
    <Page>
      <PageHeader
        title="Facturación"
        description={kpis ? `Cobrado: USD ${collected} · Pendiente: USD ${pending}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(f.value)}
                >{f.label}</Button>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={generateInvoices} disabled={generating}>
              <Zap className="size-4 mr-2" /> {generating ? 'Generando...' : 'Generar mes'}
            </Button>
          </div>
        }
      />
      <PageBody>
        <DataTable
          entityId="isp_billing.invoice"
          data={invoices}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin facturas"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
