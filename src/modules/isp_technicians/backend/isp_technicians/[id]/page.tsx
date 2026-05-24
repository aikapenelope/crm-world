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

export default function EditTechnicianPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [tech, setTech] = React.useState<any>(null)

  React.useEffect(() => {
    async function load() {
      setState('loading')
      const res = await apiCall<{ items: any[] }>(`/api/isp-technicians/technicians?id=${params.id}`)
      const item = res.result?.items?.[0] ?? null
      if (!item) { setState('notFound'); return }
      setTech(item)
      setState('ready')
    }
    load()
  }, [params.id])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando..." /></PageBody></Page>
  if (state === 'notFound') return <Page><PageBody><ErrorMessage label="Técnico no encontrado." /></PageBody></Page>

  const groups: CrudFormGroup[] = [
    {
      id: 'basic', label: 'Datos del técnico',
      fields: [
        { id: 'name', label: 'Nombre completo', type: 'text', required: true },
        { id: 'phone', label: 'Teléfono / WhatsApp', type: 'text', required: true },
        {
          id: 'status', label: 'Estado', type: 'select', required: true,
          options: [
            { value: 'available', label: 'Disponible' }, { value: 'on_route', label: 'En ruta' },
            { value: 'on_site', label: 'En sitio' }, { value: 'off_duty', label: 'No disponible' },
          ],
        },
        { id: 'coverage_zone', label: 'Zona de cobertura', type: 'text' },
        { id: 'vehicle_plate', label: 'Placa del vehículo', type: 'text' },
      ],
    },
    {
      id: 'compensation', label: 'Compensación',
      fields: [
        { id: 'fuel_allowance_usd', label: 'Asignación mensual gasolina (USD)', type: 'text' },
        { id: 'commission_per_install', label: 'Comisión por instalación (USD)', type: 'text' },
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
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-technicians')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Técnicos
        </Button>
        <h1 className="text-2xl font-bold mb-6">{tech.name}</h1>
        <CrudForm
          fields={[] as any[]}
          groups={groups}
          initialValues={tech}
          cancelHref="/backend/isp-technicians"
          onSubmit={async (values) => {
            await updateCrud('isp-technicians/technicians', { id: params.id, ...values })
            flash('Técnico actualizado', 'success')
            router.push('/backend/isp-technicians')
          }}
          onDelete={async () => {
            await deleteCrud('isp-technicians/technicians', params.id)
            flash('Técnico eliminado', 'success')
            router.push('/backend/isp-technicians')
          }}
        />
      </PageBody>
    </Page>
  )
}
