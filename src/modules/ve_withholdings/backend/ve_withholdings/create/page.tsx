'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Receipt } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function CreateWithholdingPage() {
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
        id: 'withholding',
        column: 1,
        title: 'Datos de la retención',
        fields: [
          { id: 'type', type: 'select', label: 'Tipo de retención', required: true, options: [
            { label: 'Retención IVA (75%)', value: 'iva' },
            { label: 'Retención ISLR', value: 'islr' },
          ]},
          { id: 'period_month', type: 'text', label: 'Período (YYYY-MM)', required: true, defaultValue: currentPeriod, placeholder: '2026-05' },
          { id: 'fortnight', type: 'select', label: 'Quincena (solo IVA)', defaultValue: '1', options: [
            { label: 'Primera quincena (1-15)', value: '1' },
            { label: 'Segunda quincena (16-fin)', value: '2' },
          ]},
          { id: 'withholding_rate', type: 'select', label: 'Porcentaje de retención', required: true, options: [
            { label: '75% — IVA (agente de retención)', value: '75.00' },
            { label: '100% — IVA (contribuyente no domiciliado)', value: '100.00' },
            { label: '5% — ISLR (servicios profesionales)', value: '5.00' },
            { label: '3% — ISLR (transporte)', value: '3.00' },
            { label: '2% — ISLR (compras de bienes)', value: '2.00' },
            { label: '1% — ISLR (seguros)', value: '1.00' },
            { label: '34% — ISLR (no domiciliados)', value: '34.00' },
          ]},
        ],
      },
      {
        id: 'supplier',
        column: 1,
        title: 'Datos del proveedor',
        fields: [
          { id: 'supplier_rif', type: 'text', label: 'RIF del proveedor', required: true, placeholder: 'J-12345678-9' },
          { id: 'supplier_name', type: 'text', label: 'Razón social', required: true, placeholder: 'Nombre del proveedor' },
        ],
      },
      {
        id: 'invoice',
        column: 2,
        title: 'Datos de la factura',
        fields: [
          { id: 'invoice_number', type: 'text', label: 'Número de factura', required: true, placeholder: '00001234' },
          { id: 'invoice_date', type: 'text', label: 'Fecha de factura', required: true, defaultValue: today, placeholder: 'YYYY-MM-DD' },
          { id: 'invoice_amount', type: 'text', label: 'Monto total factura', required: true, placeholder: '1160.00' },
          { id: 'tax_amount', type: 'text', label: 'Monto IVA de la factura', required: true, placeholder: '160.00' },
        ],
      },
      {
        id: 'result',
        column: 2,
        title: 'Resultado',
        fields: [
          { id: 'withholding_amount', type: 'text', label: 'Monto retenido (calculado)', required: true, placeholder: '120.00' },
          { id: 'voucher_number', type: 'text', label: 'Nro. comprobante de retención', placeholder: 'Se genera al aplicar' },
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
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('ve_withholdings.create.title', 'Registrar Retención')}</h1>
            <p className="text-sm text-muted-foreground">{t('ve_withholdings.create.subtitle', 'Calcular y registrar retención de IVA o ISLR a un proveedor')}</p>
          </div>
        </div>

        <CrudForm
          backHref="/backend/ve_withholdings"
          fields={[]}
          groups={groups}
          submitLabel={t('ve_withholdings.create.submit', 'Registrar Retención')}
          cancelHref="/backend/ve_withholdings"
          onSubmit={async (values) => {
            const payload = {
              type: String(values.type),
              period_month: String(values.period_month),
              fortnight: Number(values.fortnight) || 1,
              supplier_rif: String(values.supplier_rif).trim(),
              supplier_name: String(values.supplier_name).trim(),
              invoice_number: String(values.invoice_number).trim(),
              invoice_date: String(values.invoice_date),
              invoice_amount: String(values.invoice_amount),
              tax_amount: String(values.tax_amount),
              withholding_rate: String(values.withholding_rate),
              withholding_amount: String(values.withholding_amount),
              voucher_number: values.voucher_number ? String(values.voucher_number).trim() : null,
              status: 'pending',
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await createCrud('ve-withholdings/records', payload)
            flash(t('ve_withholdings.create.success', 'Retención registrada exitosamente'), 'success')
            router.push('/backend/ve_withholdings')
          }}
        />
      </PageBody>
    </Page>
  )
}
