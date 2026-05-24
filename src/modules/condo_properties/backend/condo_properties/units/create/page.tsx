'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'

type BuildingOption = { id: string; name: string }

export default function CreateUnitPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetBuildingId = searchParams?.get('building_id') ?? ''

  const [buildingOptions, setBuildingOptions] = React.useState<{ value: string; label: string }[]>([])

  React.useEffect(() => {
    async function load() {
      const res = await apiCall<{ items: BuildingOption[] }>(
        '/api/condo-properties/buildings?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      setBuildingOptions((res.result?.items ?? []).map((b) => ({ value: b.id, label: b.name })))
    }
    load()
  }, [])

  const groups: CrudFormGroup[] = [
    {
      id: 'main',
      title: 'Unidad',
      fields: [
        {
          id: 'building_id', title: 'Edificio', type: 'select', required: true,
          options: buildingOptions, defaultValue: presetBuildingId,
        },
        { id: 'unit_number', title: 'Número de unidad', type: 'text', required: true, placeholder: 'Apto 3-B' },
        {
          id: 'unit_type', title: 'Tipo', type: 'select', defaultValue: 'apartment',
          options: [
            { value: 'apartment', label: 'Apartamento' },
            { value: 'house', label: 'Casa' },
            { value: 'townhouse', label: 'Townhouse' },
            { value: 'penthouse', label: 'Penthouse' },
            { value: 'commercial', label: 'Local comercial' },
            { value: 'parking', label: 'Puesto de estacionamiento' },
            { value: 'storage', label: 'Depósito' },
          ],
        },
        { id: 'floor', title: 'Piso', type: 'text', placeholder: '3' },
        { id: 'area_m2', title: 'Área (m²)', type: 'text', placeholder: '85.50' },
        { id: 'aliquot_percent', title: 'Alícuota (%)', type: 'text', required: true, defaultValue: '0.00000' },
        { id: 'bedrooms', title: 'Habitaciones', type: 'number' },
        { id: 'bathrooms', title: 'Baños', type: 'number' },
        { id: 'parking_spots', title: 'Puestos de estacionamiento', type: 'number', defaultValue: '0' },
        { id: 'owner_name', title: 'Nombre del propietario', type: 'text' },
        { id: 'owner_id_card', title: 'Cédula / RIF del propietario', type: 'text' },
        { id: 'owner_phone', title: 'Teléfono del propietario', type: 'text' },
        { id: 'owner_email', title: 'Email del propietario', type: 'text' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nueva Unidad</h1>
        <CrudForm
          fields={[]}
          groups={groups}
          cancelHref="/backend/condo_properties"
          onSubmit={async (values) => {
            await createCrud('condo-properties/units', {
              ...values,
              floor: values.floor ? Number(values.floor) : null,
              bedrooms: values.bedrooms ? Number(values.bedrooms) : null,
              bathrooms: values.bathrooms ? Number(values.bathrooms) : null,
              parking_spots: Number(values.parking_spots || 0),
            })
            flash('Unidad creada exitosamente', 'success')
            router.push('/backend/condo_properties')
          }}
        />
      </PageBody>
    </Page>
  )
}
