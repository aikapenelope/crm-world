'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import type { ColumnDef } from '@tanstack/react-table'

type OutageRow = {
  id: string
  outage_number: string
  cause: string
  status: string
  affected_subscribers: number
  started_at: string
  resolved_at: string | null
}

const CAUSE_LABELS: Record<string, string> = {
  power_outage: '⚡ Corte eléctrico (CORPOELEC)', fiber_cut: '✂️ Corte de fibra / robo',
  equipment_failure: '⚙️ Fallo de equipo', maintenance: '🔧 Mantenimiento',
  weather: '🌧️ Clima', theft: '🔴 Robo de equipo', unknown: '❓ Desconocida',
}
const STATUS_VARIANT: Record<string, 'error' | 'warning' | 'success'> = {
  active: 'error', investigating: 'warning', resolved: 'success',
}

export default function IspOutagesPage() {
  const [outages, setOutages] = React.useState<OutageRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [resolveId, setResolveId] = React.useState<string | null>(null)
  const [resolution, setResolution] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const res = await apiCall<{ items: OutageRow[] }>('/api/isp-support/outages?pageSize=50', undefined, { fallback: { items: [] } })
    if (res.ok) setOutages(res.result?.items ?? [])
    setIsLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const resolveOutage = async () => {
    if (!resolveId || !resolution.trim() || submitting) return
    setSubmitting(true)
    try {
      await apiCallOrThrow('/api/isp-support/outages/resolve', {
        method: 'POST',
        body: JSON.stringify({ outage_id: resolveId, resolution_notes: resolution }),
      })
      flash('Avería resuelta. Nodo restaurado y tickets cerrados.', 'success')
      setResolveId(null)
      setResolution('')
      load()
    } catch { flash('Error al resolver avería', 'error') }
    finally { setSubmitting(false) }
  }

  const columns: ColumnDef<OutageRow>[] = [
    {
      accessorKey: 'outage_number', header: 'Avería',
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.outage_number}</span>,
    },
    { accessorKey: 'cause', header: 'Causa', cell: ({ row }) => CAUSE_LABELS[row.original.cause] ?? row.original.cause },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {row.original.status}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'affected_subscribers', header: 'Afectados',
      cell: ({ row }) => <span className="font-semibold">{row.original.affected_subscribers}</span>,
    },
    {
      accessorKey: 'started_at', header: 'Inicio',
      cell: ({ row }) => new Date(row.original.started_at).toLocaleString('es-VE'),
    },
    {
      id: 'actions',
      cell: ({ row }) => row.original.status !== 'resolved' ? (
        <RowActions items={[
          { id: 'resolve', label: 'Resolver avería', onSelect: () => { setResolveId(row.original.id); setResolution('') } },
        ]} />
      ) : null,
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Averías Masivas"
        description="Cortes que afectan múltiples abonados de un mismo nodo"
      />
      <PageBody>
        {/* Resolve dialog */}
        {resolveId && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-background">
            <h3 className="text-sm font-semibold mb-3">Resolver avería</h3>
            <textarea
              className="w-full text-sm border border-input rounded-md p-3 min-h-[80px] bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Describe cómo se resolvió la avería (ej: CORPOELEC restableció el servicio)..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
            <div className="mt-3 flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setResolveId(null)}>Cancelar</Button>
              <Button type="button" size="sm" disabled={!resolution.trim() || submitting} onClick={resolveOutage}>
                Confirmar resolución
              </Button>
            </div>
          </div>
        )}

        <DataTable
          entityId="isp_support.outage"
          extensionTableId="isp-outages-list"
          data={outages}
          columns={columns}
          isLoading={isLoading}
          emptyState={{ title: 'Sin averías registradas', description: 'Las averías masivas se crean automáticamente cuando se reporta un nodo caído.' }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
