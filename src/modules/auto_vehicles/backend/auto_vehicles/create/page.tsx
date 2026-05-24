'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Car } from 'lucide-react'

export default function CreateVehiclePage() {
  const router = useRouter()

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'vehicle',
        column: 1,
        title: 'Datos del vehículo',
        fields: [
          { id: 'plate', type: 'text', label: 'Placa', required: true, placeholder: 'ABC123 o AB123CD' },
          { id: 'brand', type: 'text', label: 'Marca', required: true, placeholder: 'Toyota, Chevrolet, Ford...' },
          { id: 'model', type: 'text', label: 'Modelo', required: true, placeholder: 'Corolla, Aveo, F-150...' },
          { id: 'year', type: 'text', label: 'Año', required: true, placeholder: '2020' },
          { id: 'color', type: 'text', label: 'Color', placeholder: 'Blanco, Negro, Rojo...' },
          { id: 'vin', type: 'text', label: 'VIN / Serial (opcional)', placeholder: '1HGBH41JXMN109186' },
        ],
      },
      {
        id: 'specs',
        column: 2,
        title: 'Especificaciones',
        fields: [
          {
            id: 'engine_type', type: 'select', label: 'Tipo de motor', defaultValue: 'gasoline',
            options: [
              { label: 'Gasolina', value: 'gasoline' },
              { label: 'Diésel', value: 'diesel' },
              { label: 'Híbrido', value: 'hybrid' },
              { label: 'Eléctrico', value: 'electric' },
              { label: 'Gas (GNV)', value: 'gas' },
            ],
          },
          {
            id: 'transmission', type: 'select', label: 'Transmisión', defaultValue: 'manual',
            options: [
              { label: 'Manual (sincrónico)', value: 'manual' },
              { label: 'Automático', value: 'automatic' },
            ],
          },
          { id: 'current_km', type: 'text', label: 'Kilometraje actual', placeholder: '85000' },
          { id: 'customer_id', type: 'text', label: 'ID del Cliente', required: true, placeholder: 'UUID del propietario' },
          { id: 'notes', type: 'textarea', label: 'Notas', placeholder: 'Observaciones del vehículo...' },
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
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Registrar Vehículo</h1>
            <p className="text-sm text-muted-foreground">Agregar un vehículo al sistema del taller</p>
          </div>
        </div>

        <CrudForm
          backHref="/backend/auto_vehicles"
          fields={[] as import("@open-mercato/ui/backend/CrudForm").CrudField[]}
          groups={groups}
          submitLabel="Registrar Vehículo"
          cancelHref="/backend/auto_vehicles"
          onSubmit={async (values) => {
            const payload = {
              customer_id: String(values.customer_id).trim(),
              plate: String(values.plate).trim().toUpperCase(),
              brand: String(values.brand).trim(),
              model: String(values.model).trim(),
              year: Number(values.year),
              color: values.color ? String(values.color).trim() : null,
              vin: values.vin ? String(values.vin).trim().toUpperCase() : null,
              engine_type: String(values.engine_type || 'gasoline'),
              transmission: String(values.transmission || 'manual'),
              current_km: values.current_km ? Number(values.current_km) : 0,
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await createCrud('auto-vehicles/vehicles', payload)
            flash('Vehículo registrado exitosamente', 'success')
            router.push('/backend/auto_vehicles')
          }}
        />
      </PageBody>
    </Page>
  )
}
