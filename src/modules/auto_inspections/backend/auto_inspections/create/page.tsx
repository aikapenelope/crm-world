'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Camera } from 'lucide-react'

export default function CreateInspectionPage() {
  const router = useRouter()

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'inspection',
        column: 1,
        title: 'Datos de la inspección',
        fields: [
          { id: 'service_order_id', type: 'text', label: 'ID de Orden de Servicio', required: true, placeholder: 'UUID de la orden' },
          { id: 'vehicle_id', type: 'text', label: 'ID del Vehículo', required: true, placeholder: 'UUID del vehículo' },
          {
            id: 'type', type: 'select', label: 'Tipo de inspección', defaultValue: 'intake',
            options: [
              { label: 'Recepción (al ingresar)', value: 'intake' },
              { label: 'Diagnóstico', value: 'diagnosis' },
              { label: 'Progreso (durante reparación)', value: 'progress' },
              { label: 'Finalización (trabajo terminado)', value: 'completion' },
            ],
          },
          { id: 'inspector_id', type: 'text', label: 'ID del Inspector/Técnico', placeholder: 'UUID del técnico' },
          {
            id: 'overall_condition', type: 'select', label: 'Condición general',
            options: [
              { label: '— Sin evaluar —', value: '' },
              { label: 'Bueno', value: 'good' },
              { label: 'Regular', value: 'fair' },
              { label: 'Requiere Atención', value: 'needs_attention' },
              { label: 'Crítico', value: 'critical' },
            ],
          },
          { id: 'notes', type: 'textarea', label: 'Notas generales', placeholder: 'Observaciones de la inspección...' },
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
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Nueva Inspección Digital</h1>
            <p className="text-sm text-muted-foreground">Documentar el estado del vehículo con fotos y hallazgos</p>
          </div>
        </div>

        <CrudForm
          backHref="/backend/auto_inspections"
          fields={[]}
          groups={groups}
          submitLabel="Crear Inspección"
          cancelHref="/backend/auto_inspections"
          onSubmit={async (values) => {
            const payload = {
              service_order_id: String(values.service_order_id).trim(),
              vehicle_id: String(values.vehicle_id).trim(),
              type: String(values.type || 'intake'),
              inspector_id: values.inspector_id ? String(values.inspector_id).trim() : null,
              overall_condition: values.overall_condition ? String(values.overall_condition) : null,
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await createCrud('auto-inspections/inspections', payload)
            flash('Inspección creada — ahora puede agregar fotos y hallazgos', 'success')
            router.push('/backend/auto_inspections')
          }}
        />

        {/* Info about photo upload */}
        <div className="mt-6 rounded-lg border bg-muted/30 p-4">
          <h3 className="text-sm font-semibold mb-2">Sobre las fotos</h3>
          <p className="text-xs text-muted-foreground">
            Después de crear la inspección, podrá agregar fotos desde la cámara del teléfono.
            Use <code className="font-mono">input type=file accept=image/* capture=environment</code> para
            abrir la cámara directamente. Las fotos se asocian a cada hallazgo del checklist.
          </p>
        </div>
      </PageBody>
    </Page>
  )
}
