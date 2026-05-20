'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, ShoppingCart, AlertTriangle } from 'lucide-react'

type StockRow = {
  id: string
  material_name: string
  unit: string
  budget_quantity: string
  ordered_quantity: string
  received_quantity: string
  consumed_quantity: string
  available_quantity: string
  budget_variance: string
  is_over_budget: boolean
  unit_cost: string
  currency: string
}

type ProjectOption = { id: string; name: string }

export default function ConstMaterialsPage() {
  const router = useRouter()
  const [stock, setStock] = React.useState<StockRow[]>([])
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [selectedProject, setSelectedProject] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadProjects() {
      const res = await apiCall<{ items: ProjectOption[] }>('/api/const-projects/projects?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) setProjects(res.result?.items ?? [])
    }
    loadProjects()
  }, [])

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const qs = selectedProject ? `?project_id=${selectedProject}` : ''
      const res = await apiCall<{ items: StockRow[]; over_budget: number; total_value: string }>(
        `/api/const-materials/stock${qs}`, undefined, { fallback: { items: [], over_budget: 0, total_value: '0.00' } },
      )
      if (res.ok) setStock(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [selectedProject])

  const overBudgetCount = stock.filter((s) => s.is_over_budget).length
  const totalValue = stock.reduce((sum, s) => sum + Number(s.available_quantity) * Number(s.unit_cost), 0)

  const columns: ColumnDef<StockRow>[] = [
    {
      accessorKey: 'material_name',
      header: 'Material',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.is_over_budget && <AlertTriangle className="size-4 shrink-0 text-destructive" />}
          <span className={`text-sm ${row.original.is_over_budget ? 'text-destructive font-medium' : ''}`}>
            {row.original.material_name}
          </span>
        </div>
      ),
    },
    { accessorKey: 'unit', header: 'Unid.', cell: ({ row }) => <span className="text-xs">{row.original.unit}</span> },
    {
      accessorKey: 'budget_quantity',
      header: 'Presup.',
      cell: ({ row }) => <span className="font-mono text-xs">{Number(row.original.budget_quantity).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>,
    },
    {
      accessorKey: 'received_quantity',
      header: 'Recibido',
      cell: ({ row }) => <span className="font-mono text-xs">{Number(row.original.received_quantity).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>,
    },
    {
      accessorKey: 'consumed_quantity',
      header: 'Consumido',
      cell: ({ row }) => <span className={`font-mono text-xs ${row.original.is_over_budget ? 'text-destructive font-bold' : ''}`}>
        {Number(row.original.consumed_quantity).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
      </span>,
    },
    {
      accessorKey: 'available_quantity',
      header: 'Disponible',
      cell: ({ row }) => {
        const avail = Number(row.original.available_quantity)
        return <span className={`font-mono text-sm font-semibold ${avail < 0 ? 'text-destructive' : avail < 10 ? 'text-amber-600' : ''}`}>
          {avail.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      },
    },
    {
      id: 'deviation',
      header: 'Desviación',
      cell: ({ row }) => {
        const variance = Number(row.original.budget_variance)
        return variance !== 0 ? (
          <Badge variant={variance > 0 ? 'destructive' : 'default'}>
            {variance > 0 ? '+' : ''}{variance.toLocaleString('es-VE', { minimumFractionDigits: 2 })} {row.original.unit}
          </Badge>
        ) : <span className="text-muted-foreground">—</span>
      },
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Control de Materiales</h1>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/const_materials/orders')}>
              <ShoppingCart className="mr-2 size-4" />
              Órdenes de Compra
            </Button>
            <Button type="button" onClick={() => router.push('/backend/const_materials/orders/create')}>
              <Plus className="mr-2 size-4" />
              Nueva OC
            </Button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Proyecto:</label>
          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Todos</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Materiales</p>
            <p className="text-xl font-bold">{stock.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Sobre Presupuesto</p>
            <p className={`text-xl font-bold ${overBudgetCount > 0 ? 'text-destructive' : ''}`}>{overBudgetCount}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Valor en Stock</p>
            <p className="text-lg font-bold">$ {totalValue.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Sin Stock</p>
            <p className="text-xl font-bold">{stock.filter((s) => Number(s.available_quantity) <= 0).length}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={stock}
          isLoading={isLoading}
          searchPlaceholder="Buscar material..."
        />
      </PageBody>
    </Page>
  )
}
