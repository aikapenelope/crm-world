'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, ChevronRight, ChevronDown } from 'lucide-react'

type BudgetItem = {
  id: string
  project_id: string
  item_number: string
  name: string
  unit: string | null
  quantity: string
  unit_cost: string
  total_cost: string
  category: string
  level: number
  is_chapter: boolean
  parent_id: string | null
}

type SummaryData = {
  grand_total: string
  item_count: number
  chapter_count: number
  by_category: Record<string, number>
  currency: string
}

type ProjectOption = { id: string; name: string }

const CATEGORY_LABELS: Record<string, string> = {
  civil: 'Civil', electrical: 'Eléctrico', mechanical: 'Mecánico',
  architectural: 'Arquitectónico', special: 'Especial', general: 'General',
}

export default function ConstBudgetPage() {
  const router = useRouter()
  const [items, setItems] = React.useState<BudgetItem[]>([])
  const [summary, setSummary] = React.useState<SummaryData | null>(null)
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [selectedProject, setSelectedProject] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set())

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
      const [itemsRes, sumRes] = await Promise.all([
        apiCall<{ items: BudgetItem[] }>(`/api/const-budget/items${qs}&pageSize=500`, undefined, { fallback: { items: [] } }),
        apiCall<SummaryData>(`/api/const-budget/summary${qs}`, undefined, { fallback: null }),
      ])
      if (itemsRes.ok) setItems(itemsRes.result?.items ?? [])
      if (sumRes.ok && sumRes.result) setSummary(sumRes.result)
      setIsLoading(false)
    }
    load()
  }, [selectedProject])

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Build visible items respecting collapse state
  const visibleItems = React.useMemo(() => {
    const hiddenParents = new Set<string>()
    return items.filter((item) => {
      if (item.parent_id && hiddenParents.has(item.parent_id)) {
        if (item.is_chapter || item.level === 0) hiddenParents.add(item.id)
        return false
      }
      if (collapsed.has(item.id)) hiddenParents.add(item.id)
      return true
    })
  }, [items, collapsed])

  const columns: ColumnDef<BudgetItem>[] = [
    {
      accessorKey: 'item_number',
      header: 'Ítem',
      cell: ({ row }) => (
        <div className="flex items-center" style={{ paddingLeft: `${row.original.level * 16}px` }}>
          {(row.original.is_chapter || row.original.level === 0) ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 mr-1"
              onClick={() => toggleCollapse(row.original.id)}
            >
              {collapsed.has(row.original.id)
                ? <ChevronRight className="size-3" />
                : <ChevronDown className="size-3" />}
            </Button>
          ) : (
            <span className="mr-1 w-5" />
          )}
          <span className={`font-mono text-xs ${row.original.is_chapter ? 'font-bold' : ''}`}>
            {row.original.item_number}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Descripción',
      cell: ({ row }) => (
        <span className={row.original.is_chapter ? 'font-semibold uppercase text-xs tracking-wide' : 'text-sm'}>
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: 'unit',
      header: 'Unid.',
      cell: ({ row }) => <span className="text-xs">{row.original.unit ?? '—'}</span>,
    },
    {
      accessorKey: 'quantity',
      header: 'Cantidad',
      cell: ({ row }) => row.original.is_chapter ? '—' : (
        <span className="font-mono text-xs">{Number(row.original.quantity).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
      ),
    },
    {
      accessorKey: 'unit_cost',
      header: 'P.U.',
      cell: ({ row }) => row.original.is_chapter ? '—' : (
        <span className="font-mono text-xs">${Number(row.original.unit_cost).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
      ),
    },
    {
      accessorKey: 'total_cost',
      header: 'Total',
      cell: ({ row }) => (
        <span className={`font-mono text-sm ${row.original.is_chapter ? 'font-bold' : ''}`}>
          ${Number(row.original.total_cost).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }) => row.original.is_chapter ? null : (
        <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[row.original.category] ?? row.original.category}</Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Presupuesto de Obra</h1>
          <Button type="button" onClick={() => router.push('/backend/const_budget/create')}>
            <Plus className="mr-2 size-4" />
            Nueva Partida
          </Button>
        </div>

        {/* Project filter */}
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

        {/* Summary */}
        {summary && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Monto Total</p>
              <p className="text-lg font-bold">$ {Number(summary.grand_total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Capítulos</p>
              <p className="text-lg font-bold">{summary.chapter_count}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Total Partidas</p>
              <p className="text-lg font-bold">{summary.item_count}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Mayor Capítulo</p>
              <p className="text-sm font-bold">
                {Object.keys(summary.by_category).length > 0
                  ? CATEGORY_LABELS[Object.entries(summary.by_category).sort(([, a], [, b]) => b - a)[0][0]] ?? '—'
                  : '—'}
              </p>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={visibleItems}
          isLoading={isLoading}
          searchPlaceholder="Buscar partida..."
        />
      </PageBody>
    </Page>
  )
}
