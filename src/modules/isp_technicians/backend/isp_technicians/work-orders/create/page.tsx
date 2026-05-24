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

export default function CreateWorkOrderPage() {
  const router = useRouter()
  const [techOptions, setTechOptions] = React.useState<{ value: string; label: string }[]>([])

  React.useEffect(() => {
    apiCall<{ items: any[] }>('/api/isp-technicians/technicians?pageSize=100', undefined, { fallback: { items: [] } })
      .then((res) => setTechOptions((res.result?.items ?? []).map((t: any) => ({
        value: t.id, label: `${t.name} — ${t.coverage_zone ?? 'Sin zona'}`,
      }))))
  }, [])

  const groups: CrudFormGroup[] = [
    {
      id: 'basic', label: 'Orden de trabajo',
      fields: [
        {
          id: 'type', label: 'Tipo de visita', type: 'select', required: true,
          options: [
            { value: 'installation', label: 'Instalación nueva' },
            { value: 'repair', label: 'Reparación / Avería' },
            { value: 'equipment_swap', label: 'Cambio de equipo' },
            { value: 'uninstall', label: 'Retiro de equipo' },
            { value: 'verification', label: 'Visita de verificación' },
          ],
          defaultValue: 'installation',
        },
        {
          id: 'priority', label: 'Prioridad', type: 'select',
          options: [
            { value: 'low', label: 'Baja' }, { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'Alta' }, { value: 'urgent', label: 'Urgente' },
          ],
          defaultValue: 'normal',
        },
        { id: 'technician_id', label: 'Técnico asignado', type: 'select', options: techOptions },
      ],
    },
    {
      id: 'schedule', label: 'Programación',
      fields: [
        { id: 'scheduled_date', label: 'Fecha de visita', type: 'date' },
        { id: 'scheduled_time', label: 'Ventana horaria', type: 'text', placeholder: '08:00-10:00' },
      ],
    },
    {
      id: 'location', label: 'Ubicación',
      fields: [
        { id: 'address', label: 'Dirección de la visita', type: 'text', required: true },
        { id: 'instructions', label: 'Instrucciones para el técnico', type: 'textarea',
          placeholder: 'Ej: Llevar ONT Huawei HG8145, cliente en piso 3, llamar antes de llegar' },
      ],
    },
    {
      id: 'links', label: 'Vínculos',
      fields: [
        { id: 'subscriber_id', label: 'ID del abonado (UUID)', type: 'text' },
        { id: 'ticket_id', label: 'ID del ticket (UUID)', type: 'text' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-technicians/work-orders')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Órdenes de Trabajo
        </Button>
        <h1 className="text-2xl font-bold mb-6">Nueva Orden de Trabajo</h1>
        <CrudForm
          fields={[]}
          groups={groups}
          cancelHref="/backend/isp-technicians/work-orders"
          onSubmit={async (values) => {
            await createCrud('isp-technicians/work-orders', values)
            flash('Orden de trabajo creada', 'success')
            router.push('/backend/isp-technicians/work-orders')
          }}
        />
      </PageBody>
    </Page>
  )
}
