'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Truck } from 'lucide-react'

export default function CreateDeliveryOrderPage() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'dispatch',
        column: 1,
        title: 'Datos del despacho',
        fields: [
          { id: 'dispatch_date', type: 'text', label: 'Fecha de despacho', required: true, defaultValue: today, placeholder: 'YYYY-MM-DD' },
          { id: 'vehicle_plate', type: 'text', label: 'Placa del vehículo', placeholder: 'ABC123' },
          { id: 'route_id', type: 'text', label: 'ID de Ruta (opcional)', placeholder: 'UUID de la ruta' },
          { id: 'driver_id', type: 'text', label: 'ID del Conductor (opcional)', placeholder: 'UUID del conductor' },
          { id: 'notes', type: 'textarea', label: 'Notas', placeholder: 'Observaciones del despacho...' },
        ],
      },
    ],
    [today],
  )

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nuevo Despacho</h1>
            <p className="text-sm text-muted-foreground">Crear orden de despacho para agrupar entregas</p>
          </div>
        </div>

        <CrudForm
          backHref="/backend/dist_delivery"
          fields={[] as import("@open-mercato/ui/backend/CrudForm").CrudField[]}
          groups={groups}
          submitLabel="Crear Despacho"
          cancelHref="/backend/dist_delivery"
          onSubmit={async (values) => {
            const payload = {
              dispatch_date: String(values.dispatch_date),
              vehicle_plate: values.vehicle_plate ? String(values.vehicle_plate).trim() : null,
              route_id: values.route_id ? String(values.route_id).trim() : null,
              driver_id: values.driver_id ? String(values.driver_id).trim() : null,
              status: 'preparing',
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await createCrud('dist-delivery/orders', payload)
            flash('Despacho creado exitosamente', 'success')
            router.push('/backend/dist_delivery')
          }}
        />
      </PageBody>
    </Page>
  )
}
