'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

export default function CreateCpePage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'equip', label: 'Equipo',
      fields: [
        {
          id: 'cpe_type', label: 'Tipo de equipo', type: 'select', required: true,
          options: [
            { value: 'router', label: 'Router' }, { value: 'ont', label: 'ONT (Fibra GPON)' },
            { value: 'antenna', label: 'Antena (Wireless)' }, { value: 'switch', label: 'Switch' },
            { value: 'other', label: 'Otro' },
          ],
          defaultValue: 'router',
        },
        { id: 'brand', label: 'Marca', type: 'text', required: true, placeholder: 'MikroTik, Ubiquiti, Huawei, ZTE' },
        { id: 'model', label: 'Modelo', type: 'text', required: true, placeholder: 'hAP ac3, LiteBeam 5AC, HG8145' },
        { id: 'serial_number', label: 'Número de serie', type: 'text', required: true },
        { id: 'mac_address', label: 'MAC Address', type: 'text', placeholder: 'AA:BB:CC:DD:EE:FF' },
      ],
    },
    {
      id: 'purchase', label: 'Compra',
      fields: [
        { id: 'purchase_price_usd', label: 'Precio de compra (USD)', type: 'text', placeholder: '45.00' },
        { id: 'purchase_date', label: 'Fecha de compra', type: 'date' },
      ],
    },
    {
      id: 'notes', label: 'Notas',
      fields: [{ id: 'notes', title: 'Notas', type: 'textarea' }],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-network/cpe')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Inventario CPE
        </Button>
        <h1 className="text-2xl font-bold mb-6">Registrar Equipo CPE</h1>
        <CrudForm
          fields={[] as import("@open-mercato/ui/backend/CrudForm").CrudField[]}
          groups={groups}
          cancelHref="/backend/isp-network/cpe"
          onSubmit={async (values) => {
            await createCrud('isp-network/cpe', values)
            flash('Equipo registrado', 'success')
            router.push('/backend/isp-network/cpe')
          }}
        />
      </PageBody>
    </Page>
  )
}
