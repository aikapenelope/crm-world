'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Wrench } from 'lucide-react'

export default function CreateServiceOrderPage() {
  const router = useRouter()

  // Generate order number
  const orderNumber = React.useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0')
    return `OT-${y}${m}-${seq}`
  }, [])

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'reception',
        column: 1,
        title: 'Recepción del vehículo',
        fields: [
          { id: 'order_number', type: 'text', label: 'Número de Orden', required: true, defaultValue: orderNumber },
          { id: 'vehicle_id', type: 'text', label: 'ID del Vehículo', required: true, placeholder: 'UUID del vehículo registrado' },
          { id: 'customer_id', type: 'text', label: 'ID del Cliente', required: true, placeholder: 'UUID del propietario' },
          { id: 'km_at_entry', type: 'text', label: 'Kilometraje al ingresar', placeholder: '85000' },
          { id: 'customer_complaint', type: 'textarea', label: 'Motivo de ingreso (lo que reporta el cliente)', required: true, placeholder: 'Ej: Ruido en frenos, motor se calienta, cambio de aceite...' },
        ],
      },
      {
        id: 'assignment',
        column: 2,
        title: 'Asignación',
        fields: [
          { id: 'assigned_technician_id', type: 'text', label: 'Técnico asignado (ID)', placeholder: 'UUID del mecánico' },
          {
            id: 'priority', type: 'select', label: 'Prioridad', defaultValue: 'normal',
            options: [
              { label: 'Baja', value: 'low' },
              { label: 'Normal', value: 'normal' },
              { label: 'Alta', value: 'high' },
              { label: 'Urgente', value: 'urgent' },
            ],
          },
          { id: 'estimated_completion', type: 'text', label: 'Fecha estimada de entrega', placeholder: 'YYYY-MM-DD' },
          {
            id: 'currency', type: 'select', label: 'Moneda', defaultValue: 'USD',
            options: [
              { label: 'USD', value: 'USD' },
              { label: 'VES', value: 'VES' },
            ],
          },
          { id: 'notes', type: 'textarea', label: 'Notas internas', placeholder: 'Observaciones para el equipo...' },
        ],
      },
    ],
    [orderNumber],
  )

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nueva Orden de Servicio</h1>
            <p className="text-sm text-muted-foreground">Registrar ingreso de vehículo al taller</p>
          </div>
        </div>

        <CrudForm
          backHref="/backend/auto_service_orders"
          fields={[]}
          groups={groups}
          submitLabel="Crear Orden"
          cancelHref="/backend/auto_service_orders"
          onSubmit={async (values) => {
            const payload = {
              order_number: String(values.order_number).trim(),
              vehicle_id: String(values.vehicle_id).trim(),
              customer_id: String(values.customer_id).trim(),
              km_at_entry: values.km_at_entry ? Number(values.km_at_entry) : 0,
              customer_complaint: values.customer_complaint ? String(values.customer_complaint).trim() : null,
              assigned_technician_id: values.assigned_technician_id ? String(values.assigned_technician_id).trim() : null,
              priority: String(values.priority || 'normal'),
              estimated_completion: values.estimated_completion ? String(values.estimated_completion) : null,
              currency: String(values.currency || 'USD'),
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await createCrud('auto-service-orders/orders', payload)
            flash('Orden de servicio creada', 'success')
            router.push('/backend/auto_service_orders')
          }}
        />
      </PageBody>
    </Page>
  )
}
