'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { CreditCard } from 'lucide-react'

export default function CreateCreditLimitPage() {
  const router = useRouter()

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'credit',
        column: 1,
        label: 'Datos del crédito',
        fields: [
          { id: 'customer_id', type: 'text', label: 'ID del Cliente', required: true, placeholder: 'UUID del cliente (customers module)' },
          { id: 'credit_limit', type: 'text', label: 'Límite de crédito (USD)', required: true, placeholder: '5000.00' },
          {
            id: 'currency', type: 'select', label: 'Moneda', defaultValue: 'USD',
            options: [
              { label: 'USD', value: 'USD' },
              { label: 'EUR', value: 'EUR' },
            ],
          },
          {
            id: 'payment_terms_days', type: 'select', label: 'Plazo de pago', defaultValue: '30',
            options: [
              { label: '15 días', value: '15' },
              { label: '30 días', value: '30' },
              { label: '45 días', value: '45' },
              { label: '60 días', value: '60' },
              { label: '90 días', value: '90' },
            ],
          },
          {
            id: 'status', type: 'select', label: 'Estado', defaultValue: 'active',
            options: [
              { label: 'Activo', value: 'active' },
              { label: 'Suspendido', value: 'suspended' },
              { label: 'Bloqueado', value: 'blocked' },
            ],
          },
          { id: 'notes', type: 'textarea', label: 'Notas', placeholder: 'Observaciones sobre el crédito...' },
        ],
      },
    ],
    [],
  )

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Asignar Crédito</h1>
            <p className="text-sm text-muted-foreground">Definir límite de crédito para un cliente</p>
          </div>
        </div>

        <CrudForm
          backHref="/backend/dist_credit"
          fields={[]}
          groups={groups}
          submitLabel="Asignar Crédito"
          cancelHref="/backend/dist_credit"
          onSubmit={async (values) => {
            const payload = {
              customer_id: String(values.customer_id).trim(),
              credit_limit: String(values.credit_limit),
              currency: String(values.currency || 'USD'),
              payment_terms_days: Number(values.payment_terms_days) || 30,
              status: String(values.status || 'active'),
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await createCrud('dist-credit/limits', payload)
            flash('Crédito asignado exitosamente', 'success')
            router.push('/backend/dist_credit')
          }}
        />
      </PageBody>
    </Page>
  )
}
