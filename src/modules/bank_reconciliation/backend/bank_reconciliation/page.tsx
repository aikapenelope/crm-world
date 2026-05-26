'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Upload, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type TransactionRow = {
  id: string
  statement_id: string
  transaction_date: string
  description: string | null
  reference: string | null
  direction: string
  amount: string
  currency: string
  balance: string | null
  reconciliation_status: string
  matched_payment_id: string | null
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline', matched: 'default', unmatched: 'destructive', ignored: 'secondary',
}

export default function BankReconciliationPage() {
  const t = useT()
  const router = useRouter()
  const [transactions, setTransactions] = React.useState<TransactionRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState<string>('')

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      let url = '/api/bank-reconciliation/transactions?pageSize=100'
      if (statusFilter) url += `&reconciliation_status=${statusFilter}`
      const call = await apiCall<{ items: TransactionRow[] }>(url, undefined, { fallback: { items: [] } })
      if (call.ok) { setTransactions(call.result?.items ?? []) }
      setIsLoading(false)
    }
    load()
  }, [statusFilter])

  const summary = React.useMemo(() => {
    const matched = transactions.filter((tx) => tx.reconciliation_status === 'matched')
    const pending = transactions.filter((tx) => tx.reconciliation_status === 'pending')
    const unmatched = transactions.filter((tx) => tx.reconciliation_status === 'unmatched')
    return {
      matchedCount: matched.length,
      pendingCount: pending.length,
      unmatchedCount: unmatched.length,
      matchRate: transactions.length > 0 ? Math.round((matched.length / transactions.length) * 100) : 0,
    }
  }, [transactions])

  // Translated status labels — built inside the component so locale changes are reflected
  const statusLabels = React.useMemo<Record<string, string>>(() => ({
    pending: t('bank_reconciliation.list.status.pending', 'Pendiente'),
    matched: t('bank_reconciliation.list.status.matched', 'Conciliado'),
    unmatched: t('bank_reconciliation.list.status.unmatched', 'Sin cruce'),
    ignored: t('bank_reconciliation.list.status.ignored', 'Ignorado'),
  }), [t])

  const columns = React.useMemo<ColumnDef<TransactionRow>[]>(() => [
    { accessorKey: 'transaction_date', header: t('bank_reconciliation.list.col.date', 'Fecha'), cell: ({ row }) => new Date(row.original.transaction_date).toLocaleDateString('es-VE') },
    { accessorKey: 'direction', header: t('bank_reconciliation.list.col.type', 'Tipo'), cell: ({ row }) => (
      <Badge variant={row.original.direction === 'credit' ? 'default' : 'secondary'}>
        {row.original.direction === 'credit'
          ? t('bank_reconciliation.list.direction.credit', 'Crédito')
          : t('bank_reconciliation.list.direction.debit', 'Débito')}
      </Badge>
    )},
    { accessorKey: 'amount', header: t('bank_reconciliation.list.col.amount', 'Monto'), cell: ({ row }) => (
      <span className={`font-medium ${row.original.direction === 'credit' ? 'text-primary' : 'text-foreground'}`}>
        {row.original.currency} {Number(row.original.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
      </span>
    )},
    { accessorKey: 'reference', header: t('bank_reconciliation.list.col.reference', 'Referencia'), cell: ({ row }) => row.original.reference ?? '—' },
    { accessorKey: 'description', header: t('bank_reconciliation.list.col.description', 'Descripción'), cell: ({ row }) => <span className="max-w-[200px] truncate block text-xs">{row.original.description ?? '—'}</span> },
    { accessorKey: 'reconciliation_status', header: t('bank_reconciliation.list.col.status', 'Estado'), cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.reconciliation_status] ?? 'outline'}>
        {statusLabels[row.original.reconciliation_status] ?? row.original.reconciliation_status}
      </Badge>
    )},
  ], [t, statusLabels])

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('bank_reconciliation.list.title', 'Conciliación Bancaria')}</h1>
          <Button type="button" onClick={() => router.push('/backend/bank_reconciliation/upload')}>
            <Upload className="mr-2 size-4" />
            {t('bank_reconciliation.list.upload_button', 'Cargar Extracto')}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              <p className="text-xs text-muted-foreground">{t('bank_reconciliation.list.stat.matched', 'Conciliados')}</p>
            </div>
            <p className="text-lg font-bold">{summary.matchedCount}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <MinusCircle className="size-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t('bank_reconciliation.list.stat.pending', 'Pendientes')}</p>
            </div>
            <p className="text-lg font-bold">{summary.pendingCount}</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <XCircle className="size-4 text-destructive" />
              <p className="text-xs text-muted-foreground">{t('bank_reconciliation.list.stat.unmatched', 'Sin Cruce')}</p>
            </div>
            <p className="text-lg font-bold">{summary.unmatchedCount}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('bank_reconciliation.list.stat.rate', 'Tasa de Conciliación')}</p>
            <p className="text-lg font-bold">{summary.matchRate}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('bank_reconciliation.list.filter.all', 'Todos los estados')}</option>
            <option value="pending">{t('bank_reconciliation.list.filter.pending', 'Pendientes')}</option>
            <option value="matched">{t('bank_reconciliation.list.filter.matched', 'Conciliados')}</option>
            <option value="unmatched">{t('bank_reconciliation.list.filter.unmatched', 'Sin cruce')}</option>
            <option value="ignored">{t('bank_reconciliation.list.filter.ignored', 'Ignorados')}</option>
          </select>
        </div>

        <DataTable columns={columns} data={transactions} isLoading={isLoading} searchPlaceholder={t('bank_reconciliation.list.search_placeholder', 'Buscar por referencia o descripción...')} />
      </PageBody>
    </Page>
  )
}
