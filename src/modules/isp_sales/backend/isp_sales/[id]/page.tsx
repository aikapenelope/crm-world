'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { updateCrud, deleteCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { ArrowLeft, MapPin } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
  new: 'info', coverage_check: 'warning', quoted: 'warning',
  scheduled: 'info', installed: 'success', lost: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  new: 'Nuevo', coverage_check: 'Verificando cobertura', quoted: 'Cotización enviada',
  scheduled: 'Instalación agendada', installed: '✓ Instalado', lost: 'Perdido',
}

type PageState = 'loading' | 'notFound' | 'error' | 'ready'

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [lead, setLead] = React.useState<any>(null)
  const [checking, setChecking] = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const res = await apiCall<{ items: any[] }>(`/api/isp-sales/leads?id=${params.id}`)
    const item = res.result?.items?.[0] ?? null
    if (!item) { setState('notFound'); return }
    setLead(item)
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const checkCoverage = async () => {
    if (!lead?.city || checking) return
    setChecking(true)
    try {
      const res = await apiCallOrThrow('/api/isp-sales/leads/check-coverage', {
        method: 'POST',
        body: JSON.stringify({ lead_id: params.id, city: lead.city }),
      })
      const data = await res.json()
      if (data.coverage_status === 'covered') {
        flash(`✓ Cobertura disponible en ${data.zone_name}`, 'success')
      } else {
        flash('Sin cobertura en esta zona. El lead queda en lista de espera.', 'warning')
      }
      load()
    } catch { flash('Error al verificar cobertura', 'error') }
    finally { setChecking(false) }
  }

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando lead..." /></PageBody></Page>
  if (state === 'notFound') return <Page><PageBody><ErrorMessage message="Lead no encontrado." /></PageBody></Page>

  const groups: CrudFormGroup[] = [
    {
      id: 'contact', title: 'Datos del prospecto',
      fields: [
        { id: 'name', title: 'Nombre', type: 'text', required: true },
        { id: 'phone', title: 'Teléfono / WhatsApp', type: 'text', required: true },
        { id: 'email', title: 'Email', type: 'text' },
      ],
    },
    {
      id: 'location', title: 'Ubicación',
      fields: [
        { id: 'address', title: 'Dirección', type: 'text', required: true },
        { id: 'city', title: 'Ciudad', type: 'text', required: true },
      ],
    },
    {
      id: 'pipeline', title: 'Pipeline',
      fields: [
        {
          id: 'status', title: 'Estado', type: 'select', required: true,
          options: [
            { value: 'new', label: 'Nuevo' }, { value: 'coverage_check', label: 'Verificando cobertura' },
            { value: 'quoted', label: 'Cotización enviada' }, { value: 'scheduled', label: 'Instalación agendada' },
            { value: 'installed', label: 'Instalado ✓' }, { value: 'lost', label: 'Perdido' },
          ],
        },
        {
          id: 'lost_reason', title: 'Motivo de pérdida', type: 'select',
          options: [
            { value: 'price', label: 'Precio' }, { value: 'no_coverage', label: 'Sin cobertura' },
            { value: 'chose_competitor', label: 'Eligió competencia' },
            { value: 'not_responsive', label: 'Sin respuesta' }, { value: 'other', label: 'Otro' },
          ],
        },
        { id: 'installation_date', title: 'Fecha de instalación', type: 'date' },
        { id: 'notes', title: 'Notas', type: 'textarea' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-sales')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Pipeline
        </Button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{lead.phone} · {lead.city}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant={STATUS_VARIANT[lead.status] ?? 'neutral'} dot>
              {STATUS_LABEL[lead.status] ?? lead.status}
            </StatusBadge>
            {['new', 'coverage_check'].includes(lead.status) && (
              <Button type="button" variant="outline" size="sm" disabled={checking} onClick={checkCoverage}>
                <MapPin className="size-4 mr-1" /> Verificar cobertura
              </Button>
            )}
          </div>
        </div>

        {lead.coverage_status && (
          <div className={`p-3 rounded-lg border mb-6 text-sm ${lead.coverage_status === 'covered' ? 'bg-status-success-bg border-status-success-border text-status-success-text' : 'bg-status-error-bg border-status-error-border text-status-error-text'}`}>
            {lead.coverage_status === 'covered' ? '✓ Cobertura disponible' : '✗ Sin cobertura — en lista de espera'}
          </div>
        )}

        <CrudForm
          fields={[]}
          groups={groups}
          initialValues={lead}
          cancelHref="/backend/isp-sales"
          onSubmit={async (values) => {
            await updateCrud('isp-sales/leads', { id: params.id, ...values })
            flash('Lead actualizado', 'success')
            load()
          }}
          onDelete={async () => {
            await deleteCrud('isp-sales/leads', params.id)
            flash('Lead eliminado', 'success')
            router.push('/backend/isp-sales')
          }}
        />
      </PageBody>
    </Page>
  )
}
