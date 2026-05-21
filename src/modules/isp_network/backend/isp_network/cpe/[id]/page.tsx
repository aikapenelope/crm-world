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

export default function EditCpePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [cpe, setCpe] = React.useState<any>(null)

  React.useEffect(() => {
    async function load() {
      setState('loading')
      const res = await apiCall<{ items: any[] }>(`/api/isp-network/cpe?id=${params.id}`)
      const item = res.result?.items?.[0] ?? null
      if (!item) { setState('notFound'); return }
      setCpe(item)
      setState('ready')
    }
    load()
  }, [params.id])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando..." /></PageBody></Page>
  if (state === 'notFound') return <Page><PageBody><ErrorMessage message="Equipo no encontrado." /></PageBody></Page>

  const groups: CrudFormGroup[] = [
    {
      id: 'equip', title: 'Equipo',
      fields: [
        {
          id: 'cpe_type', label: 'Tipo', type: 'select', required: true,
          options: [
            { value: 'router', label: 'Router' }, { value: 'ont', label: 'ONT (Fibra)' },
            { value: 'antenna', label: 'Antena' }, { value: 'switch', label: 'Switch' },
            { value: 'other', label: 'Otro' },
          ],
        },
        { id: 'brand', label: 'Marca', type: 'text', required: true },
        { id: 'model', label: 'Modelo', type: 'text', required: true },
        { id: 'serial_number', label: 'Número serie', type: 'text', required: true },
        { id: 'mac_address', label: 'MAC Address', type: 'text' },
      ],
    },
    {
      id: 'status_group', title: 'Estado',
      fields: [
        {
          id: 'status', label: 'Estado', type: 'select', required: true,
          options: [
            { value: 'in_stock', label: 'En bodega' }, { value: 'deployed', label: 'Instalado' },
            { value: 'in_repair', label: 'En reparación' }, { value: 'written_off', label: 'Dado de baja' },
          ],
        },
        { id: 'purchase_price_usd', label: 'Precio compra (USD)', type: 'text' },
      ],
    },
    {
      id: 'notes', title: 'Notas',
      fields: [{ id: 'notes', label: 'Notas', type: 'textarea' }],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-network/cpe')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Inventario CPE
        </Button>
        <h1 className="text-2xl font-bold mb-6">{cpe.brand} {cpe.model}</h1>
        <CrudForm
          fields={[]}
          groups={groups}
          initialValues={cpe}
          cancelHref="/backend/isp-network/cpe"
          onSubmit={async (values) => {
            await updateCrud('isp-network/cpe', { id: params.id, ...values })
            flash('Equipo actualizado', 'success')
            router.push('/backend/isp-network/cpe')
          }}
          onDelete={async () => {
            await deleteCrud('isp-network/cpe', params.id)
            flash('Equipo eliminado', 'success')
            router.push('/backend/isp-network/cpe')
          }}
        />
      </PageBody>
    </Page>
  )
}
