/**
 * AGM Exception: raw <form> — inline answer panel
 *
 * This detail page includes a small inline form for answering RFIs (toggle showAnswerForm).
 * CrudForm is designed for full-page create/edit flows and doesn't cleanly support
 * the "toggle-in-detail-view" UX pattern where a form panel appears inline within
 * an otherwise read-only detail view.
 *
 * Migrate to a dedicated action page + CrudForm if the answer form grows beyond 3 fields.
 */
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { WorkflowApprovalWidget } from '@app/lib/workflows/WorkflowApprovalWidget'

type RFI = {
  id: string
  rfi_number: string
  subject: string
  description: string
  discipline: string
  priority: string
  status: string
  submitted_by: string
  assigned_to: string | null
  due_date: string | null
  answered_at: string | null
  answer: string | null
  cost_impact: string | null
  schedule_impact_days: number | null
  linked_drawing: string | null
  project_id: string
  created_at: string
}

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierta', pending_response: 'Esperando respuesta',
  answered: 'Respondida', closed: 'Cerrada',
}

const DISCIPLINE_LABELS: Record<string, string> = {
  architecture: 'Arquitectura', structural: 'Estructural', mechanical: 'Mecánico',
  electrical: 'Eléctrico', plumbing: 'Plomería', civil: 'Civil', other: 'Otro',
}

