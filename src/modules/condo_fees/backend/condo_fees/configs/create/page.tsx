'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'

type BuildingOption = { id: string; name: string }

export default function CreateFeeConfigPage() {
  const router = useRouter()
  const [buildingOptions, setBuildingOptions] = React.useState<{ value: string; label: string }[]>([])
  const [isLoadingBuildings, setIsLoadingBuildings] = React.useState(true)

  React.useEffect(() => {
    async function loadBuildings() {
      setIsLoadingBuildings(true)
      const res = await apiCall<{ items: BuildingOption[] }>(
        '/api/condo-properties/buildings?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      setBuildingOptions((res.result?.items ?? []).map((b) => ({ value: b.id, label: b.name })))
      setIsLoadingBuildings(false)
    }
    loadBuildings()
  }, [])

  const groups: CrudFormGroup[] = [
    {
      id: 'main',
      title: 'Configuración de cuota',
      fields: [
        {
          id: 'building_id', label: 'Edificio', type: 'select', required: true,
          options: buildingOptions,
          placeholder: isLoadingBuildings ? 'Cargando edificios...' : 'Seleccionar',
        },
        { id: 'name', label: 'Nombre de la cuota', type: 'text', required: true, placeholder: 'Cuota Ordinaria Enero 2026' },
        {
          id: 'fee_type', label: 'Tipo', type: 'select', defaultValue: 'ordinary',
          options: [
            { value: 'ordinary', label: 'Cuota ordinaria' },
            { value: 'extraordinary', label: 'Cuota extraordinaria' },
            { value: 'reserve_fund', label: 'Fondo de reserva' },
          ],
        },
        { id: 'period_month', label: 'Período (YYYY-MM)', type: 'text', required: true, placeholder: '2026-01' },
        { id: 'base_amount', label: 'Monto base', type: 'text', required: true, placeholder: '0.00' },
        {
          id: 'currency', label: 'Moneda', type: 'select', defaultValue: 'USD',
          options: [{ value: 'USD', label: 'USD' }, { value: 'VES', label: 'VES' }],
        },
        {
          id: 'distribution_method', label: 'Distribución', type: 'select', defaultValue: 'aliquot',
          options: [
            { value: 'aliquot', label: 'Por alícuota' },
            { value: 'equal', label: 'Partes iguales' },
          ],
        },
        { id: 'due_date', label: 'Fecha de vencimiento', type: 'date', required: true },
        { id: 'late_fee_percent', label: 'Mora (%)', type: 'text', defaultValue: '0' },
        { id: 'late_fee_days', label: 'Días de gracia antes de mora', type: 'number', defaultValue: '15' },
        { id: 'approved_in_assembly', label: 'Aprobada en asamblea', type: 'checkbox', defaultValue: false },
        { id: 'notes', label: 'Notas', type: 'textarea' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nueva Configuración de Cuota</h1>
        <CrudForm
          fields={[] as import("@open-mercato/ui/backend/CrudForm").CrudField[]}
          groups={groups}
          cancelHref="/backend/condo_fees"
          onSubmit={async (values) => {
            await createCrud('condo-fees/configs', {
              ...values,
              late_fee_days: Number(values.late_fee_days || 15),
              approved_in_assembly: Boolean(values.approved_in_assembly),
            })
            flash('Configuración de cuota creada', 'success')
            router.push('/backend/condo_fees')
          }}
        />
      </PageBody>
    </Page>
  )
}
