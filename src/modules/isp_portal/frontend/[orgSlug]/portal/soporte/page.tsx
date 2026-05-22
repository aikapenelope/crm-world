'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { Plus, ArrowLeft } from 'lucide-react'

type Props = { params: { orgSlug: string } }

type Ticket = {
  id: string
  ticket_number: string
  type: string
  status: string
  subject: string
  solution: string | null
  created_at: string
  resolved_at: string | null
}

const STATUS_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'success' | 'neutral'> = {
  open: 'error', assigned: 'warning', in_progress: 'info', pending_client: 'neutral',
  resolved: 'success', closed: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto', assigned: 'Asignado', in_progress: 'En proceso',
  pending_client: 'En espera', resolved: 'Resuelto', closed: 'Cerrado',
}
const TYPE_LABELS: Record<string, string> = {
  fault: 'Avería / Sin servicio', inquiry: 'Consulta',
  plan_change: 'Cambio de plan', complaint: 'Queja', other: 'Otro',
}

export default function IspPortalSoporte({ params }: Props) {
  const { orgSlug } = params
  const router = useRouter()
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ tickets: Ticket[] }>('/api/isp-portal/tickets', undefined, { fallback: { tickets: [] } })
      if (res.ok) setTickets(res.result?.tickets ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => router.push(`/${orgSlug}/portal/home`)}>
            <ArrowLeft className="size-4 mr-1" />
          </Button>
          <h1 className="text-2xl font-bold">Soporte Técnico</h1>
        </div>
        <Button type="button" onClick={() => router.push(`/${orgSlug}/portal/soporte/nuevo`)}>
          <Plus className="size-4 mr-2" /> Nuevo ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No tienes tickets de soporte.</p>
          <Button type="button" variant="outline" onClick={() => router.push(`/${orgSlug}/portal/soporte/nuevo`)}>
            Reportar un problema
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-mono text-sm font-semibold">{t.ticket_number}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABELS[t.type] ?? t.type}</p>
                </div>
                <StatusBadge variant={STATUS_VARIANT[t.status] ?? 'neutral'} dot>
                  {STATUS_LABEL[t.status] ?? t.status}
                </StatusBadge>
              </div>
              <p className="text-sm font-medium">{t.subject}</p>
              {t.solution && (
                <div className="mt-2 p-3 rounded bg-status-success-bg border border-status-success-border">
                  <p className="text-xs font-semibold text-status-success-text mb-1">Solución aplicada</p>
                  <p className="text-xs">{t.solution}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(t.created_at).toLocaleDateString('es-VE')}
                {t.resolved_at && ` · Resuelto: ${new Date(t.resolved_at).toLocaleDateString('es-VE')}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
