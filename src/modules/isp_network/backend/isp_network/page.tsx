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

type NodeRow = {
  id: string
  name: string
  node_type: string
  status: string
  city: string
  equipment_model: string | null
  has_generator: boolean
  battery_hours: number | null
  total_capacity_mbps: number | null
  used_capacity_mbps: number | null
}

const TYPE_LABELS: Record<string, string> = {
  pop_principal: 'POP Principal', nodo_distribucion: 'Distribución',
  nodo_acceso: 'Acceso', repetidora: 'Repetidora',
}
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success', degraded: 'warning', offline: 'error', maintenance: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Activo', degraded: 'Degradado', offline: 'Caído', maintenance: 'Mantenimiento',
}

export default function IspNetworkPage() {
  const router = useRouter()
  const [nodes, setNodes] = React.useState<NodeRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [kpis, setKpis] = React.useState<any>(null)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const [nodesRes, kpisRes] = await Promise.all([
      apiCall<{ items: NodeRow[] }>('/api/isp-network/nodes?pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<any>('/api/isp-network/dashboard', undefined, { fallback: null }),
    ])
    if (nodesRes.ok) setNodes(nodesRes.result?.items ?? [])
    if (kpisRes.ok) setKpis(kpisRes.result)
    setIsLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const reportOutage = async (nodeId: string, nodeName: string) => {
    try {
      await apiCallOrThrow('/api/isp-network/nodes/report-outage', {
        method: 'POST',
        body: JSON.stringify({ node_id: nodeId }),
      })
      flash(`Avería reportada en ${nodeName}`, 'success')
      load()
    } catch {
      flash('Error al reportar avería', 'error')
    }
  }

  const columns: ColumnDef<NodeRow>[] = [
    {
      accessorKey: 'name', header: 'Nodo',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    { accessorKey: 'node_type', header: 'Tipo', cell: ({ row }) => TYPE_LABELS[row.original.node_type] ?? row.original.node_type },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {STATUS_LABEL[row.original.status] ?? row.original.status}
        </StatusBadge>
      ),
    },
    { accessorKey: 'city', header: 'Ciudad' },
    {
      id: 'capacity', header: 'Capacidad',
      cell: ({ row }) => {
        if (!row.original.total_capacity_mbps) return <span className="text-muted-foreground">—</span>
        const used = row.original.used_capacity_mbps ?? 0
        const pct = Math.round((used / row.original.total_capacity_mbps) * 100)
        const isHigh = pct >= 80
        return (
          <span className={isHigh ? 'text-status-warning-text font-semibold' : ''}>
            {used}/{row.original.total_capacity_mbps} Mbps {isHigh && <AlertTriangle className="inline size-3 ml-1" />}
          </span>
        )
      },
    },
    {
      id: 'power', header: 'Energía',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.has_generator ? `${row.original.battery_hours ?? '?'}h + gen` : `${row.original.battery_hours ?? '?'}h UPS`}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'edit', label: 'Editar', onSelect: () => router.push(`/backend/isp-network/${row.original.id}`) },
          {
            id: 'report_outage', label: 'Reportar avería',
            onSelect: () => reportOutage(row.original.id, row.original.name),
          },
        ]} />
      ),
    },
  ]

  const offline = kpis?.nodes?.offline ?? 0
  const inStock = kpis?.cpe?.in_stock ?? 0

  return (
    <Page>
      <PageHeader
        title="Infraestructura de Red"
        description={kpis ? `${offline} nodo${offline !== 1 ? 's' : ''} caído${offline !== 1 ? 's' : ''} · ${inStock} CPEs en bodega` : undefined}
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/isp-network/cpe')}>
              Inventario CPE {inStock > 0 && <Badge variant="secondary" className="ml-2">{inStock}</Badge>}
            </Button>
            <Button type="button" onClick={() => router.push('/backend/isp-network/create')}>
              <Plus className="size-4 mr-2" /> Nuevo nodo
            </Button>
          </div>
        }
      />
      <PageBody>
        <DataTable
          entityId="isp_network.node"
          extensionTableId="isp-network-nodes-list"
          data={nodes}
          columns={columns}
          isLoading={isLoading}
          emptyState={{ title: 'Sin nodos', description: 'Registra el primer nodo de tu red.' }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
