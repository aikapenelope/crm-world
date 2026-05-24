'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Plus, AlertTriangle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type TicketRow = {
  id: string
  ticket_number: string
  type: string
  origin: string
  status: string
  priority: string
  subject: string
  subscriber_id: string | null
  assigned_to: string | null
  sla_breached: boolean
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  fault: 'Avería', inquiry: 'Consulta', plan_change: 'Cambio plan',
  move: 'Mudanza', new_service: 'Nuevo serv.', complaint: 'Queja',
}
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  open: 'error', assigned: 'warning', in_progress: 'info',
  pending_client: 'neutral', resolved: 'success', closed: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto', assigned: 'Asignado', in_progress: 'En proceso',
  pending_client: 'Pdte. cliente', resolved: 'Resuelto', closed: 'Cerrado',
}
const PRIORITY_VARIANT: Record<string, 'error' | 'warning' | 'neutral' | 'info'> = {
  critical: 'error', high: 'warning', normal: 'neutral', low: 'info',
}

export default function IspSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = React.useState<TicketRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [kpis, setKpis] = React.useState<any>(null)
  const [statusFilter, setStatusFilter] = React.useState('')

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const [tRes, kRes] = await Promise.all([
      apiCall<{ items: TicketRow[] }>(`/api/isp-support/tickets?${params}`, undefined, { fallback: { items: [] } }),
      apiCall<any>('/api/isp-support/dashboard', undefined, { fallback: null }),
    ])
    if (tRes.ok) setTickets(tRes.result?.items ?? [])
    if (kRes.ok) setKpis(kRes.result)
    setIsLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const columns: ColumnDef<TicketRow>[] = [
    {
      accessorKey: 'ticket_number', header: 'Ticket',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">{row.original.ticket_number}</span>
          {row.original.sla_breached && <AlertTriangle className="size-3 text-status-error-icon" />}
        </div>
      ),
    },
    { accessorKey: 'type', header: 'Tipo', cell: ({ row }) => TYPE_LABELS[row.original.type] ?? row.original.type },
    {
      accessorKey: 'subject', header: 'Asunto',
      cell: ({ row }) => <span className="text-sm">{row.original.subject}</span>,
    },
    {
      accessorKey: 'priority', header: 'Prioridad',
      cell: ({ row }) => (
        <StatusBadge variant={PRIORITY_VARIANT[row.original.priority] ?? 'neutral'} dot>
          {row.original.priority}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {STATUS_LABEL[row.original.status] ?? row.original.status}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'created_at', header: 'Creado',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'open', label: 'Ver detalle', onSelect: () => router.push(`/backend/isp-support/${row.original.id}`) },
        ]} />
      ),
    },
  ]

  const STATUS_FILTERS = [
    { value: '', label: 'Todos' }, { value: 'open', label: 'Abiertos' },
    { value: 'assigned', label: 'Asignados' }, { value: 'resolved', label: 'Resueltos' },
  ]

  const openCount = kpis?.by_status?.open ?? 0
  const breached = kpis?.sla_breached ?? 0
  const outages = kpis?.active_outages ?? 0

  return (
    <Page>
      <PageHeader
        title="Soporte Técnico"
        description={kpis ? `${openCount} abiertos · ${breached} SLA vencidos · ${outages} averías activas` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(f.value)}
                >{f.label}
                  {f.value === 'open' && openCount > 0 && <Badge variant="destructive" className="ml-1">{openCount}</Badge>}
                </Button>
              ))}
            </div>
            {outages > 0 && (
              <Button type="button" variant="destructive" size="sm" onClick={() => router.push('/backend/isp-support/outages')}>
                <AlertTriangle className="size-4 mr-1" /> {outages} averías activas
              </Button>
            )}
            <Button type="button" onClick={() => router.push('/backend/isp-support/create')}>
              <Plus className="size-4 mr-2" /> Nuevo ticket
            </Button>
          </div>
        }
      />
      <PageBody>
        <DataTable
          entityId="isp_support.ticket"
          extensionTableId="isp-tickets-list"
          data={tickets}
          columns={columns}
          isLoading={isLoading}
          emptyState='Sin tickets'
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
