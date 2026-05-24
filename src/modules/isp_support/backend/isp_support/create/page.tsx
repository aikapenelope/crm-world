'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

export default function CreateTicketPage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'basic', title: 'Ticket',
      fields: [
        {
          id: 'type', label: 'Tipo de solicitud', type: 'select', required: true,
          options: [
            { value: 'fault', label: 'Avería / Sin servicio' },
            { value: 'inquiry', label: 'Consulta técnica' },
            { value: 'plan_change', label: 'Cambio de plan' },
            { value: 'move', label: 'Mudanza' },
            { value: 'new_service', label: 'Nuevo servicio' },
            { value: 'complaint', label: 'Queja o reclamo' },
          ],
          defaultValue: 'fault',
        },
        {
          id: 'priority', label: 'Prioridad', type: 'select', required: true,
          options: [
            { value: 'low', label: 'Baja' }, { value: 'normal', label: 'Normal' },
            { value: 'high', label: 'Alta' }, { value: 'critical', label: 'Crítica' },
          ],
          defaultValue: 'normal',
        },
        {
          id: 'origin', label: 'Canal de entrada', type: 'select',
          options: [
            { value: 'manual', label: 'Manual (panel)' }, { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'phone', label: 'Llamada telefónica' }, { value: 'portal', label: 'Portal del abonado' },
          ],
          defaultValue: 'manual',
        },
        { id: 'subject', label: 'Asunto', type: 'text', required: true, placeholder: 'Ej: Sin conexión desde las 8am' },
        { id: 'description', label: 'Descripción del problema', type: 'textarea' },
      ],
    },
    {
      id: 'assignment', title: 'Asignación',
      fields: [
        { id: 'subscriber_id', label: 'ID del abonado (UUID)', type: 'text', placeholder: 'Dejar vacío si es avería masiva' },
        { id: 'node_id', label: 'ID del nodo afectado (UUID)', type: 'text', placeholder: 'Si aplica' },
        { id: 'sla_hours', label: 'SLA en horas', type: 'number', placeholder: '24' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-support')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Soporte
        </Button>
        <h1 className="text-2xl font-bold mb-6">Nuevo Ticket de Soporte</h1>
        <CrudForm
          fields={[]}
          groups={groups}
          cancelHref="/backend/isp-support"
          onSubmit={async (values) => {
            await createCrud('isp-support/tickets', values)
            flash('Ticket creado', 'success')
            router.push('/backend/isp-support')
          }}
        />
      </PageBody>
    </Page>
  )
}
