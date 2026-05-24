'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

export default function CreateLeadPage() {
  const router = useRouter()
  const [planOptions, setPlanOptions] = React.useState<{ value: string; label: string }[]>([])

  React.useEffect(() => {
    apiCall<{ items: any[] }>('/api/isp-plans/plans?pageSize=100', undefined, { fallback: { items: [] } })
      .then((res) => setPlanOptions((res.result?.items ?? []).map((p: any) => ({
        value: p.id, label: `${p.name} — USD ${p.monthly_price_usd}`,
      }))))
  }, [])

  const groups: CrudFormGroup[] = [
    {
      id: 'contact', label: 'Datos del prospecto',
      fields: [
        { id: 'name', label: 'Nombre completo', type: 'text', required: true },
        { id: 'phone', label: 'Teléfono / WhatsApp', type: 'text', required: true, placeholder: '+58 412-555-0100' },
        { id: 'email', label: 'Email (opcional)', type: 'text', placeholder: 'correo@ejemplo.com' },
      ],
    },
    {
      id: 'location', label: 'Ubicación del servicio',
      fields: [
        { id: 'address', label: 'Dirección de instalación', type: 'text', required: true },
        { id: 'city', label: 'Ciudad', type: 'text', required: true },
      ],
    },
    {
      id: 'sales', label: 'Información comercial',
      fields: [
        {
          id: 'source', label: 'Canal de entrada', type: 'select', required: true,
          options: [
            { value: 'whatsapp', label: 'WhatsApp' }, { value: 'instagram', label: 'Instagram' },
            { value: 'referral', label: 'Referido' }, { value: 'website', label: 'Sitio web' },
            { value: 'cold_call', label: 'Llamada fría' }, { value: 'other', label: 'Otro' },
          ],
          defaultValue: 'whatsapp',
        },
        { id: 'interested_plan_id', label: 'Plan de interés', type: 'select', options: planOptions },
        { id: 'notes', label: 'Notas', type: 'textarea' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-sales')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Pipeline
        </Button>
        <h1 className="text-2xl font-bold mb-6">Nuevo Lead / Prospecto</h1>
        <CrudForm
          fields={[] as any[]}
          groups={groups}
          cancelHref="/backend/isp-sales"
          onSubmit={async (values) => {
            await createCrud('isp-sales/leads', values)
            flash('Lead registrado', 'success')
            router.push('/backend/isp-sales')
          }}
        />
      </PageBody>
    </Page>
  )
}
