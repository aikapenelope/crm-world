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

const SEV_VARIANT: Record<string, 'error' | 'warning' | 'neutral'> = {
  critical: 'error', major: 'warning', minor: 'neutral',
}
const SEV_LABEL: Record<string, string> = { critical: 'Crítica', major: 'Mayor', minor: 'Menor' }
const STATUS_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'neutral' | 'success'> = {
  open: 'error', under_review: 'warning', pending_disposition: 'warning',
  resolved: 'success', closed: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Abierta', under_review: 'En revisión', pending_disposition: 'Pendiente disposición',
  resolved: 'Resuelta', closed: 'Cerrada',
}
const SOURCE_LABEL: Record<string, string> = {
  receiving: 'Recepción de materia prima', in_process: 'Proceso productivo',
  finished_goods: 'Producto terminado', customer_return: 'Devolución de cliente', audit: 'Auditoría',
}
const DISPOSITION_LABEL: Record<string, string> = {
  rework: 'Retrabajo / Reproceso', scrap: 'Destrucción (baja)',
  use_as_is: 'Uso condicionado con desviación documentada',
  return_to_supplier: 'Devolución al proveedor', downgrade: 'Reclasificación calidad inferior',
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-border last:border-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  )
}

export default function NcDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [nc, setNc]       = React.useState<any>(null)

  const load = React.useCallback(async () => {
    setState('loading')
    const res = await apiCall<{ items: any[] }>(`/api/mfg-quality/nonconformances?id=${params.id}`)
    const item = (res.result?.items ?? [])[0] ?? null
    if (!item) { setState('notFound'); return }
    setNc(item)
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando No-Conformidad..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-quality')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Calidad
      </Button>
      <ErrorMessage message="No-Conformidad no encontrada." />
    </PageBody></Page>
  )

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-quality')} className="mb-6">
          <ArrowLeft className="mr-2 size-4" /> No-Conformidades
        </Button>

        <div className="max-w-2xl space-y-4">
          {/* Header card */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold font-mono">{nc.nc_number}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {SOURCE_LABEL[nc.source] ?? nc.source}
                  {nc.product_code && ` · ${nc.product_code}`}
                  {nc.lot_number && ` · Lote ${nc.lot_number}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge variant={SEV_VARIANT[nc.severity] ?? 'neutral'}>
                  {SEV_LABEL[nc.severity] ?? nc.severity}
                </StatusBadge>
                <StatusBadge variant={STATUS_VARIANT[nc.status] ?? 'neutral'} dot>
                  {STATUS_LABEL[nc.status] ?? nc.status}
                </StatusBadge>
              </div>
            </div>

            <div className="space-y-0">
              <Field label="Descripción de la desviación" value={nc.description} />
              {nc.quantity_affected && (
                <Field label="Cantidad afectada" value={`${nc.quantity_affected} ${nc.uom ?? ''}`} />
              )}
              {nc.root_cause && (
                <Field label="Causa raíz identificada" value={nc.root_cause} />
              )}
              {nc.disposition && (
                <Field
                  label="Disposición del material"
                  value={
                    <span className="font-semibold text-primary">
                      {DISPOSITION_LABEL[nc.disposition] ?? nc.disposition}
                    </span>
                  }
                />
              )}
              {nc.corrective_action && (
                <Field label="Acción correctiva" value={nc.corrective_action} />
              )}
              {nc.preventive_action && (
                <Field label="Acción preventiva" value={nc.preventive_action} />
              )}
              {nc.cost_nc_usd && (
                <Field
                  label="Costo de la No-Calidad"
                  value={<span className="font-semibold">USD {Number(nc.cost_nc_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>}
                />
              )}
            </div>
          </div>

          {/* WorkflowApprovalWidget */}
          <WorkflowApprovalWidget
            workflowId="nc_disposition_v1"
            entityId={params.id}
            entityType="MfgNonconformance"
            title="Investigación y Disposición de NC"
            startLabel="Iniciar investigación formal de causa raíz"
            startContext={{
              nc_id:             params.id,
              nc_number:         nc.nc_number,
              source:            nc.source,
              severity:          nc.severity,
              description:       nc.description,
              product_code:      nc.product_code,
              lot_number:        nc.lot_number,
              quantity_affected: nc.quantity_affected,
            }}
            decisions={[
              { value: 'approve',          label: 'Aprobado — ejecutar disposición',               variant: 'default' },
              { value: 'approve_modified', label: 'Aprobado con modificaciones documentadas',      variant: 'outline' },
              { value: 'reject',           label: 'Rechazado — investigación insuficiente',         variant: 'destructive' },
            ]}
            onCompleted={() => load()}
          />
        </div>
      </PageBody>
    </Page>
  )
}
