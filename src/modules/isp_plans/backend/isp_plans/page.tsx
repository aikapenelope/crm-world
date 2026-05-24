'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { deleteCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type PlanRow = {
  id: string
  name: string
  technology: string
  download_mbps: number
  upload_mbps: number
  is_symmetric: boolean
  monthly_price_usd: string
  target_segment: string
  is_active: boolean
}

const TECH_LABELS: Record<string, string> = {
  fiber: 'Fibra', wireless: 'Inalámbrico', cable: 'Cable', dedicated: 'Dedicado',
}
const SEGMENT_LABELS: Record<string, string> = {
  residential: 'Residencial', pyme: 'PYME', corporate: 'Corporativo', wholesale: 'Mayorista',
}

export default function IspPlansPage() {
  const router = useRouter()
  const [plans, setPlans] = React.useState<PlanRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const res = await apiCall<{ items: PlanRow[] }>('/api/isp-plans/plans?pageSize=100', undefined, { fallback: { items: [] } })
    if (res.ok) setPlans(res.result?.items ?? [])
    setIsLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const columns: ColumnDef<PlanRow>[] = [
    {
      accessorKey: 'name', header: 'Plan',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          {row.original.is_symmetric && <Badge variant="secondary" className="ml-2 text-xs">Simétrico</Badge>}
        </div>
      ),
    },
    { accessorKey: 'technology', header: 'Tecnología', cell: ({ row }) => TECH_LABELS[row.original.technology] ?? row.original.technology },
    {
      id: 'speed', header: 'Velocidad',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.download_mbps}↓ / {row.original.upload_mbps}↑ Mbps</span>,
    },
    {
      accessorKey: 'monthly_price_usd', header: 'Precio/mes',
      cell: ({ row }) => <span className="font-semibold">USD {row.original.monthly_price_usd}</span>,
    },
    { accessorKey: 'target_segment', header: 'Segmento', cell: ({ row }) => SEGMENT_LABELS[row.original.target_segment] ?? row.original.target_segment },
    {
      accessorKey: 'is_active', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={row.original.is_active ? 'success' : 'neutral'} dot>
          {row.original.is_active ? 'Activo' : 'Inactivo'}
        </StatusBadge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'edit', label: 'Editar', onSelect: () => router.push(`/backend/isp-plans/${row.original.id}`) },
          {
            id: 'delete', label: 'Eliminar', destructive: true,
            onSelect: async () => {
              await deleteCrud('isp-plans/plans', row.original.id)
              flash('Plan eliminado', 'success')
              load()
            },
          },
        ]} />
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Planes de Servicio"
        actions={
          <Button type="button" onClick={() => router.push('/backend/isp-plans/create')}>
            <Plus className="size-4 mr-2" /> Nuevo plan
          </Button>
        }
      />
      <PageBody>
        <DataTable
          entityId="isp_plans.service_plan"
          extensionTableId="isp-plans-list"
          data={plans}
          columns={columns}
          isLoading={isLoading}
          emptyState='Sin planes'
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
