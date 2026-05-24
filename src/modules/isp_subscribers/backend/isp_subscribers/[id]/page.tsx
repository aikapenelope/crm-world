'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { updateCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { ArrowLeft, Ban, RefreshCw } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  active: 'success', pending_installation: 'info', suspended_overdue: 'error',
  suspended_voluntary: 'warning', cancelled: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', pending_installation: 'En instalación', suspended_overdue: 'Moroso',
  suspended_voluntary: 'Suspendido', cancelled: 'Cancelado',
}

type PageState = 'loading' | 'notFound' | 'error' | 'ready'

export default function IspSubscriberDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [subscriber, setSubscriber] = React.useState<any>(null)
  const [activeTab, setActiveTab] = React.useState<'info' | 'billing'>('info')

  const load = React.useCallback(async () => {
    setState('loading')
    const res = await apiCall<{ items: any[] }>(`/api/isp-subscribers/subscribers?id=${params.id}`)
    const item = res.result?.items?.[0] ?? null
    if (!item) { setState('notFound'); return }
    setSubscriber(item)
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const changeStatus = async (newStatus: string) => {
    try {
      await apiCallOrThrow('/api/isp-subscribers/subscribers/change-status', {
        method: 'POST',
        body: JSON.stringify({ subscriber_id: params.id, new_status: newStatus }),
      })
      flash(`Estado actualizado: ${STATUS_LABEL[newStatus] ?? newStatus}`, 'success')
      load()
    } catch {
      flash('Error al cambiar estado', 'error')
    }
  }

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando abonado..." /></PageBody></Page>
  if (state === 'notFound') return <Page><PageBody><ErrorMessage label="Abonado no encontrado." /></PageBody></Page>

  const isActive = subscriber.service_status === 'active'
  const isSuspended = ['suspended_overdue', 'suspended_voluntary'].includes(subscriber.service_status)

  const infoGroups: CrudFormGroup[] = [
    {
      id: 'account', label: 'Plan y precio',
      fields: [
        {
          id: 'subscriber_type', label: 'Tipo', type: 'select', required: true,
          options: [
            { value: 'residential', label: 'Residencial' }, { value: 'pyme', label: 'PYME' },
            { value: 'corporate', label: 'Corporativo' }, { value: 'wholesale', label: 'Mayorista' },
          ],
        },
        { id: 'monthly_price_usd', label: 'Precio mensual (USD)', type: 'text', required: true },
      ],
    },
    {
      id: 'location', label: 'Instalación',
      fields: [
        { id: 'installation_address', label: 'Dirección', type: 'text', required: true },
        { id: 'installation_city', label: 'Ciudad', type: 'text', required: true },
        { id: 'reference_description', label: 'Referencia de ubicación', type: 'textarea' },
      ],
    },
    {
      id: 'network', label: 'Red',
      fields: [
        { id: 'ip_address', label: 'IP asignada', type: 'text' },
        { id: 'pppoe_username', label: 'Usuario PPPoE/Radius', type: 'text' },
      ],
    },
    {
      id: 'billing', label: 'Cobranza',
      fields: [
        { id: 'billing_cycle_day', label: 'Día de vencimiento', type: 'number' },
        { id: 'cut_policy_days', label: 'Días de gracia', type: 'number' },
      ],
    },
    {
      id: 'notes', label: 'Notas',
      fields: [{ id: 'notes', title: 'Notas internas', type: 'textarea' }],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-subscribers')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Abonados
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Abonado {subscriber.account_number}</h1>
            <p className="text-sm text-muted-foreground mt-1">{subscriber.installation_city}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant={STATUS_VARIANT[subscriber.service_status] ?? 'neutral'} dot>
              {STATUS_LABEL[subscriber.service_status] ?? subscriber.service_status}
            </StatusBadge>
            {isActive && (
              <Button type="button" variant="outline" size="sm" onClick={() => changeStatus('suspended_voluntary')}>
                <Ban className="size-4 mr-1" /> Suspender
              </Button>
            )}
            {isSuspended && (
              <Button type="button" variant="outline" size="sm" onClick={() => changeStatus('active')}>
                <RefreshCw className="size-4 mr-1" /> Reactivar
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(['info', 'billing'] as const).map((tab) => (
            <button
              key={tab} type="button"
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'info' ? 'Información' : 'Facturación'}
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
          <CrudForm
            fields={[] as import("@open-mercato/ui/backend/CrudForm").CrudField[]}
            groups={infoGroups}
            initialValues={subscriber}
            cancelHref="/backend/isp-subscribers"
            onSubmit={async (values) => {
              await updateCrud('isp-subscribers/subscribers', { id: params.id, ...values })
              flash('Abonado actualizado', 'success')
              load()
            }}
          />
        )}

        {activeTab === 'billing' && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Las facturas aparecerán aquí cuando isp_billing genere el primer ciclo.
          </div>
        )}
      </PageBody>
    </Page>
  )
}
