'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft } from 'lucide-react'
import { WorkflowApprovalWidget } from '@app/lib/workflows/WorkflowApprovalWidget'

type PageState = 'loading' | 'notFound' | 'ready'

const SEVERITY_VARIANT: Record<string, 'error' | 'warning' | 'neutral'> = {
  critical: 'error', major: 'warning', minor: 'neutral',
}
const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Crítica', major: 'Mayor', minor: 'Menor',
}
const STATUS_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'neutral' | 'success'> = {
  open: 'error', investigating: 'warning', pending_decision: 'warning',
  resolved: 'success', closed: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Abierta', investigating: 'En investigación', pending_decision: 'Pendiente decisión',
  resolved: 'Resuelta', closed: 'Cerrada',
}
const SOURCE_LABEL: Record<string, string> = {
  ccp_deviation: 'Desviación de PCC', temperature_excursion: 'Excursión de temperatura',
  microbiological: 'Resultado microbiológico', physical: 'Peligro físico',
  chemical: 'Peligro químico', bpm_checklist: 'Checklist BPM',
  external_audit: 'Auditoría externa', complaint: 'Reclamo de cliente',
}
const DECISION_LABEL: Record<string, string> = {
  rework: 'Retrabajo / Reproceso', destroy: 'Destrucción',
  release: 'Liberar con excepción documentada', hold: 'Cuarentena',
}

export default function NonConformityDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState]  = React.useState<PageState>('loading')
  const [nc, setNc]        = React.useState<any>(null)

  const load = React.useCallback(async () => {
    setState('loading')
    const res = await apiCall<{ items: any[] }>(
      `/api/agri-quality/non-conformities?id=${params.id}`,
    )
    const item = (res.result?.items ?? [])[0] ?? null
    if (!item) { setState('notFound'); return }
    setNc(item)
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando no-conformidad..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-quality')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> No-Conformidades
      </Button>
      <ErrorMessage message="No-Conformidad no encontrada." />
    </PageBody></Page>
  )

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-quality')} className="mb-6">
          <ArrowLeft className="mr-2 size-4" /> No-Conformidades
        </Button>

        <div className="max-w-2xl space-y-4">
          {/* Header card */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold font-mono">{nc.nc_number}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {SOURCE_LABEL[nc.source] ?? nc.source} · Detectada el{' '}
                  {new Date(nc.detection_date).toLocaleDateString('es-VE')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge variant={SEVERITY_VARIANT[nc.severity] ?? 'neutral'}>
                  {SEVERITY_LABEL[nc.severity] ?? nc.severity}
                </StatusBadge>
                <StatusBadge variant={STATUS_VARIANT[nc.status] ?? 'neutral'} dot>
                  {STATUS_LABEL[nc.status] ?? nc.status}
                </StatusBadge>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Descripción de la desviación</p>
              <p className="text-sm">{nc.description}</p>
            </div>

            {/* Investigation + decision fields (shown once filled) */}
            {nc.root_cause && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Causa raíz identificada</p>
                <p className="text-sm">{nc.root_cause}</p>
              </div>
            )}
            {nc.decision && (
              <div className="mb-3 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Disposición del lote</p>
                <p className="text-sm font-semibold">{DECISION_LABEL[nc.decision] ?? nc.decision}</p>
                {nc.decision_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Decidido el {new Date(nc.decision_date).toLocaleDateString('es-VE')}
                  </p>
                )}
              </div>
            )}
            {nc.corrective_action && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Acción correctiva</p>
                <p className="text-sm">{nc.corrective_action}</p>
              </div>
            )}
            {nc.preventive_action && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Acción preventiva</p>
                <p className="text-sm">{nc.preventive_action}</p>
              </div>
            )}
          </div>

          {/* WorkflowApprovalWidget */}
          <WorkflowApprovalWidget
            workflowId="no_conformidad_ccp_v1"
            entityId={nc.id}
            entityType="AgriNonConformity"
            title="Flujo de No-Conformidad HACCP"
            startLabel="Iniciar investigación formal"
            startContext={{
              nc_id:          nc.id,
              nc_number:      nc.nc_number,
              source:         nc.source,
              severity:       nc.severity,
              description:    nc.description,
              detection_date: nc.detection_date,
            }}
            decisions={[
              { value: 'rework',   label: 'Retrabajo / Reproceso',             variant: 'outline' },
              { value: 'destroy',  label: 'Destrucción del lote',              variant: 'destructive' },
              { value: 'release',  label: 'Liberar con excepción documentada', variant: 'default' },
              { value: 'hold',     label: 'Cuarentena — análisis adicional',   variant: 'outline' },
            ]}
            onCompleted={() => load()}
          />
        </div>
      </PageBody>
    </Page>
  )
}
