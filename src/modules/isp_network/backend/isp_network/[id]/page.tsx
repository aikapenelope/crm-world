'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { updateCrud, deleteCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

type PageState = 'loading' | 'notFound' | 'error' | 'ready'

export default function EditIspNetworkNodePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [node, setNode] = React.useState<any>(null)

  React.useEffect(() => {
    async function load() {
      setState('loading')
      const res = await apiCall<{ items: any[] }>(`/api/isp-network/nodes?id=${params.id}`)
      const item = res.result?.items?.[0] ?? null
      if (!item) { setState('notFound'); return }
      setNode(item)
      setState('ready')
    }
    load()
  }, [params.id])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando..." /></PageBody></Page>
  if (state === 'notFound') return <Page><PageBody><ErrorMessage label="Nodo no encontrado." /></PageBody></Page>

  const groups: CrudFormGroup[] = [
    {
      id: 'basic', title: 'Básico',
      fields: [
        { id: 'name', label: 'Nombre del nodo', type: 'text', required: true },
        {
          id: 'node_type', label: 'Tipo', type: 'select', required: true,
          options: [
            { value: 'pop_principal', label: 'POP Principal' }, { value: 'nodo_distribucion', label: 'Distribución' },
            { value: 'nodo_acceso', label: 'Acceso' }, { value: 'repetidora', label: 'Repetidora' },
          ],
        },
        {
          id: 'status', label: 'Estado operativo', type: 'select', required: true,
          options: [
            { value: 'active', label: 'Activo' }, { value: 'degraded', label: 'Degradado' },
            { value: 'offline', label: 'Caído' }, { value: 'maintenance', label: 'Mantenimiento' },
          ],
        },
        { id: 'city', label: 'Ciudad', type: 'text', required: true },
        { id: 'address', label: 'Dirección física', type: 'text' },
      ],
    },
    {
      id: 'equip', title: 'Equipo',
      fields: [
        { id: 'equipment_model', label: 'Equipo instalado', type: 'text' },
        { id: 'equipment_serial', label: 'Serie del equipo', type: 'text' },
        { id: 'total_capacity_mbps', label: 'Capacidad total (Mbps)', type: 'number' },
        { id: 'used_capacity_mbps', label: 'Uso actual (Mbps)', type: 'number' },
      ],
    },
    {
      id: 'power', title: 'Energía',
      fields: [
        { id: 'power_provider', label: 'Fuente de energía', type: 'text' },
        { id: 'has_generator', label: 'Tiene generador', type: 'checkbox' },
        { id: 'battery_hours', label: 'Horas autonomía UPS', type: 'number' },
      ],
    },
    {
      id: 'monitor', title: 'Monitoreo',
      fields: [
        { id: 'monitoring_host', label: 'Host en Zabbix/PRTG', type: 'text' },
        { id: 'coordinates_lat', label: 'Latitud GPS', type: 'text' },
        { id: 'coordinates_lng', label: 'Longitud GPS', type: 'text' },
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
        <h1 className="text-2xl font-bold mb-6">Nodo: {node.name}</h1>
        <CrudForm
          fields={[] as any[]}
          groups={groups}
          initialValues={node}
          cancelHref="/backend/isp-network"
          onSubmit={async (values) => {
            await updateCrud('isp-network/nodes', { id: params.id, ...values })
            flash('Nodo actualizado', 'success')
            router.push('/backend/isp-network')
          }}
          onDelete={async () => {
            await deleteCrud('isp-network/nodes', params.id)
            flash('Nodo eliminado', 'success')
            router.push('/backend/isp-network')
          }}
        />
      </PageBody>
    </Page>
  )
}