export default function ConstRFIDetailPage() {
  const params = useParams()
  const router = useRouter()
  const rfiId = params?.id as string

  const [rfi, setRfi] = React.useState<RFI | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showAnswerForm, setShowAnswerForm] = React.useState(false)
  const [answering, setAnswering] = React.useState(false)
  const [answerText, setAnswerText] = React.useState('')
  const [costImpact, setCostImpact] = React.useState('')
  const [scheduleImpact, setScheduleImpact] = React.useState('')

  async function load() {
    setIsLoading(true)
    const res = await apiCall<{ items: RFI[] }>(
      `/api/const-rfis/rfis?id=${rfiId}`,
      undefined,
      { fallback: { items: [] } },
    )
    const r = res.result?.items?.[0] ?? null
    setRfi(r)
    if (r?.answer) setAnswerText(r.answer)
    setIsLoading(false)
  }

  React.useEffect(() => { if (rfiId) load() }, [rfiId])

  async function handleAnswer(e: React.FormEvent) {
    e.preventDefault()
    if (!rfi) return
    setAnswering(true)
    const res = await apiCall('/api/const-rfis/rfis/answer', {
      method: 'POST',
      body: JSON.stringify({
        rfi_id: rfi.id,
        answer: answerText,
        cost_impact: costImpact ? parseFloat(costImpact) : null,
        schedule_impact_days: scheduleImpact ? parseInt(scheduleImpact) : null,
      }),
    })
    if (res.ok) {
      flash('RFI respondido', 'success')
      setShowAnswerForm(false)
      await load()
    } else {
      flash('Error al responder el RFI', 'error')
    }
    setAnswering(false)
  }

  if (isLoading) return <LoadingMessage label="Cargando RFI..." />
  if (!rfi) return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/const_rfis')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Volver
        </Button>
        <p className="mt-4 text-muted-foreground">RFI no encontrado.</p>
      </PageBody>
    </Page>
  )

  const isAnswered = rfi.status === 'answered' || rfi.status === 'closed'
  const isOverdue = !isAnswered && rfi.due_date && new Date(rfi.due_date) < new Date()

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/const_rfis')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          RFIs
        </Button>

        {/* Header */}
        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{rfi.rfi_number}</h1>
              <Badge variant={rfi.priority === 'urgent' ? 'destructive' : rfi.priority === 'high' ? 'outline' : 'secondary'}>
                {PRIORITY_LABELS[rfi.priority] ?? rfi.priority}
              </Badge>
              <Badge variant={isAnswered ? 'secondary' : 'outline'}>
                {STATUS_LABELS[rfi.status] ?? rfi.status}
              </Badge>
            </div>
            <p className="text-lg font-medium mt-1">{rfi.subject}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {DISCIPLINE_LABELS[rfi.discipline] ?? rfi.discipline}
              {' · '}Enviado por {rfi.submitted_by}
              {rfi.assigned_to && ` · Asignado a: ${rfi.assigned_to}`}
            </p>
          </div>
          {!isAnswered && (
            <Button type="button" size="sm" onClick={() => setShowAnswerForm(v => !v)}>
              <CheckCircle2 className="mr-2 size-4" />
              Responder
            </Button>
          )}
        </div>

        {/* Overdue warning */}
        {isOverdue && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-status-warning-border bg-status-warning-bg px-4 py-2 text-sm text-status-warning-text">
            <AlertTriangle className="size-4 shrink-0" />
            RFI vencido desde {new Date(rfi.due_date!).toLocaleDateString('es-VE')}
          </div>
        )}

        {/* Answer form */}
        {showAnswerForm && (
          <form onSubmit={handleAnswer} className="rounded-lg border p-4 mb-6 bg-muted/20 space-y-4">
            <h3 className="font-semibold text-sm">Respuesta técnica</h3>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Respuesta *</label>
              <textarea
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                rows={4}
                required
                placeholder="Descripción técnica de la respuesta..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Impacto en costo (USD, opcional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costImpact}
                  onChange={e => setCostImpact(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Impacto en cronograma (días, opcional)</label>
                <input
                  type="number"
                  min="0"
                  value={scheduleImpact}
                  onChange={e => setScheduleImpact(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAnswerForm(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={answering || !answerText.trim()}>
                {answering ? 'Guardando...' : 'Confirmar respuesta'}
              </Button>
            </div>
          </form>
        )}

        {/* Content grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Descripción</h3>
            <p className="text-sm whitespace-pre-wrap">{rfi.description}</p>
            {rfi.linked_drawing && (
              <div className="text-sm text-muted-foreground">
                Plano referenciado: <span className="font-medium">{rfi.linked_drawing}</span>
              </div>
            )}
          </div>
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Detalles</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha creación</span>
                <span>{new Date(rfi.created_at).toLocaleDateString('es-VE')}</span>
              </div>
              {rfi.due_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha límite</span>
                  <span className={isOverdue ? 'text-destructive font-medium' : ''}>
                    {new Date(rfi.due_date).toLocaleDateString('es-VE')}
                    {isOverdue && ' (vencido)'}
                  </span>
                </div>
              )}
              {rfi.answered_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Respondido</span>
                  <span>{new Date(rfi.answered_at).toLocaleDateString('es-VE')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Answer */}
        {rfi.answer && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <CheckCircle2 className="size-4" />
              Respuesta técnica
            </div>
            <p className="text-sm whitespace-pre-wrap">{rfi.answer}</p>
            {(rfi.cost_impact || rfi.schedule_impact_days) && (
              <div className="flex gap-4 text-sm pt-2 border-t border-primary/20">
                {rfi.cost_impact && (
                  <span className="text-muted-foreground">
                    Impacto costo: <span className="font-medium text-foreground">USD {Number(rfi.cost_impact).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                  </span>
                )}
                {rfi.schedule_impact_days && (
                  <span className="text-muted-foreground">
                    Impacto cronograma: <span className="font-medium text-foreground">{rfi.schedule_impact_days} días</span>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Change Order — flujo de aprobación formal para RFIs con impacto contractual */}
        <div className="mt-6 max-w-md">
          <WorkflowApprovalWidget
            workflowId="change_order_approval_v1"
            entityId={rfi?.id ?? null}
            entityType="ConstRfi"
            title="Aprobación de Change Order"
            startLabel="Iniciar flujo de change order"
            startContext={{
              rfi_id: rfi?.id,
              rfi_number: rfi?.rfi_number,
              subject: rfi?.subject,
            }}
            decisions={[
              { value: 'approve', label: 'Aprobación técnica', variant: 'default' },
              { value: 'needs_revision', label: 'Requiere revisión', variant: 'outline' },
              { value: 'reject', label: 'Rechazar', variant: 'destructive' },
            ]}
            onCompleted={() => load()}
          />
        </div>
      </PageBody>
    </Page>
  )
}
