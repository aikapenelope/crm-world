'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Download } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type EntryRow = {
  id: string
  book_type: string
  period_month: string
  entry_date: string
  document_type: string
  document_number: string
  control_number: string | null
  counterpart_rif: string
  counterpart_name: string
  is_exempt: boolean
  taxable_base: string
  tax_rate: string
  tax_amount: string
  igtf_amount: string
  withholding_amount: string
  total_amount: string
  currency: string
}

const BOOK_TYPE_LABELS: Record<string, string> = {
  sales: 'Ventas', purchases: 'Compras',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  factura: 'Factura', nota_credito: 'Nota de Crédito',
  nota_debito: 'Nota de Débito', comprobante_retencion: 'Comp. Retención',
}

export default function VeTaxBooksPage() {
  const t = useT()
  const router = useRouter()
  const [entries, setEntries] = React.useState<EntryRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [bookFilter, setBookFilter] = React.useState<string>('')
  const [periodFilter, setPeriodFilter] = React.useState<string>('')

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      let url = '/api/ve-tax-books/entries?pageSize=100'
      if (bookFilter) url += `&book_type=${bookFilter}`
      if (periodFilter) url += `&period_month=${periodFilter}`
      const call = await apiCall<{ items: EntryRow[] }>(url, undefined, { fallback: { items: [] } })
      if (call.ok) { setEntries(call.result?.items ?? []) }
      setIsLoading(false)
    }
    load()
  }, [bookFilter, periodFilter])

  const currentPeriod = React.useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const summary = React.useMemo(() => {
    const salesEntries = entries.filter((e) => e.book_type === 'sales')
    const purchaseEntries = entries.filter((e) => e.book_type === 'purchases')
    const salesTax = salesEntries.reduce((sum, e) => sum + Number(e.tax_amount), 0)
    const purchasesTax = purchaseEntries.reduce((sum, e) => sum + Number(e.tax_amount), 0)
    const igtfTotal = entries.reduce((sum, e) => sum + Number(e.igtf_amount), 0)
    return { debitoFiscal: salesTax, creditoFiscal: purchasesTax, ivaAPagar: salesTax - purchasesTax, igtfTotal }
  }, [entries])

  const columns: ColumnDef<EntryRow>[] = [
    { accessorKey: 'entry_date', header: t('ve_tax_books.list.col.date', 'Fecha'), cell: ({ row }) => new Date(row.original.entry_date).toLocaleDateString('es-VE') },
    { accessorKey: 'book_type', header: t('ve_tax_books.list.col.book', 'Libro'), cell: ({ row }) => <Badge variant={row.original.book_type === 'sales' ? 'default' : 'secondary'}>{BOOK_TYPE_LABELS[row.original.book_type] ?? row.original.book_type}</Badge> },
    { accessorKey: 'document_type', header: t('ve_tax_books.list.col.doc_type', 'Tipo Doc.'), cell: ({ row }) => DOC_TYPE_LABELS[row.original.document_type] ?? row.original.document_type },
    { accessorKey: 'document_number', header: t('ve_tax_books.list.col.doc_number', 'Nro. Doc.') },
    { accessorKey: 'counterpart_rif', header: t('ve_tax_books.list.col.rif', 'RIF') },
    { accessorKey: 'counterpart_name', header: t('ve_tax_books.list.col.name', 'Nombre'), cell: ({ row }) => <span className="max-w-[200px] truncate block">{row.original.counterpart_name}</span> },
    { accessorKey: 'taxable_base', header: t('ve_tax_books.list.col.taxable', 'Base Imp.'), cell: ({ row }) => `${row.original.currency} ${Number(row.original.taxable_base).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` },
    { accessorKey: 'tax_amount', header: t('ve_tax_books.list.col.iva', 'IVA'), cell: ({ row }) => { const amount = Number(row.original.tax_amount); return amount > 0 ? `${row.original.currency} ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '—' } },
    { accessorKey: 'total_amount', header: t('ve_tax_books.list.col.total', 'Total'), cell: ({ row }) => <span className="font-medium">{row.original.currency} {Number(row.original.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span> },
  ]

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('ve_tax_books.list.title', 'Libros Fiscales IVA')}</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/ve_tax_books/export')}>
              <Download className="mr-2 size-4" />
              {t('ve_tax_books.list.export_button', 'Exportar')}
            </Button>
            <Button type="button" onClick={() => router.push('/backend/ve_tax_books/create')}>
              <Plus className="mr-2 size-4" />
              {t('ve_tax_books.list.new_button', 'Registrar')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <select className="rounded-md border bg-background px-3 py-2 text-sm" value={bookFilter} onChange={(e) => setBookFilter(e.target.value)}>
            <option value="">{t('ve_tax_books.list.filter.all_books', 'Todos los libros')}</option>
            <option value="sales">{t('ve_tax_books.list.filter.sales', 'Libro de Ventas')}</option>
            <option value="purchases">{t('ve_tax_books.list.filter.purchases', 'Libro de Compras')}</option>
          </select>
          <input type="month" className="rounded-md border bg-background px-3 py-2 text-sm" value={periodFilter || currentPeriod} onChange={(e) => setPeriodFilter(e.target.value)} />
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('ve_tax_books.list.stat.debit', 'Débito Fiscal (Ventas)')}</p>
            <p className="text-lg font-bold">USD {summary.debitoFiscal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('ve_tax_books.list.stat.credit', 'Crédito Fiscal (Compras)')}</p>
            <p className="text-lg font-bold">USD {summary.creditoFiscal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('ve_tax_books.list.stat.iva_due', 'IVA a Pagar / A Favor')}</p>
            <p className={`text-lg font-bold ${summary.ivaAPagar >= 0 ? 'text-foreground' : 'text-primary'}`}>
              USD {summary.ivaAPagar.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{t('ve_tax_books.list.stat.igtf', 'IGTF del Período')}</p>
            <p className="text-lg font-bold">USD {summary.igtfTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <DataTable columns={columns} data={entries} isLoading={isLoading} searchPlaceholder={t('ve_tax_books.list.search_placeholder', 'Buscar por RIF, nombre o número...')} />
      </PageBody>
    </Page>
  )
}
