'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Download, FileSpreadsheet, BarChart3 } from 'lucide-react'

type TaxSummary = {
  period_month: string
  sales: { count: number; taxable_base: string; tax_amount: string; igtf_amount: string; total_amount: string }
  purchases: { count: number; taxable_base: string; tax_amount: string; igtf_amount: string; total_amount: string }
  iva: { debito_fiscal: string; credito_fiscal: string; iva_a_pagar: string }
  igtf: { total: string }
  withholdings: { iva_count: number; iva_total: string; islr_count: number; islr_total: string }
  sales_entries: any[]
  purchase_entries: any[]
  withholding_records: any[]
}

export default function VeTaxReportsPage() {
  const [period, setPeriod] = React.useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [summary, setSummary] = React.useState<TaxSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const loadReport = React.useCallback(async () => {
    setIsLoading(true)
    const call = await apiCall<TaxSummary>(
      `/api/ve-tax-reports/summary?period_month=${period}`,
      undefined,
      { fallback: null as any },
    )
    if (call.ok && call.result) {
      setSummary(call.result)
    }
    setIsLoading(false)
  }, [period])

  React.useEffect(() => {
    loadReport()
  }, [loadReport])

  // Export to CSV
  const exportCSV = React.useCallback((type: 'sales' | 'purchases' | 'withholdings') => {
    if (!summary) return

    let rows: string[][] = []
    let filename = ''

    if (type === 'sales') {
      filename = `libro_ventas_${period}.csv`
      rows = [
        ['Fecha', 'Tipo Doc.', 'Nro. Doc.', 'Nro. Control', 'RIF', 'Nombre', 'Base Imponible', 'Tasa IVA', 'Monto IVA', 'IGTF', 'Total'],
        ...summary.sales_entries.map((e: any) => [
          e.entry_date, e.document_type, e.document_number, e.control_number || '',
          e.counterpart_rif, e.counterpart_name, e.taxable_base, e.tax_rate,
          e.tax_amount, e.igtf_amount, e.total_amount,
        ]),
      ]
    } else if (type === 'purchases') {
      filename = `libro_compras_${period}.csv`
      rows = [
        ['Fecha', 'Tipo Doc.', 'Nro. Doc.', 'Nro. Control', 'RIF', 'Nombre', 'Base Imponible', 'Tasa IVA', 'Monto IVA', 'IGTF', 'Total'],
        ...summary.purchase_entries.map((e: any) => [
          e.entry_date, e.document_type, e.document_number, e.control_number || '',
          e.counterpart_rif, e.counterpart_name, e.taxable_base, e.tax_rate,
          e.tax_amount, e.igtf_amount, e.total_amount,
        ]),
      ]
    } else {
      filename = `retenciones_${period}.csv`
      rows = [
        ['Tipo', 'Período', 'Quincena', 'RIF Proveedor', 'Proveedor', 'Nro. Factura', 'Fecha Factura', 'Monto Factura', 'IVA Factura', '% Retención', 'Monto Retenido', 'Comprobante', 'Estado'],
        ...summary.withholding_records.map((w: any) => [
          w.type, w.period_month, w.fortnight, w.supplier_rif, w.supplier_name,
          w.invoice_number, w.invoice_date, w.invoice_amount, w.tax_amount,
          w.withholding_rate, w.withholding_amount, w.voucher_number || '', w.status,
        ]),
      ]
    }

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, [summary, period])

  const fmt = (val: string) => Number(val).toLocaleString('es-VE', { minimumFractionDigits: 2 })

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reportes Fiscales</h1>
            <p className="text-sm text-muted-foreground">Resumen mensual para declaración ante el SENIAT</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium">Período:</label>
          <input
            type="month"
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
          <Button type="button" variant="outline" size="sm" onClick={loadReport} disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </div>

        {summary && (
          <>
            {/* IVA Summary */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Resumen IVA — {period}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Débito Fiscal (IVA Ventas)</p>
                  <p className="text-2xl font-bold">USD {fmt(summary.iva.debito_fiscal)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary.sales.count} facturas emitidas</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground">Crédito Fiscal (IVA Compras)</p>
                  <p className="text-2xl font-bold">USD {fmt(summary.iva.credito_fiscal)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{summary.purchases.count} facturas recibidas</p>
                </div>
                <div className="rounded-lg border p-4 border-primary/30">
                  <p className="text-xs text-muted-foreground">IVA a Pagar / A Favor</p>
                  <p className={`text-2xl font-bold ${Number(summary.iva.iva_a_pagar) >= 0 ? 'text-foreground' : 'text-primary'}`}>
                    USD {fmt(summary.iva.iva_a_pagar)}
                  </p>
                  <Badge variant={Number(summary.iva.iva_a_pagar) >= 0 ? 'outline' : 'default'} className="mt-1">
                    {Number(summary.iva.iva_a_pagar) >= 0 ? 'A pagar' : 'A favor'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* IGTF & Withholdings */}
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">IGTF del Período</p>
                <p className="text-lg font-bold">USD {fmt(summary.igtf.total)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Retenciones IVA</p>
                <p className="text-lg font-bold">USD {fmt(summary.withholdings.iva_total)}</p>
                <p className="text-xs text-muted-foreground mt-1">{summary.withholdings.iva_count} comprobantes</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Retenciones ISLR</p>
                <p className="text-lg font-bold">USD {fmt(summary.withholdings.islr_total)}</p>
                <p className="text-xs text-muted-foreground mt-1">{summary.withholdings.islr_count} comprobantes</p>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold mb-3">Exportar para el Contador</h3>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => exportCSV('sales')}>
                  <FileSpreadsheet className="mr-2 size-4" />
                  Libro de Ventas (CSV)
                </Button>
                <Button type="button" variant="outline" onClick={() => exportCSV('purchases')}>
                  <FileSpreadsheet className="mr-2 size-4" />
                  Libro de Compras (CSV)
                </Button>
                <Button type="button" variant="outline" onClick={() => exportCSV('withholdings')}>
                  <Download className="mr-2 size-4" />
                  Retenciones (CSV)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Los archivos CSV se pueden abrir en Excel para revisión y declaración.
              </p>
            </div>
          </>
        )}

        {!summary && !isLoading && (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">No hay datos para el período seleccionado.</p>
            <p className="text-xs text-muted-foreground mt-1">Registre entradas en los Libros Fiscales y Retenciones primero.</p>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
