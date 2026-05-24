'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

export default function CreateBuildingPage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'identity',
      title: 'Datos del edificio',
      fields: [
        { id: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Residencias La Castellana' },
        { id: 'code', label: 'Código', type: 'text', required: true, placeholder: 'RLC-01' },
        {
          id: 'building_type', label: 'Tipo', type: 'select', defaultValue: 'residential',
          options: [
            { value: 'residential', label: 'Residencial' },
            { value: 'commercial', label: 'Comercial' },
            { value: 'mixed', label: 'Mixto' },
          ],
        },
      ],
    },
    {
      id: 'location',
      title: 'Ubicación',
      fields: [
        { id: 'address', label: 'Dirección', type: 'text', required: true },
        { id: 'city', label: 'Ciudad', type: 'text', required: true },
        { id: 'state', label: 'Estado', type: 'text' },
      ],
    },
    {
      id: 'details',
      title: 'Detalles físicos',
      fields: [
        { id: 'total_units', label: 'Total de unidades', type: 'number', required: true },
        { id: 'total_floors', label: 'Número de pisos', type: 'number' },
        { id: 'year_built', label: 'Año de construcción', type: 'number' },
      ],
    },
    {
      id: 'admin',
      title: 'Datos administrativos',
      fields: [
        { id: 'rif', label: 'RIF de la junta', type: 'text', placeholder: 'J-12345678-9' },
        { id: 'admin_company', label: 'Empresa administradora', type: 'text' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nuevo Edificio</h1>
        <CrudForm
          fields={[]}
          groups={groups}
          cancelHref="/backend/condo_properties"
          onSubmit={async (values) => {
            await createCrud('condo-properties/buildings', {
              ...values,
              total_floors: values.total_floors ? Number(values.total_floors) : null,
              year_built: values.year_built ? Number(values.year_built) : null,
            })
            flash('Edificio creado exitosamente', 'success')
            router.push('/backend/condo_properties')
          }}
        />
      </PageBody>
    </Page>
  )
}
