'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

export default function CreateTransactionPage() {
  const router = useRouter()
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'basic',
        column: 1,
        title: 'Datos de la operación',
        fields: [
          {
            id: 'transaction_type', type: 'select', label: 'Tipo de operación', required: true,
            defaultValue: 'sale',
            options: [
              { label: 'Venta', value: 'sale' },
              { label: 'Alquiler', value: 'lease' },
            ],
          },
          {
            id: 'status', type: 'select', label: 'Estado', defaultValue: 'pending',
            options: [
              { label: 'Pendiente', value: 'pending' },
              { label: 'Completada', value: 'completed' },
            ],
          },
          { id: 'property_id', type: 'text', label: 'ID de Propiedad', required: true, placeholder: 'UUID de la propiedad' },
          { id: 'contact_id', type: 'text', label: 'Comprador / Inquilino', placeholder: 'UUID del contacto (opcional)' },
          { id: 'closing_date', type: 'text', label: 'Fecha de cierre', placeholder: 'YYYY-MM-DD (opcional)' },
        ],
      },
      {
        id: 'financial',
        column: 2,
        title: 'Datos financieros',
        fields: [
          { id: 'sale_price', type: 'text', label: 'Precio', required: true, placeholder: '150000.00' },
          {
            id: 'currency', type: 'select', label: 'Moneda', defaultValue: 'USD',
            options: [
              { label: 'USD', value: 'USD' },
              { label: 'EUR', value: 'EUR' },
              { label: 'VES', value: 'VES' },
              { label: 'USDT', value: 'USDT' },
            ],
          },
          { id: 'commission_rate', type: 'text', label: 'Comisión (%)', defaultValue: '5.00', placeholder: '5.00' },
          { id: 'commission_amount', type: 'text', label: 'Monto comisión (opcional)', placeholder: 'Se calcula automáticamente si se deja vacío' },
          {
            id: 'payment_method_code', type: 'select', label: 'Método de pago',
            options: [
              { label: '— Sin especificar —', value: '' },
              { label: 'Transferencia bancaria', value: 'transferencia' },
              { label: 'Pago móvil', value: 'pago_movil' },
              { label: 'Zelle', value: 'zelle' },
              { label: 'Efectivo USD', value: 'efectivo_usd' },
              { label: 'Efectivo Bs.', value: 'efectivo_ves' },
              { label: 'Binance Pay', value: 'binance' },
              { label: 'Cheque', value: 'cheque' },
            ],
          },
        ],
      },
      {
        id: 'lease',
        column: 1,
        title: 'Datos de alquiler',
        fields: [
          { id: 'monthly_rent', type: 'text', label: 'Canon mensual', placeholder: '1500.00' },
          { id: 'lease_start', type: 'text', label: 'Inicio del contrato', placeholder: 'YYYY-MM-DD' },
          { id: 'lease_end', type: 'text', label: 'Fin del contrato', placeholder: 'YYYY-MM-DD' },
          { id: 'lease_months', type: 'number', label: 'Duración (meses)', min: 1, max: 120 },
        ],
      },
      {
        id: 'agents',
        column: 2,
        title: 'Agentes',
        fields: [
          { id: 'listing_agent_id', type: 'text', label: 'Agente captador', placeholder: 'UUID (opcional)' },
          { id: 'buyer_agent_id', type: 'text', label: 'Agente comprador', placeholder: 'UUID (opcional)' },
        ],
      },
      {
        id: 'notes_group',
        column: 1,
        title: 'Notas',
        fields: [
          { id: 'notes', type: 'textarea', label: 'Notas internas', placeholder: 'Observaciones sobre la transacción...' },
        ],
      },
    ],
    [],
  )

  return (
    <Page>
      <PageBody>
        <CrudForm
          title="Registrar Cierre"
          backHref="/backend/transactions"
          fields={[]}
          groups={groups}
          submitLabel="Registrar Transacción"
          cancelHref="/backend/transactions"
          onSubmit={async (values) => {
            const closingDate = values.closing_date
              ? new Date(String(values.closing_date)).toISOString()
              : null
            const leaseStart = values.lease_start
              ? new Date(String(values.lease_start)).toISOString()
              : null
            const leaseEnd = values.lease_end
              ? new Date(String(values.lease_end)).toISOString()
              : null

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

            // Lease-specific fields
            if (values.transaction_type === 'lease') {
              payload.monthly_rent = values.monthly_rent ? String(values.monthly_rent) : null
              payload.lease_start = leaseStart
              payload.lease_end = leaseEnd
              payload.lease_months = values.lease_months ? Number(values.lease_months) : null
            }

            await createCrud('transactions', payload)
            flash('Transacción registrada exitosamente', 'success')
            router.push('/backend/transactions')
          }}
        />
      </PageBody>
    </Page>
  )
}
