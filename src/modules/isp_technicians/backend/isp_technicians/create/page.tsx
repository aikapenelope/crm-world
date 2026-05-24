'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

export default function CreateTechnicianPage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'basic', title: 'Datos del técnico',
      fields: [
        { id: 'name', label: 'Nombre completo', type: 'text', required: true },
        { id: 'phone', label: 'Teléfono / WhatsApp', type: 'text', required: true, placeholder: '+58 412-555-0100' },
        { id: 'coverage_zone', label: 'Zona de cobertura', type: 'text', placeholder: 'Zona Norte Caracas' },
        { id: 'vehicle_plate', label: 'Placa del vehículo', type: 'text', placeholder: 'ABC123' },
      ],
    },
    {
      id: 'compensation', title: 'Compensación',
      fields: [
        { id: 'fuel_allowance_usd', label: 'Asignación mensual gasolina (USD)', type: 'text', placeholder: '30.00' },
        { id: 'commission_per_install', label: 'Comisión por instalación (USD)', type: 'text', placeholder: '5.00' },
      ],
    },
    {
      id: 'notes', title: 'Notas',
      fields: [{ id: 'notes', label: 'Notas', type: 'textarea' }],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-technicians')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Técnicos
        </Button>
        <h1 className="text-2xl font-bold mb-6">Nuevo Técnico de Campo</h1>
        <CrudForm
          fields={[]}
          groups={groups}
          cancelHref="/backend/isp-technicians"
          onSubmit={async (values) => {
            await createCrud('isp-technicians/technicians', values)
            flash('Técnico registrado', 'success')
            router.push('/backend/isp-technicians')
          }}
        />
      </PageBody>
    </Page>
  )
}
