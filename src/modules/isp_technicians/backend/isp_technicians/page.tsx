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
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type TechRow = {
  id: string
  name: string
  phone: string
  status: string
  coverage_zone: string | null
  vehicle_plate: string | null
  fuel_allowance_usd: string | null
}

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
  available: 'success', on_route: 'info', on_site: 'warning', off_duty: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible', on_route: 'En ruta', on_site: 'En sitio', off_duty: 'No disponible',
}

export default function IspTechniciansPage() {
  const router = useRouter()
  const [techs, setTechs] = React.useState<TechRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [kpis, setKpis] = React.useState<any>(null)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const [tRes, kRes] = await Promise.all([
      apiCall<{ items: TechRow[] }>('/api/isp-technicians/technicians?pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<any>('/api/isp-technicians/dashboard', undefined, { fallback: null }),
    ])
    if (tRes.ok) setTechs(tRes.result?.items ?? [])
    if (kRes.ok) setKpis(kRes.result)
    setIsLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const columns: ColumnDef<TechRow>[] = [
    {
      accessorKey: 'name', header: 'Técnico',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    { accessorKey: 'phone', header: 'Teléfono', cell: ({ row }) => <span className="font-mono text-sm">{row.original.phone}</span> },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {STATUS_LABEL[row.original.status] ?? row.original.status}
        </StatusBadge>
      ),
    },
    { accessorKey: 'coverage_zone', header: 'Zona', cell: ({ row }) => row.original.coverage_zone ?? '—' },
    { accessorKey: 'vehicle_plate', header: 'Vehículo', cell: ({ row }) => <span className="font-mono text-sm">{row.original.vehicle_plate ?? '—'}</span> },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'edit', label: 'Editar', onSelect: () => router.push(`/backend/isp-technicians/${row.original.id}`) },
          {
            id: 'delete', label: 'Eliminar', destructive: true,
            onSelect: async () => { await deleteCrud('isp-technicians/technicians', row.original.id); flash('Técnico eliminado', 'success'); load() },
          },
        ]} />
      ),
    },
  ]

  const available = kpis?.technicians?.available ?? 0
  const todayOrders = kpis?.today_orders ?? 0

  return (
    <Page>
      <PageHeader
        title="Técnicos de Campo"
        description={kpis ? `${available} disponibles · ${todayOrders} órdenes programadas hoy` : undefined}
        actions={
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/isp-technicians/work-orders')}>
              Órdenes de Trabajo
            </Button>
            <Button type="button" onClick={() => router.push('/backend/isp-technicians/create')}>
              <Plus className="size-4 mr-2" /> Nuevo técnico
            </Button>
          </div>
        }
      />
      <PageBody>
        <DataTable
          entityId="isp_technicians.technician"
          extensionTableId="isp-technicians-list"
          data={techs}
          columns={columns}
          isLoading={isLoading}
          emptyState={{ label: 'Sin técnicos', description: 'Registra tu primer técnico de campo.' }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
