'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, ArrowLeft } from 'lucide-react'

type UnitRow = {
  id: string
  building_id: string
  unit_number: string
  unit_type: string
  floor: string | null
  aliquot_percent: string
  status: string
  owner_name: string | null
  resident_name: string | null
}

type BuildingOption = {
  id: string
  name: string
}

export default function CondoUnitsPage() {
  const router = useRouter()
  const [units, setUnits] = React.useState<UnitRow[]>([])
  const [buildings, setBuildings] = React.useState<BuildingOption[]>([])
  const [selectedBuilding, setSelectedBuilding] = React.useState<string>('')
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadBuildings() {
      const res = await apiCall<{ items: BuildingOption[] }>(
        '/api/condo-properties/buildings?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (res.ok) {
        setBuildings(res.result?.items ?? [])
      }
    }
    loadBuildings()
  }, [])

  React.useEffect(() => {
    async function loadUnits() {
      setIsLoading(true)
      const url = selectedBuilding
        ? `/api/condo-properties/units?pageSize=100&building_id=${selectedBuilding}`
        : '/api/condo-properties/units?pageSize=100'
      const res = await apiCall<{ items: UnitRow[] }>(url, undefined, { fallback: { items: [] } })
      if (res.ok) {
        setUnits(res.result?.items ?? [])
      }
      setIsLoading(false)
    }
    loadUnits()
  }, [selectedBuilding])

  const unitTypeLabels: Record<string, string> = {
    apartment: 'Apartamento',
    penthouse: 'Penthouse',
    local: 'Local',
    office: 'Oficina',
    parking: 'Estacionamiento',
    storage: 'Depósito',
  }

  const statusLabels: Record<string, string> = {
    occupied: 'Ocupado',
    vacant: 'Vacante',
    for_sale: 'En Venta',
    for_rent: 'En Alquiler',
  }

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    occupied: 'default',
    vacant: 'secondary',
    for_sale: 'outline',
    for_rent: 'outline',
  }

  const columns: ColumnDef<UnitRow>[] = [
    {
      accessorKey: 'unit_number',
      header: 'Unidad',
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.unit_number}</span>,
    },
    {
      accessorKey: 'unit_type',
      header: 'Tipo',
      cell: ({ row }) => unitTypeLabels[row.original.unit_type] ?? row.original.unit_type,
    },
    {
      accessorKey: 'floor',
      header: 'Piso',
      cell: ({ row }) => row.original.floor ?? '—',
    },
    {
      accessorKey: 'aliquot_percent',
      header: 'Alícuota %',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {Number(row.original.aliquot_percent).toFixed(5)}%
        </span>
      ),
    },
    {
      accessorKey: 'owner_name',
      header: 'Propietario',
      cell: ({ row }) => row.original.owner_name ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status] ?? 'secondary'}>
          {statusLabels[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
  ]

  // Summary
  const totalAliquot = units.reduce((sum, u) => sum + Number(u.aliquot_percent), 0)

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/condo_properties')}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-bold">Unidades</h1>
          </div>
          <Button type="button" onClick={() => router.push('/backend/condo_properties/units/create')}>
            <Plus className="mr-2 size-4" />
            Nueva Unidad
          </Button>
        </div>

        {/* Building filter */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Edificio:</label>
          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">Todos</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {units.length > 0 && (
            <span className={`ml-auto text-sm font-mono ${Math.abs(totalAliquot - 100) > 0.01 ? 'text-destructive' : 'text-muted-foreground'}`}>
              Total alícuota: {totalAliquot.toFixed(5)}%
            </span>
          )}
        </div>

        <DataTable
          columns={columns}
          data={units}
          isLoading={isLoading}
          searchPlaceholder="Buscar unidad..."
        />
      </PageBody>
    </Page>
  )
}
