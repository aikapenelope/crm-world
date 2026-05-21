/**
 * WorkflowApprovalWidget — shared approval UI component for Phase 19 workflows.
 *
 * Shows the workflow state inline on entity detail pages:
 * - No workflow running → "Solicitar Aprobación" button
 * - Running / waiting → status badge + step name
 * - PAUSED on USER_TASK → approve/reject form with optional comments
 * - Completed / cancelled → outcome badge
 *
 * Props:
 *   workflowId      — definition ID (e.g. 'gasto_extraordinario_v1')
 *   entityId        — entity being approved
 *   entityType      — for Workflows API metadata filter
 *   title           — widget title (e.g. "Aprobación de Gasto Extraordinario")
 *   startLabel      — label for the start button (e.g. "Solicitar aprobación de junta")
 *   startContext    — extra data to pass as initialContext when starting
 *   decisions       — available approval decisions (default: Aprobar / Rechazar)
 *   onCompleted     — callback when workflow reaches COMPLETED (reload page data)
 */
'use client'

import * as React from 'react'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Textarea } from '@open-mercato/ui/primitives/textarea'
import { CheckCircle2, XCircle, Clock, Play, Loader2, AlertCircle } from 'lucide-react'
import { useWorkflowApproval } from './useWorkflowApproval'

type Decision = { value: string; label: string; variant?: 'default' | 'destructive' | 'outline' }

const DEFAULT_DECISIONS: Decision[] = [
  { value: 'approve', label: 'Aprobar', variant: 'default' },
  { value: 'reject', label: 'Rechazar', variant: 'destructive' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  RUNNING: { label: 'En proceso', color: 'text-primary', icon: <Clock className="size-4" /> },
  PAUSED: { label: 'Esperando decisión', color: 'text-status-warning-text', icon: <Clock className="size-4" /> },
  WAITING_FOR_ACTIVITIES: { label: 'Procesando', color: 'text-primary', icon: <Loader2 className="size-4 animate-spin" /> },
  COMPLETED: { label: 'Completado', color: 'text-[#059669]', icon: <CheckCircle2 className="size-4" /> },
  FAILED: { label: 'Fallido', color: 'text-destructive', icon: <XCircle className="size-4" /> },
  CANCELLED: { label: 'Cancelado', color: 'text-muted-foreground', icon: <XCircle className="size-4" /> },
}

type Props = {
  workflowId: string
  entityId: string | null | undefined
  entityType: string
  title: string
  startLabel?: string
  startContext?: Record<string, unknown>
  decisions?: Decision[]
  onCompleted?: () => void
}

export function WorkflowApprovalWidget({
  workflowId,
  entityId,
  entityType,
  title,
  startLabel = 'Solicitar aprobación',
  startContext,
  decisions = DEFAULT_DECISIONS,
  onCompleted,
}: Props) {
  const wf = useWorkflowApproval({ workflowId, entityId, entityType })
  const [comments, setComments] = React.useState('')
  const prevStatus = React.useRef<string | null>(null)

  // Notify parent when workflow just completed
  React.useEffect(() => {
    if (wf.instance?.status === 'COMPLETED' && prevStatus.current !== 'COMPLETED') {
      onCompleted?.()
    }
    prevStatus.current = wf.instance?.status ?? null
  }, [wf.instance?.status, onCompleted])

  return (
    <div className="rounded-xl border overflow-hidden">
      {/* Widget header */}
      <div className="bg-primary/5 border-b px-4 py-3 flex items-center gap-2">
        <CheckCircle2 className="size-4 text-primary" />
        <span className="text-sm font-semibold">{title}</span>
        {wf.isLoading && <Loader2 className="size-3 animate-spin ml-auto text-muted-foreground" />}
      </div>

      <div className="p-4">
        {/* Error */}
        {wf.error && (
          <div className="flex items-center gap-2 text-destructive text-sm mb-3 rounded bg-destructive/10 px-3 py-2">
            <AlertCircle className="size-4 shrink-0" />
            {wf.error}
          </div>
        )}

        {/* No instance → start button */}
        {!wf.instance && !wf.isLoading && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-3">
              No hay un proceso de aprobación activo para este registro.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={() => wf.startWorkflow(startContext)}
              disabled={wf.isStarting || !entityId}
            >
              {wf.isStarting
                ? <><Loader2 className="mr-2 size-4 animate-spin" />Iniciando...</>
                : <><Play className="mr-2 size-4" />{startLabel}</>
              }
            </Button>
          </div>
        )}

        {/* Instance exists → show status */}
        {wf.instance && (
          <div className="space-y-4">
            {/* Status row */}
            <div className="flex items-center gap-2">
              <span className={STATUS_CONFIG[wf.instance.status]?.color ?? 'text-muted-foreground'}>
                {STATUS_CONFIG[wf.instance.status]?.icon}
              </span>
              <span className="text-sm font-medium">
                {STATUS_CONFIG[wf.instance.status]?.label ?? wf.instance.status}
              </span>
              <Badge variant="outline" className="ml-auto text-xs">
                Paso: {wf.instance.currentStepId}
              </Badge>
            </div>

            {/* USER_TASK form */}
            {wf.pendingTask && (
              <div className="rounded-lg border border-status-warning-border bg-status-warning-bg p-4 space-y-3">
                <div>
                  <div className="text-sm font-semibold text-status-warning-text">
                    {wf.pendingTask.taskName}
                  </div>
                  {wf.pendingTask.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{wf.pendingTask.description}</p>
                  )}
                  {wf.pendingTask.dueDate && (
                    <p className="text-xs text-status-warning-text mt-1">
                      Vence: {new Date(wf.pendingTask.dueDate).toLocaleDateString('es-VE')}
                    </p>
                  )}
                </div>

                {/* Comments textarea */}
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Comentarios <span className="text-muted-foreground">(opcional)</span>
                  </label>
                  <Textarea
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Justificación o notas sobre la decisión..."
                    className="h-16 resize-none text-sm"
                  />
                </div>

                {/* Decision buttons */}
                <div className="flex gap-2 flex-wrap">
                  {decisions.map(d => (
                    <Button
                      key={d.value}
                      type="button"
                      size="sm"
                      variant={d.variant ?? 'outline'}
                      disabled={wf.isSubmitting}
                      onClick={() => { wf.submitDecision(d.value, comments); setComments('') }}
                    >
                      {wf.isSubmitting
                        ? <Loader2 className="mr-2 size-4 animate-spin" />
                        : null
                      }
                      {d.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Completed / terminal state */}
            {['COMPLETED', 'CANCELLED', 'FAILED'].includes(wf.instance.status) && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Proceso finalizado
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => wf.startWorkflow(startContext)}
                  disabled={wf.isStarting}
                >
                  Nuevo proceso
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
