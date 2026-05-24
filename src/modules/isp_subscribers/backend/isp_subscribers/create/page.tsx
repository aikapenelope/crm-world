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

export default function CreateIspSubscriberPage() {
  const router = useRouter()
  const [planOptions, setPlanOptions] = React.useState<{ value: string; label: string }[]>([])
  const [nodeOptions, setNodeOptions] = React.useState<{ value: string; label: string }[]>([])

  React.useEffect(() => {
    async function loadOptions() {
      const [plansRes, nodesRes] = await Promise.all([
        apiCall<{ items: any[] }>('/api/isp-plans/plans?pageSize=100', undefined, { fallback: { items: [] } }),
        apiCall<{ items: any[] }>('/api/isp-network/nodes?pageSize=100', undefined, { fallback: { items: [] } }),
      ])
      setPlanOptions((plansRes.result?.items ?? []).map((p: any) => ({
        value: p.id, label: `${p.name} — USD ${p.monthly_price_usd}`,
      })))
      setNodeOptions((nodesRes.result?.items ?? []).map((n: any) => ({
        value: n.id, label: `${n.name} (${n.city})`,
      })))
    }
    loadOptions()
  }, [])

  const groups: CrudFormGroup[] = [
    {
      id: 'account', label: 'Cuenta',
      fields: [
        { id: 'account_number', label: 'Número de cuenta', type: 'text', required: true, placeholder: 'NETBQ-00001' },
        {
          id: 'subscriber_type', label: 'Tipo de abonado', type: 'select', required: true,
          options: [
            { value: 'residential', label: 'Residencial' }, { value: 'pyme', label: 'PYME' },
            { value: 'corporate', label: 'Corporativo' }, { value: 'wholesale', label: 'Mayorista' },
          ],
          defaultValue: 'residential',
        },
        { id: 'plan_id', label: 'Plan de servicio', type: 'select', options: planOptions },
        { id: 'monthly_price_usd', label: 'Precio mensual (USD)', type: 'text', required: true, placeholder: '25.00' },
      ],
    },
    {
      id: 'location', label: 'Instalación',
      fields: [
        { id: 'node_id', label: 'Nodo de red', type: 'select', options: nodeOptions },
        { id: 'installation_address', label: 'Dirección de instalación', type: 'text', required: true },
        { id: 'installation_city', label: 'Ciudad', type: 'text', required: true },
        { id: 'installation_state', label: 'Estado/Municipio', type: 'text' },
        { id: 'reference_description', label: 'Referencia de ubicación', type: 'textarea', placeholder: 'Casa blanca, portón azul, frente al semáforo...' },
      ],
    },
    {
      id: 'network', label: 'Configuración de red',
      fields: [
        { id: 'ip_address', label: 'IP asignada', type: 'text', placeholder: '192.168.1.50' },
        { id: 'pppoe_username', label: 'Usuario PPPoE/Radius', type: 'text' },
      ],
    },
    {
      id: 'billing', label: 'Cobranza',
      fields: [
        { id: 'billing_cycle_day', label: 'Día de vencimiento (1-28)', type: 'number', defaultValue: 1 },
        { id: 'cut_policy_days', label: 'Días de gracia antes del corte', type: 'number', defaultValue: 7 },
      ],
    },
    {
      id: 'contact', label: 'Contacto técnico',
      fields: [
        { id: 'technical_contact_name', label: 'Nombre del contacto técnico', type: 'text' },
        { id: 'technical_contact_phone', label: 'Teléfono contacto técnico', type: 'text' },
      ],
    },
    {
      id: 'notes', label: 'Notas',
      fields: [{ id: 'notes', title: 'Notas internas', type: 'textarea' }],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-subscribers')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Abonados
        </Button>
        <h1 className="text-2xl font-bold mb-6">Nuevo Abonado</h1>
        <CrudForm
          fields={[] as any[]}
          groups={groups}
          cancelHref="/backend/isp-subscribers"
          onSubmit={async (values) => {
            await createCrud('isp-subscribers/subscribers', values)
            flash('Abonado creado exitosamente', 'success')
            router.push('/backend/isp-subscribers')
          }}
        />
      </PageBody>
    </Page>
  )
}
