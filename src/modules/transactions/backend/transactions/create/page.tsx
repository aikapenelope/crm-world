'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import { useT } from '@open-mercato/shared/lib/i18n/context'

export default function CreateTransactionPage() {
  const t = useT()
  const router = useRouter()
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'basic', column: 1, title: t('transactions.create.group.basic', 'Datos de la operación'),
        fields: [
          { id: 'transaction_type', type: 'select', label: t('transactions.create.field.type', 'Tipo de operación'), required: true, defaultValue: 'sale', options: [
            { label: t('transactions.create.option.sale', 'Venta'), value: 'sale' },
            { label: t('transactions.create.option.lease', 'Alquiler'), value: 'lease' },
          ]},
          { id: 'status', type: 'select', label: t('transactions.create.field.status', 'Estado'), defaultValue: 'pending', options: [
            { label: t('transactions.create.option.pending', 'Pendiente'), value: 'pending' },
            { label: t('transactions.create.option.completed', 'Completada'), value: 'completed' },
          ]},
          { id: 'property_id', type: 'text', label: t('transactions.create.field.property_id', 'ID de Propiedad'), required: true, placeholder: 'UUID de la propiedad' },
          { id: 'contact_id', type: 'text', label: t('transactions.create.field.contact_id', 'Comprador / Inquilino'), placeholder: 'UUID del contacto (opcional)' },
          { id: 'closing_date', type: 'text', label: t('transactions.create.field.closing_date', 'Fecha de cierre'), placeholder: 'YYYY-MM-DD (opcional)' },
        ],
      },
      {
        id: 'financial', column: 2, title: t('transactions.create.group.financial', 'Datos financieros'),
        fields: [
          { id: 'sale_price', type: 'text', label: t('transactions.create.field.price', 'Precio'), required: true, placeholder: '150000.00' },
          { id: 'currency', type: 'select', label: t('transactions.create.field.currency', 'Moneda'), defaultValue: 'USD', options: [
            { label: 'USD', value: 'USD' },
            { label: 'EUR', value: 'EUR' },
            { label: 'VES', value: 'VES' },
            { label: 'USDT', value: 'USDT' },
          ]},
          { id: 'commission_rate', type: 'text', label: t('transactions.create.field.commission_rate', 'Comisión (%)'), defaultValue: '5.00', placeholder: '5.00' },
          { id: 'commission_amount', type: 'text', label: t('transactions.create.field.commission_amount', 'Monto comisión (opcional)'), placeholder: t('transactions.create.field.commission_amount_hint', 'Se calcula automáticamente si se deja vacío') },
          { id: 'payment_method_code', type: 'select', label: t('transactions.create.field.payment_method', 'Método de pago'), options: [
            { label: t('transactions.create.option.no_payment', '— Sin especificar —'), value: '' },
            { label: t('transactions.create.option.transfer', 'Transferencia bancaria'), value: 'transferencia' },
            { label: t('transactions.create.option.mobile_pay', 'Pago móvil'), value: 'pago_movil' },
            { label: 'Zelle', value: 'zelle' },
            { label: t('transactions.create.option.cash_usd', 'Efectivo USD'), value: 'efectivo_usd' },
            { label: t('transactions.create.option.cash_ves', 'Efectivo Bs.'), value: 'efectivo_ves' },
            { label: 'Binance Pay', value: 'binance' },
            { label: t('transactions.create.option.check', 'Cheque'), value: 'cheque' },
          ]},
        ],
      },
      {
        id: 'lease', column: 1, title: t('transactions.create.group.lease', 'Datos de alquiler'),
        fields: [
          { id: 'monthly_rent', type: 'text', label: t('transactions.create.field.monthly_rent', 'Canon mensual'), placeholder: '1500.00' },
          { id: 'lease_start', type: 'text', label: t('transactions.create.field.lease_start', 'Inicio del contrato'), placeholder: 'YYYY-MM-DD' },
          { id: 'lease_end', type: 'text', label: t('transactions.create.field.lease_end', 'Fin del contrato'), placeholder: 'YYYY-MM-DD' },
          { id: 'lease_months', type: 'number', label: t('transactions.create.field.lease_months', 'Duración (meses)'), min: 1, max: 120 },
        ],
      },
      {
        id: 'agents', column: 2, title: t('transactions.create.group.agents', 'Agentes'),
        fields: [
          { id: 'listing_agent_id', type: 'text', label: t('transactions.create.field.listing_agent', 'Agente captador'), placeholder: 'UUID (opcional)' },
          { id: 'buyer_agent_id', type: 'text', label: t('transactions.create.field.buyer_agent', 'Agente comprador'), placeholder: 'UUID (opcional)' },
        ],
      },
      {
        id: 'notes_group', column: 1, title: t('transactions.create.group.notes', 'Notas'),
        fields: [
          { id: 'notes', type: 'textarea', label: t('transactions.create.field.notes', 'Notas internas'), placeholder: t('transactions.create.field.notes_hint', 'Observaciones sobre la transacción...') },
        ],
      },
    ],
    [t],
  )

  return (
    <Page>
      <PageBody>
        <CrudForm
          title={t('transactions.create.title', 'Registrar Cierre')}
          backHref="/backend/transactions"
          fields={[]}
          groups={groups}
          submitLabel={t('transactions.create.submit', 'Registrar Transacción')}
          cancelHref="/backend/transactions"
          onSubmit={async (values) => {
            const closingDate = values.closing_date ? new Date(String(values.closing_date)).toISOString() : null
            const leaseStart = values.lease_start ? new Date(String(values.lease_start)).toISOString() : null
            const leaseEnd = values.lease_end ? new Date(String(values.lease_end)).toISOString() : null

            const payload: Record<string, unknown> = {
              organizationId,
              tenantId,
              property_id: String(values.property_id || '').trim(),
              contact_id: values.contact_id ? String(values.contact_id).trim() : null,
              transaction_type: String(values.transaction_type || 'sale'),
              status: String(values.status || 'pending'),
              closing_date: closingDate,
              sale_price: String(values.sale_price || '0'),
              currency: String(values.currency || 'USD'),
              commission_rate: String(values.commission_rate || '5.00'),
              commission_amount: values.commission_amount ? String(values.commission_amount) : null,
              payment_method_code: values.payment_method_code ? String(values.payment_method_code) : null,
              listing_agent_id: values.listing_agent_id ? String(values.listing_agent_id).trim() : null,
              buyer_agent_id: values.buyer_agent_id ? String(values.buyer_agent_id).trim() : null,
              notes: values.notes ? String(values.notes).trim() : null,
            }

            if (values.transaction_type === 'lease') {
              payload.monthly_rent = values.monthly_rent ? String(values.monthly_rent) : null
              payload.lease_start = leaseStart
              payload.lease_end = leaseEnd
              payload.lease_months = values.lease_months ? Number(values.lease_months) : null
            }

            await createCrud('transactions/transactions', payload)
            flash(t('transactions.create.success', 'Transacción registrada exitosamente'), 'success')
            router.push('/backend/transactions')
          }}
        />
      </PageBody>
    </Page>
  )
}
