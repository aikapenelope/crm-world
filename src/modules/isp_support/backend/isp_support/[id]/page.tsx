'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { ArrowLeft, CheckCircle, UserCheck } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  open: 'error', assigned: 'warning', in_progress: 'info',
  pending_client: 'neutral', resolved: 'success', closed: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto', assigned: 'Asignado', in_progress: 'En proceso',
  pending_client: 'Pendiente cliente', resolved: 'Resuelto', closed: 'Cerrado',
}
const TYPE_LABELS: Record<string, string> = {
  fault: 'Avería', inquiry: 'Consulta', plan_change: 'Cambio plan',
  move: 'Mudanza', new_service: 'Nuevo servicio', complaint: 'Queja',
}

type PageState = 'loading' | 'notFound' | 'error' | 'ready'

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [ticket, setTicket] = React.useState<any>(null)
  const [solution, setSolution] = React.useState('')
  const [resolving, setResolving] = React.useState(false)
  const [comments, setComments] = React.useState<any[]>([])
  const [newComment, setNewComment] = React.useState('')
  const [addingComment, setAddingComment] = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const [tRes, cRes] = await Promise.all([
      apiCall<{ items: any[] }>(`/api/isp-support/tickets?id=${params.id}`),
      apiCall<{ items: any[] }>(`/api/isp-support/tickets/comments?ticket_id=${params.id}`, undefined, { fallback: { items: [] } }),
    ])
    const item = tRes.result?.items?.[0] ?? null
    if (!item) { setState('notFound'); return }
    setTicket(item)
    setComments(cRes.result?.items ?? [])
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const resolveTicket = async () => {
    if (!solution.trim() || resolving) return
    setResolving(true)
    try {
      await apiCallOrThrow('/api/isp-support/tickets/resolve', {
        method: 'POST',
        body: JSON.stringify({ ticket_id: params.id, solution }),
      })
      flash('Ticket resuelto', 'success')
      load()
    } catch { flash('Error al resolver', 'error') }
    finally { setResolving(false) }
  }

  const addComment = async () => {
    if (!newComment.trim() || addingComment) return
    setAddingComment(true)
    try {
      await apiCallOrThrow('/api/isp-support/tickets/comments', {
        method: 'POST',
        body: JSON.stringify({ ticket_id: params.id, comment: newComment, is_internal: true }),
      })
      setNewComment('')
      load()
    } catch { flash('Error al comentar', 'error') }
    finally { setAddingComment(false) }
  }

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando ticket..." /></PageBody></Page>
  if (state === 'notFound') return <Page><PageBody><ErrorMessage label="Ticket no encontrado." /></PageBody></Page>

  const isOpen = ['open', 'assigned', 'in_progress'].includes(ticket.status)

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-support')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Soporte
        </Button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{ticket.ticket_number}</h1>
            <p className="text-sm text-muted-foreground mt-1">{TYPE_LABELS[ticket.type] ?? ticket.type} · {ticket.origin}</p>
          </div>
          <StatusBadge variant={STATUS_VARIANT[ticket.status] ?? 'neutral'} dot>
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </StatusBadge>
        </div>

        {/* Asunto y descripción */}
        <div className="p-4 bg-muted/30 rounded-lg border border-border mb-6">
          <h3 className="font-semibold mb-2">{ticket.subject}</h3>
          {ticket.description && <p className="text-sm text-muted-foreground">{ticket.description}</p>}
        </div>

        {/* Resolver ticket */}
        {isOpen && (
          <div className="mb-6 p-4 border border-border rounded-lg">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="size-4 text-status-success-icon" /> Resolver ticket
            </h3>
            <textarea
              className="w-full text-sm border border-input rounded-md p-3 min-h-[80px] bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Descripción de la solución aplicada..."
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
            />
            <div className="mt-3 flex justify-end">
              <Button type="button" disabled={!solution.trim() || resolving} onClick={resolveTicket}>
                <CheckCircle className="size-4 mr-2" /> Marcar como resuelto
              </Button>
            </div>
          </div>
        )}

        {/* Solución aplicada */}
        {ticket.solution && (
          <div className="mb-6 p-4 bg-status-success-bg border border-status-success-border rounded-lg">
            <p className="text-xs font-semibold text-status-success-text uppercase mb-1">Solución aplicada</p>
            <p className="text-sm">{ticket.solution}</p>
          </div>
        )}

        {/* Comentarios */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Comentarios internos</h3>
          {comments.map((c: any) => (
            <div key={c.id} className="p-3 bg-muted/30 rounded-lg border border-border text-sm">
              <p className="text-muted-foreground text-xs mb-1">{new Date(c.created_at).toLocaleString('es-VE')}</p>
              <p>{c.comment}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <textarea
              className="flex-1 text-sm border border-input rounded-md p-2 min-h-[60px] bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Agregar nota interna..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button type="button" size="sm" disabled={!newComment.trim() || addingComment} onClick={addComment}>
              Agregar
            </Button>
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
