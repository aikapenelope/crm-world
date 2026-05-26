'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Car } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type VehicleRow = {
  id: string
  customer_id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string | null
  engine_type: string
  transmission: string
  current_km: number
}

const ENGINE_LABELS: Record<string, string> = {
  gasoline: 'Gasolina', diesel: 'Diésel', hybrid: 'Híbrido', electric: 'Eléctrico', gas: 'Gas',
}

export default function AutoVehiclesPage() {
  const t = useT()
  const router = useRouter()
  const [vehicles, setVehicles] = React.useState<VehicleRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: VehicleRow[] }>('/api/auto-vehicles/vehicles?pageSize=100', undefined, { fallback: { items: [] } })
      if (call.ok) { setVehicles(call.result?.items ?? []) }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<VehicleRow>[] = [
    { accessorKey: 'plate', header: t('auto_vehicles.list.col.plate', 'Placa'), cell: ({ row }) => <span className="font-mono font-bold">{row.original.plate}</span> },
    {
      id: 'vehicle', header: t('auto_vehicles.list.col.vehicle', 'Vehículo'),
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.brand} {row.original.model}</span>
          <span className="text-muted-foreground ml-2">{row.original.year}</span>
        </div>
      ),
    },
    { accessorKey: 'color', header: t('auto_vehicles.list.col.color', 'Color'), cell: ({ row }) => row.original.color ?? '—' },
    { accessorKey: 'engine_type', header: t('auto_vehicles.list.col.engine', 'Motor'), cell: ({ row }) => ENGINE_LABELS[row.original.engine_type] ?? row.original.engine_type },
    { accessorKey: 'transmission', header: t('auto_vehicles.list.col.transmission', 'Transmisión'), cell: ({ row }) => row.original.transmission === 'automatic' ? 'Automático' : 'Manual' },
    { accessorKey: 'current_km', header: t('auto_vehicles.list.col.km', 'Km'), cell: ({ row }) => row.original.current_km > 0 ? `${row.original.current_km.toLocaleString('es-VE')} km` : '—' },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Car className="size-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{t('auto_vehicles.list.title', 'Vehículos')}</h1>
          </div>
          <Button type="button" onClick={() => router.push('/backend/auto_vehicles/create')}>
            <Plus className="mr-2 size-4" />
            {t('auto_vehicles.list.new_button', 'Registrar Vehículo')}
          </Button>
        </div>
        <DataTable columns={columns} data={vehicles} isLoading={isLoading} searchPlaceholder={t('auto_vehicles.list.search_placeholder', 'Buscar por placa, marca o modelo...')} />
      </PageBody>
    </Page>
  )
}
