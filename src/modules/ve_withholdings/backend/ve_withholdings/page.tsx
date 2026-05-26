'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type WithholdingRow = {
  id: string
  type: string
  period_month: string
  fortnight: number
  supplier_rif: string
  supplier_name: string
  invoice_number: string
  invoice_date: string
  invoice_amount: string
  tax_amount: string
  withholding_rate: string
  withholding_amount: string
  voucher_number: string | null
  status: string
}

const TYPE_LABELS: Record<string, string> = { iva: 'IVA', islr: 'ISLR' }
const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', applied: 'Aplicada', declared: 'Declarada' }
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline', applied: 'secondary', declared: 'default',
}

export default function VeWithholdingsPage() {
  const t = useT()
  const router = useRouter()
  const [records, setRecords] = React.useState<WithholdingRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [typeFilter, setTypeFilter] = React.useState<string>('')
  const [statusFilter, setStatusFilter] = React.useState<string>('')

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      let url = '/api/ve-withholdings/records?pageSize=100'
      if (typeFilter) url += `&type=${typeFilter}`
      if (statusFilter) url += `&status=${statusFilter}`
      const call = await apiCall<{ items: WithholdingRow[] }>(url, undefined, { fallback: { items: [] } })
      if (call.ok) { setRecords(call.result?.items ?? []) }
      setIsLoading(false)
    }
    load()
  }, [typeFilter, statusFilter])

  const summary = React.useMemo(() => {
    const ivaRecords = records.filter((r) => r.type === 'iva')
    const islrRecords = records.filter((r) => r.type === 'islr')
    return {
      totalIva: ivaRecords.reduce((sum, r) => sum + Number(r.withholding_amount), 0),
      totalIslr: islrRecords.reduce((sum, r) => sum + Number(r.withholding_amount), 0),
      pendingCount: records.filter((r) => r.status === 'pending').length,
      totalRetenido: records.reduce((sum, r) => sum + Number(r.withholding_amount), 0),
    }
  }, [records])

  const columns: ColumnDef<WithholdingRow>[] = [
    { accessorKey: 'period_month', header: t('ve_withholdings.list.col.period', 'Período'), cell: ({ row }) => { const q = row.original.type === 'iva' ? ` (Q${row.original.fortnight})` : ''; return `${row.original.period_month}${q}` } },
    { accessorKey: 'type', header: t('ve_withholdings.list.col.type', 'Tipo'), cell: ({ row }) => <Badge variant={row.original.type === 'iva' ? 'default' : 'secondary'}>{TYPE_LABELS[row.original.type] ?? row.original.type}</Badge> },
    { accessorKey: 'supplier_rif', header: t('ve_withholdings.list.col.rif', 'RIF Proveedor') },
    { accessorKey: 'supplier_name', header: t('ve_withholdings.list.col.supplier', 'Proveedor'), cell: ({ row }) => <span className="max-w-[180px] truncate block">{row.original.supplier_name}</span> },
    { accessorKey: 'invoice_number', header: t('ve_withholdings.list.col.invoice', 'Nro. Factura') },
    { accessorKey: 'withholding_rate', header: t('ve_withholdings.list.col.rate', '% Ret.'), cell: ({ row }) => `${row.original.withholding_rate}%` },
    { accessorKey: 'withholding_amount', header: t('ve_withholdings.list.col.amount', 'Monto Retenido'), cell: ({ row }) => <span className="font-medium">USD {Number(row.original.withholding_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span> },
    { accessorKey: 'voucher_number', header: t('ve_withholdings.list.col.voucher', 'Comprobante'), cell: ({ row }) => row.original.voucher_number ?? '—' },
    { accessorKey: 'status', header: t('ve_withholdings.list.col.status', 'Estado'), cell: ({ row }) => <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'outline'}>{STATUS_LABELS[row.original.status] ?? row.original.status}</Badge> },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('ve_withholdings.list.title', 'Retenciones IVA / ISLR')}</h1>
          <Button type="button" onClick={() => router.push('/backend/ve_withholdings/create')}>
            <Plus className="mr-2 size-4" />
            {t('ve_withholdings.list.new_button', 'Registrar Retención')}
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">{t('ve_withholdings.list.filter.all_types', 'Todos los tipos')}</option>
            <option value="iva">{t('ve_withholdings.list.filter.iva', 'Retención IVA')}</option>
            <option value="islr">{t('ve_withholdings.list.filter.islr', 'Retención ISLR')}</option>
          </select>
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('ve_withholdings.list.filter.all_statuses', 'Todos los estados')}</option>
            <option value="pending">{t('ve_withholdings.list.filter.pending', 'Pendiente')}</option>
            <option value="applied">{t('ve_withholdings.list.filter.applied', 'Aplicada')}</option>
            <option value="declared">{t('ve_withholdings.list.filter.declared', 'Declarada')}</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('ve_withholdings.list.stat.iva', 'Retención IVA')}</p>
            <p className="text-lg font-bold">USD {summary.totalIva.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('ve_withholdings.list.stat.islr', 'Retención ISLR')}</p>
            <p className="text-lg font-bold">USD {summary.totalIslr.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('ve_withholdings.list.stat.total', 'Total Retenido')}</p>
            <p className="text-lg font-bold">USD {summary.totalRetenido.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('ve_withholdings.list.stat.pending', 'Pendientes por Declarar')}</p>
            <p className="text-lg font-bold">{summary.pendingCount}</p>
          </div>
        </div>

        <DataTable columns={columns} data={records} isLoading={isLoading} searchPlaceholder={t('ve_withholdings.list.search_placeholder', 'Buscar por RIF o proveedor...')} />
      </PageBody>
    </Page>
  )
}
