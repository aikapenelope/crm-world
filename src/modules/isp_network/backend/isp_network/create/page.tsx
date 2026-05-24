'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

export default function CreateIspNetworkNodePage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'basic', title: 'Información básica',
      fields: [
        { id: 'name', title: 'Nombre del nodo', type: 'text', required: true, placeholder: 'Ej: Nodo-BQ-Norte' },
        {
          id: 'node_type', title: 'Tipo de nodo', type: 'select', required: true,
          options: [
            { value: 'pop_principal', label: 'POP Principal' },
            { value: 'nodo_distribucion', label: 'Nodo de Distribución' },
            { value: 'nodo_acceso', label: 'Nodo de Acceso' },
            { value: 'repetidora', label: 'Repetidora' },
          ],
          defaultValue: 'nodo_acceso',
        },
        { id: 'city', title: 'Ciudad', type: 'text', required: true },
        { id: 'address', title: 'Dirección física', type: 'text' },
      ],
    },
    {
      id: 'equip', title: 'Equipamiento',
      fields: [
        { id: 'equipment_model', title: 'Equipo instalado', type: 'text', placeholder: 'Huawei MA5800-X17, MikroTik CCR2004' },
        { id: 'equipment_serial', title: 'Serie del equipo', type: 'text' },
        { id: 'total_capacity_mbps', title: 'Capacidad total (Mbps)', type: 'number' },
      ],
    },
    {
      id: 'power', title: 'Energía eléctrica',
      fields: [
        { id: 'power_provider', title: 'Fuente de energía', type: 'text', placeholder: 'CORPOELEC + UPS 4h + Planta propia' },
        { id: 'has_generator', title: 'Tiene planta eléctrica (generador)', type: 'checkbox', defaultValue: false },
        { id: 'battery_hours', title: 'Horas de autonomía UPS/baterías', type: 'number' },
      ],
    },
    {
      id: 'monitor', title: 'Monitoreo y GPS',
      fields: [
        { id: 'monitoring_host', title: 'Host en Zabbix/PRTG', type: 'text', placeholder: 'Nodo-BQ-Norte' },
        { id: 'coordinates_lat', title: 'Latitud GPS', type: 'text', placeholder: '10.4806' },
        { id: 'coordinates_lng', title: 'Longitud GPS', type: 'text', placeholder: '-66.9036' },
      ],
    },
    {
      id: 'notes', title: 'Notas',
      fields: [{ id: 'notes', title: 'Notas internas', type: 'textarea' }],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-network')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Infraestructura
        </Button>
        <h1 className="text-2xl font-bold mb-6">Nuevo Nodo de Red</h1>
        <CrudForm
          fields={[]}
          groups={groups}
          cancelHref="/backend/isp-network"
          onSubmit={async (values) => {
            await createCrud('isp-network/nodes', values)
            flash('Nodo creado', 'success')
            router.push('/backend/isp-network')
          }}
        />
      </PageBody>
    </Page>
  )
}
