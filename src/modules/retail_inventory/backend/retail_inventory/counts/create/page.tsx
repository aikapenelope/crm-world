'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

export default function CreateCountPage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'count',
      title: 'Nuevo Conteo de Inventario',
      fields: [
        { id: 'branch_id', label: 'Sucursal (ID)', type: 'text', required: true, placeholder: 'UUID de la sucursal' },
        {
          id: 'count_type', label: 'Tipo de Conteo', type: 'select', defaultValue: 'full',
          options: [
            { value: 'full', label: 'Completo' },
            { value: 'partial', label: 'Parcial' },
            { value: 'spot_check', label: 'Verificación Rápida' },
          ],
        },
        { id: 'planned_date', label: 'Fecha Planificada', type: 'date', required: true },
        { id: 'notes', label: 'Notas', type: 'textarea', placeholder: 'Instrucciones para el conteo...' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Planificar Conteo</h1>
        <CrudForm
          fields={[] as any[]}
          groups={groups}
          cancelHref="/backend/retail_inventory/counts"
          onSubmit={async (values) => {
            await createCrud('retail-inventory/counts', values)
            flash('Conteo planificado exitosamente', 'success')
            router.push('/backend/retail_inventory/counts')
          }}
        />
      </PageBody>
    </Page>
  )
}
