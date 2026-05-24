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

type CpeRow = {
  id: string
  cpe_type: string
  brand: string
  model: string
  serial_number: string
  mac_address: string | null
  status: string
}

const TYPE_LABELS: Record<string, string> = {
  router: 'Router', ont: 'ONT (Fibra)', antenna: 'Antena', switch: 'Switch', other: 'Otro',
}
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
  in_stock: 'success', deployed: 'neutral', in_repair: 'warning', written_off: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  in_stock: 'En bodega', deployed: 'Instalado', in_repair: 'En reparación', written_off: 'Dado de baja',
}

export default function IspCpeInventoryPage() {
  const router = useRouter()
  const [items, setItems] = React.useState<CpeRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const res = await apiCall<{ items: CpeRow[] }>('/api/isp-network/cpe?pageSize=100', undefined, { fallback: { items: [] } })
    if (res.ok) setItems(res.result?.items ?? [])
    setIsLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const inStock = items.filter((i) => i.status === 'in_stock').length

  const columns: ColumnDef<CpeRow>[] = [
    { accessorKey: 'cpe_type', header: 'Tipo', cell: ({ row }) => TYPE_LABELS[row.original.cpe_type] ?? row.original.cpe_type },
    { accessorKey: 'brand', header: 'Marca' },
    {
      accessorKey: 'model', header: 'Modelo',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.model}</span>
          <div className="text-xs text-muted-foreground font-mono">{row.original.serial_number}</div>
        </div>
      ),
    },
    {
      accessorKey: 'mac_address', header: 'MAC',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.mac_address ?? '—'}</span>,
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
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'edit', label: 'Editar', onSelect: () => router.push(`/backend/isp-network/cpe/${row.original.id}`) },
          {
            id: 'delete', label: 'Eliminar', destructive: true,
            onSelect: async () => {
              await deleteCrud('isp-network/cpe', row.original.id)
              flash('Equipo eliminado', 'success')
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
        title="Inventario CPE"
        description={`${inStock} equipos disponibles en bodega`}
        actions={
          <Button type="button" onClick={() => router.push('/backend/isp-network/cpe/create')}>
            <Plus className="size-4 mr-2" /> Registrar equipo
          </Button>
        }
      />
      <PageBody>
        <DataTable
          entityId="isp_network.cpe"
          extensionTableId="isp-cpe-list"
          data={items}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin equipos"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
