'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft } from 'lucide-react'
import { WorkflowApprovalWidget } from '@/lib/workflows/WorkflowApprovalWidget'

type PageState = 'loading' | 'notFound' | 'ready'

const STATUS_VARIANT: Record<string, 'error' | 'warning' | 'success' | 'neutral'> = {
  investigating: 'error', executing: 'warning', completed: 'success', closed: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  investigating: 'Investigando', executing: 'En ejecución', completed: 'Completado', closed: 'Cerrado',
}
const CLASS_VARIANT: Record<string, 'error' | 'warning' | 'neutral'> = {
  'I': 'error', 'II': 'warning', 'III': 'neutral',
}
const SOURCE_LABEL: Record<string, string> = {
  customer_complaint: 'Reclamo de cliente', insai_alert: 'Alerta INSAI',
  internal_analysis: 'Análisis interno', supplier_notification: 'Proveedor',
  regulatory_audit: 'Auditoría regulatoria',
}

export default function RecallDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState]    = React.useState<PageState>('loading')
  const [recall, setRecall]  = React.useState<any>(null)

  const load = React.useCallback(async () => {
    setState('loading')
    const res = await apiCall<{ items: any[] }>(
      `/api/agri-traceability/recalls?id=${params.id}`,
    )
    const item = (res.result?.items ?? [])[0] ?? null
    if (!item) { setState('notFound'); return }
    setRecall(item)
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando recall..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-traceability')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Trazabilidad
      </Button>
      <ErrorMessage message="Recall no encontrado." />
    </PageBody></Page>
  )

  const affectedClients: any[] = recall.affected_clients ?? []

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-traceability')} className="mb-6">
          <ArrowLeft className="mr-2 size-4" /> Trazabilidad
        </Button>

        <div className="max-w-2xl space-y-4">
          {/* Header */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold font-mono">{recall.recall_number}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Lote afectado: <span className="font-mono font-medium">{recall.lot_number}</span>
                  {' · '}Origen: {SOURCE_LABEL[recall.detection_source] ?? recall.detection_source}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge variant={CLASS_VARIANT[recall.recall_class] ?? 'neutral'}>
                  Clase {recall.recall_class}
                </StatusBadge>
                <StatusBadge variant={STATUS_VARIANT[recall.status] ?? 'neutral'} dot>
                  {STATUS_LABEL[recall.status] ?? recall.status}
                </StatusBadge>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Razón del retiro</p>
              <p className="text-sm">{recall.reason}</p>
            </div>

            {/* INSAI alert for Class I */}
            {recall.recall_class === 'I' && (
              <div className="p-3 bg-status-error-bg border border-status-error-border rounded-lg text-sm text-status-error-text mb-4">
                ⚠ <strong>Clase I</strong> — Notificar al INSAI dentro de las 24 horas de detección (normativa venezolana).
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Clientes afectados</p>
                <p className="font-semibold">{affectedClients.length}</p>
              </div>
              {recall.quantity_recalled_kg && (
                <div>
                  <p className="text-xs text-muted-foreground">Cantidad retirada</p>
                  <p className="font-semibold">{recall.quantity_recalled_kg} kg</p>
                </div>
              )}
            </div>
          </div>

          {/* Affected clients list */}
          {affectedClients.length > 0 && (
            <div className="border border-border rounded-xl p-4 bg-card">
              <h3 className="text-sm font-semibold mb-3">Clientes Afectados ({affectedClients.length})</h3>
              <div className="space-y-2">
                {affectedClients.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                    <span className="font-medium">{c.client_name ?? 'Cliente'}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {c.quantity_kg && <span>{c.quantity_kg} kg</span>}
                      {c.notified_at ? (
                        <StatusBadge variant="success">Notificado</StatusBadge>
                      ) : (
                        <StatusBadge variant="warning">Pendiente notificación</StatusBadge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WorkflowApprovalWidget */}
          <WorkflowApprovalWidget
            workflowId="recall_v1"
            entityId={recall.id}
            entityType="AgriRecall"
            title="Proceso de Recall"
            startLabel="Solicitar aprobación del Gerente General"
            startContext={{
              recall_id:       recall.id,
              recall_number:   recall.recall_number,
              lot_number:      recall.lot_number,
              recall_class:    recall.recall_class,
              reason:          recall.reason,
              affected_count:  affectedClients.length,
            }}
            decisions={[
              { value: 'approve',          label: 'Aprobado — ejecutar recall',     variant: 'destructive' },
              { value: 'investigate_more', label: 'Ampliar investigación',           variant: 'outline' },
              { value: 'cancel',           label: 'Cancelar — evidencia insuficiente', variant: 'outline' },
            ]}
            onCompleted={() => load()}
          />
        </div>
      </PageBody>
    </Page>
  )
}
