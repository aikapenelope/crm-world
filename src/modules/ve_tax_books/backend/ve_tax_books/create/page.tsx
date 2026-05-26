'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { BookOpen } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function CreateTaxBookEntryPage() {
  const t = useT()
  const router = useRouter()

  const currentPeriod = React.useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const today = new Date().toISOString().split('T')[0]

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'document',
        column: 1,
        title: 'Datos del documento',
        fields: [
          { id: 'book_type', type: 'select', label: 'Tipo de libro', required: true, options: [{ label: 'Libro de Ventas', value: 'sales' }, { label: 'Libro de Compras', value: 'purchases' }] },
          { id: 'period_month', type: 'text', label: 'Período (YYYY-MM)', required: true, defaultValue: currentPeriod, placeholder: '2026-05' },
          { id: 'entry_date', type: 'text', label: 'Fecha del documento', required: true, defaultValue: today, placeholder: 'YYYY-MM-DD' },
          { id: 'document_type', type: 'select', label: 'Tipo de documento', required: true, options: [
            { label: 'Factura', value: 'factura' },
            { label: 'Nota de Crédito', value: 'nota_credito' },
            { label: 'Nota de Débito', value: 'nota_debito' },
            { label: 'Comprobante de Retención', value: 'comprobante_retencion' },
          ]},
          { id: 'document_number', type: 'text', label: 'Número de documento', required: true, placeholder: '00001234' },
          { id: 'control_number', type: 'text', label: 'Número de control', placeholder: '00-00001234 (opcional)' },
        ],
      },
      {
        id: 'counterpart',
        column: 1,
        title: 'Contraparte',
        fields: [
          { id: 'counterpart_rif', type: 'text', label: 'RIF', required: true, placeholder: 'J-12345678-9' },
          { id: 'counterpart_name', type: 'text', label: 'Razón Social', required: true, placeholder: 'Nombre de la empresa' },
        ],
      },
      {
        id: 'amounts',
        column: 2,
        title: 'Montos',
        fields: [
          { id: 'taxable_base', type: 'text', label: 'Base imponible', required: true, placeholder: '1000.00' },
          { id: 'tax_rate', type: 'select', label: 'Tasa IVA (%)', defaultValue: '16.00', options: [
            { label: '16% (General)', value: '16.00' },
            { label: '8% (Reducido)', value: '8.00' },
            { label: '15% (Lujo)', value: '15.00' },
            { label: '0% (Exento)', value: '0.00' },
          ]},
          { id: 'tax_amount', type: 'text', label: 'Monto IVA', placeholder: '160.00 (se calcula automáticamente)' },
          { id: 'igtf_amount', type: 'text', label: 'Monto IGTF', defaultValue: '0.00', placeholder: '0.00' },
          { id: 'withholding_amount', type: 'text', label: 'Retención IVA', defaultValue: '0.00', placeholder: '0.00' },
          { id: 'total_amount', type: 'text', label: 'Total documento', required: true, placeholder: '1160.00' },
        ],
      },
      {
        id: 'payment',
        column: 2,
        title: 'Pago y moneda',
        fields: [
          { id: 'currency', type: 'select', label: 'Moneda', defaultValue: 'USD', options: [
            { label: 'USD', value: 'USD' }, { label: 'VES (Bolívares)', value: 'VES' },
            { label: 'EUR', value: 'EUR' }, { label: 'USDT', value: 'USDT' },
          ]},
          { id: 'exchange_rate', type: 'text', label: 'Tasa de cambio (BCV)', placeholder: 'Ej: 36.50' },
          { id: 'payment_method_code', type: 'select', label: 'Método de pago', options: [
            { label: '— Sin especificar —', value: '' },
            { label: 'Pago Móvil', value: 'pago_movil' },
            { label: 'Zelle', value: 'zelle' },
            { label: 'Binance (USDT)', value: 'binance' },
            { label: 'Transferencia', value: 'transferencia' },
            { label: 'Efectivo USD', value: 'efectivo_usd' },
            { label: 'Efectivo Bs.', value: 'efectivo_ves' },
            { label: 'Punto de Venta', value: 'debito' },
          ]},
          { id: 'is_exempt', type: 'checkbox', label: 'Operación exenta de IVA' },
          { id: 'notes', type: 'textarea', label: 'Notas', placeholder: 'Observaciones...' },
        ],
      },
    ],
    [currentPeriod, today],
  )

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('ve_tax_books.create.title', 'Registrar Entrada Fiscal')}</h1>
            <p className="text-sm text-muted-foreground">{t('ve_tax_books.create.subtitle', 'Agregar factura al libro de compras o ventas')}</p>
          </div>
        </div>

        <CrudForm
          backHref="/backend/ve_tax_books"
          fields={[]}
          groups={groups}
          submitLabel={t('ve_tax_books.create.submit', 'Registrar Entrada')}
          cancelHref="/backend/ve_tax_books"
          onSubmit={async (values) => {
            const payload = {
              book_type: String(values.book_type),
              period_month: String(values.period_month),
              entry_date: String(values.entry_date),
              document_type: String(values.document_type),
              document_number: String(values.document_number),
              control_number: values.control_number ? String(values.control_number).trim() : null,
              counterpart_rif: String(values.counterpart_rif).trim(),
              counterpart_name: String(values.counterpart_name).trim(),
              is_exempt: Boolean(values.is_exempt),
              taxable_base: String(values.taxable_base),
              tax_rate: String(values.tax_rate || '16.00'),
              tax_amount: String(values.tax_amount || '0.00'),
              igtf_amount: String(values.igtf_amount || '0.00'),
              withholding_amount: String(values.withholding_amount || '0.00'),
              total_amount: String(values.total_amount),
              currency: String(values.currency || 'USD'),
              exchange_rate: values.exchange_rate ? String(values.exchange_rate) : null,
              payment_method_code: values.payment_method_code ? String(values.payment_method_code) : null,
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await createCrud('ve-tax-books/entries', payload)
            flash(t('ve_tax_books.create.success', 'Entrada fiscal registrada exitosamente'), 'success')
            router.push('/backend/ve_tax_books')
          }}
        />
      </PageBody>
    </Page>
  )
}
