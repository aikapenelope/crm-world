'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

export default function CreateBranchPage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'basic',
      title: 'Identificación',
      fields: [
        { id: 'name', label: 'Nombre', type: 'text', required: true, placeholder: 'Tienda Centro' },
        { id: 'code', label: 'Código', type: 'text', required: true, placeholder: 'CENTRO' },
        {
          id: 'branch_type', label: 'Tipo', type: 'select', defaultValue: 'store',
          options: [
            { value: 'store', label: 'Tienda' },
            { value: 'warehouse', label: 'Bodega' },
            { value: 'kiosk', label: 'Kiosco' },
            { value: 'popup', label: 'Pop-up' },
          ],
        },
      ],
    },
    {
      id: 'location',
      title: 'Ubicación',
      fields: [
        { id: 'address_line1', label: 'Dirección', type: 'text', placeholder: 'Av. Principal, Local 5' },
        { id: 'city', label: 'Ciudad', type: 'text', placeholder: 'Caracas' },
        { id: 'state', label: 'Estado', type: 'text', placeholder: 'Distrito Capital' },
      ],
    },
    {
      id: 'contact',
      title: 'Contacto',
      fields: [
        { id: 'phone', label: 'Teléfono', type: 'text', placeholder: '+58 412-000-0000' },
        { id: 'email', label: 'Email', type: 'text', placeholder: 'tienda@empresa.com' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nueva Sucursal</h1>
        <CrudForm
          fields={[] as any[]}
          groups={groups}
          cancelHref="/backend/retail_branches"
          onSubmit={async (values) => {
            await createCrud('retail-branches/branches', {
              ...values,
              code: values.code ? String(values.code).toUpperCase() : values.code,
            })
            flash('Sucursal creada exitosamente', 'success')
            router.push('/backend/retail_branches')
          }}
        />
      </PageBody>
    </Page>
  )
}
