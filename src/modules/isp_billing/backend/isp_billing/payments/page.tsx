'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import type { ColumnDef } from '@tanstack/react-table'

type PaymentRow = {
  id: string
  payment_date: string
  amount_usd: string
  currency: string
  payment_method: string
  reference_number: string | null
  igtf_applies: boolean
  igtf_amount_usd: string
}

const METHOD_LABELS: Record<string, string> = {
  zelle: 'Zelle', pago_movil: 'Pago Móvil', efectivo_usd: 'Efectivo USD',
  efectivo_ves: 'Efectivo VES', transferencia: 'Transferencia', binance: 'Binance/USDT', otro: 'Otro',
}

export default function IspPaymentsPage() {
  const [payments, setPayments] = React.useState<PaymentRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalMonth, setTotalMonth] = React.useState(0)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: PaymentRow[] }>('/api/isp-billing/payments?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) {
        const items = res.result?.items ?? []
        setPayments(items)
        setTotalMonth(items.reduce((sum, p) => sum + parseFloat(p.amount_usd), 0))
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<PaymentRow>[] = [
    {
      accessorKey: 'payment_date', header: 'Fecha',
      cell: ({ row }) => new Date(row.original.payment_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'payment_method', header: 'Método',
      cell: ({ row }) => METHOD_LABELS[row.original.payment_method] ?? row.original.payment_method,
    },
    {
      accessorKey: 'amount_usd', header: 'Monto',
      cell: ({ row }) => (
        <div>
          <span className="font-semibold">{row.original.currency} {row.original.amount_usd}</span>
          {row.original.igtf_applies && (
            <div className="text-xs text-status-warning-text">+IGTF {row.original.igtf_amount_usd}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'reference_number', header: 'Referencia',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.reference_number ?? '—'}</span>,
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Cobros registrados"
        description={`Total: USD ${totalMonth.toFixed(2)}`}
      />
      <PageBody>
        <DataTable
          entityId="isp_billing.payment"
          extensionTableId="isp-payments-list"
          data={payments}
          columns={columns}
          isLoading={isLoading}
          emptyState='Sin cobros'
        />
      </PageBody>
    </Page>
  )
}
