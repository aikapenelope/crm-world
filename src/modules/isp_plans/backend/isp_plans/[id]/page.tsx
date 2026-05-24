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

export default function EditIspPlanPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [plan, setPlan] = React.useState<any>(null)

  React.useEffect(() => {
    async function load() {
      setState('loading')
      const res = await apiCall<{ items: any[] }>(`/api/isp-plans/plans?id=${params.id}`)
      const item = res.result?.items?.[0] ?? null
      if (!item) { setState('notFound'); return }
      setPlan(item)
      setState('ready')
    }
    load()
  }, [params.id])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando plan..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody><ErrorMessage label="El plan no existe o fue eliminado." /></PageBody></Page>
  )

  const groups: CrudFormGroup[] = [
    {
      id: 'basic', label: 'Información básica',
      fields: [
        { id: 'name', label: 'Nombre del plan', type: 'text', required: true },
        {
          id: 'technology', label: 'Tecnología', type: 'select', required: true,
          options: [
            { value: 'wireless', label: 'Inalámbrico' }, { value: 'fiber', label: 'Fibra óptica' },
            { value: 'cable', label: 'Cable coaxial' }, { value: 'dedicated', label: 'Enlace dedicado' },
          ],
        },
        {
          id: 'target_segment', label: 'Segmento', type: 'select', required: true,
          options: [
            { value: 'residential', label: 'Residencial' }, { value: 'pyme', label: 'PYME' },
            { value: 'corporate', label: 'Corporativo' }, { value: 'wholesale', label: 'Mayorista' },
          ],
        },
      ],
    },
    {
      id: 'speed', label: 'Velocidad',
      fields: [
        { id: 'download_mbps', label: 'Velocidad bajada (Mbps)', type: 'number', required: true },
        { id: 'upload_mbps', label: 'Velocidad subida (Mbps)', type: 'number', required: true },
        { id: 'is_symmetric', label: 'Velocidad simétrica', type: 'checkbox' },
      ],
    },
    {
      id: 'pricing', label: 'Precios',
      fields: [
        { id: 'monthly_price_usd', label: 'Precio mensual (USD)', type: 'text', required: true },
        { id: 'installation_fee_usd', label: 'Cargo instalación (USD)', type: 'text' },
      ],
    },
    {
      id: 'network', label: 'Configuración de red',
      fields: [
        { id: 'radius_profile', label: 'Perfil Radius', type: 'text' },
        { id: 'olt_profile', label: 'Perfil OLT (GPON)', type: 'text' },
      ],
    },
    {
      id: 'settings', label: 'Configuración',
      fields: [
        { id: 'is_active', label: 'Plan activo', type: 'checkbox' },
        { id: 'is_promotional', label: 'Promoción temporal', type: 'checkbox' },
        { id: 'description', label: 'Descripción', type: 'textarea' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-plans')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Planes
        </Button>
        <h1 className="text-2xl font-bold mb-6">Editar: {plan.name}</h1>
        <CrudForm
          fields={[] as any[]}
          groups={groups}
          initialValues={plan}
          cancelHref="/backend/isp-plans"
          onSubmit={async (values) => {
            await updateCrud('isp-plans/plans', { id: params.id, ...values })
            flash('Plan actualizado', 'success')
            router.push('/backend/isp-plans')
          }}
          onDelete={async () => {
            await deleteCrud('isp-plans/plans', params.id)
            flash('Plan eliminado', 'success')
            router.push('/backend/isp-plans')
          }}
        />
      </PageBody>
    </Page>
  )
}
