'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { MapPin } from 'lucide-react'

export default function CreateRoutePage() {
  const router = useRouter()

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'route',
        column: 1,
        title: 'Datos de la ruta',
        fields: [
          { id: 'name', type: 'text', label: 'Nombre', required: true, placeholder: 'Ej: Ruta Norte - Lunes' },
          { id: 'code', type: 'text', label: 'Código', required: true, placeholder: 'ruta-norte-lun' },
          { id: 'zone', type: 'text', label: 'Zona', placeholder: 'Ej: Zona Norte, Chacao, Los Palos Grandes' },
          {
            id: 'day_of_week', type: 'select', label: 'Día de la semana',
            options: [
              { label: '— Sin día fijo —', value: '' },
              { label: 'Lunes', value: '1' },
              { label: 'Martes', value: '2' },
              { label: 'Miércoles', value: '3' },
              { label: 'Jueves', value: '4' },
              { label: 'Viernes', value: '5' },
              { label: 'Sábado', value: '6' },
            ],
          },
          { id: 'vehicle_plate', type: 'text', label: 'Placa del vehículo', placeholder: 'ABC123 (opcional)' },
          { id: 'is_active', type: 'checkbox', label: 'Ruta activa', defaultValue: true },
          { id: 'notes', type: 'textarea', label: 'Notas', placeholder: 'Observaciones de la ruta...' },
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
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nueva Ruta</h1>
            <p className="text-sm text-muted-foreground">Crear una ruta de distribución por zona y día</p>
          </div>
        </div>

        <CrudForm
          backHref="/backend/dist_routes"
          fields={[] as any[]}
          groups={groups}
          submitLabel="Crear Ruta"
          cancelHref="/backend/dist_routes"
          onSubmit={async (values) => {
            const payload = {
              name: String(values.name).trim(),
              code: String(values.code).trim().toLowerCase(),
              zone: values.zone ? String(values.zone).trim() : null,
              day_of_week: values.day_of_week ? Number(values.day_of_week) : null,
              vehicle_plate: values.vehicle_plate ? String(values.vehicle_plate).trim() : null,
              is_active: values.is_active !== false,
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await createCrud('dist-routes/routes', payload)
            flash('Ruta creada exitosamente', 'success')
            router.push('/backend/dist_routes')
          }}
        />
      </PageBody>
    </Page>
  )
}
