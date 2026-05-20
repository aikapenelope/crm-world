'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, HardHat, TrendingUp, AlertTriangle } from 'lucide-react'

type ProjectRow = {
  id: string
  name: string
  code: string
  project_type: string
  status: string
  client_name: string
  client_type: string
  contract_amount: string
  currency: string
  overall_progress: string
  planned_end_date: string | null
  project_manager: string | null
}

type DashboardData = {
  projects: { total: number; active: number; by_status: Record<string, number> }
  financials: { total_contract: string; total_billed: string; billing_rate: number; currency: string }
  progress: { avg_progress: number }
  rfis: { open: number }
}

const STATUS_LABELS: Record<string, string> = {
  prospect: 'Prospecto', bidding: 'Licitación', awarded: 'Adjudicado',
  in_progress: 'En Ejecución', on_hold: 'Pausado', completed: 'Completado', cancelled: 'Cancelado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  prospect: 'secondary', bidding: 'outline', awarded: 'outline',
  in_progress: 'default', on_hold: 'secondary', completed: 'secondary', cancelled: 'destructive',
}

const TYPE_LABELS: Record<string, string> = {
  residential: 'Residencial', commercial: 'Comercial', infrastructure: 'Infraestructura',
  industrial: 'Industrial', renovation: 'Remodelación',
}

export default function ConstProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = React.useState<ProjectRow[]>([])
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const [projRes, dashRes] = await Promise.all([
        apiCall<{ items: ProjectRow[] }>('/api/const-projects/projects?pageSize=100', undefined, { fallback: { items: [] } }),
        apiCall<DashboardData>('/api/const-projects/dashboard', undefined, { fallback: null }),
      ])
      if (projRes.ok) setProjects(projRes.result?.items ?? [])
      if (dashRes.ok && dashRes.result) setDashboard(dashRes.result)
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<ProjectRow>[] = [
    {
      accessorKey: 'name',
      header: 'Proyecto',
      cell: ({ row }) => (
        <div>
          <Button
            type="button"
            variant="ghost"
            className="h-auto p-0 text-left font-medium hover:underline"
            onClick={() => router.push(`/backend/const_projects/${row.original.id}`)}
          >
            {row.original.name}
          </Button>
          <p className="text-xs text-muted-foreground">{row.original.code}</p>
        </div>
      ),
    },
    {
      accessorKey: 'project_type',
      header: 'Tipo',
      cell: ({ row }) => <Badge variant="outline">{TYPE_LABELS[row.original.project_type] ?? row.original.project_type}</Badge>,
    },
    {
      accessorKey: 'client_name',
      header: 'Cliente',
      cell: ({ row }) => (
        <div>
          <span>{row.original.client_name}</span>
          <span className="ml-1 text-xs text-muted-foreground">({row.original.client_type === 'public' ? 'Público' : 'Privado'})</span>
        </div>
      ),
    },
    {
      accessorKey: 'contract_amount',
      header: 'Contrato',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.currency} {Number(row.original.contract_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'overall_progress',
      header: 'Avance',
      cell: ({ row }) => {
        const pct = Number(row.original.overall_progress)
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs">{pct.toFixed(0)}%</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'secondary'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'project_manager',
      header: 'Director',
      cell: ({ row }) => row.original.project_manager ?? '—',
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <HardHat className="size-6" />
            Proyectos de Construcción
          </h1>
          <Button type="button" onClick={() => router.push('/backend/const_projects/create')}>
            <Plus className="mr-2 size-4" />
            Nuevo Proyecto
          </Button>
        </div>

        {/* KPI Dashboard */}
        {dashboard && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Proyectos Activos</p>
              <p className="text-2xl font-bold">{dashboard.projects.active}</p>
              <p className="text-xs text-muted-foreground">{dashboard.projects.total} total</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Monto Contratado</p>
              <p className="text-lg font-bold">
                ${Number(dashboard.financials.total_contract).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">{dashboard.financials.currency}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Facturado</p>
              <p className="text-lg font-bold">
                ${Number(dashboard.financials.total_billed).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">{dashboard.financials.billing_rate}% del contrato</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Avance Promedio</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{dashboard.progress.avg_progress}%</p>
                <TrendingUp className="size-4 text-primary" />
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">RFIs Abiertos</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${dashboard.rfis.open > 0 ? 'text-destructive' : ''}`}>
                  {dashboard.rfis.open}
                </p>
                {dashboard.rfis.open > 0 && <AlertTriangle className="size-4 text-destructive" />}
              </div>
            </div>
          </div>
        )}

        <DataTable
          columns={columns}
          data={projects}
          isLoading={isLoading}
          searchPlaceholder="Buscar proyecto..."
        />
      </PageBody>
    </Page>
  )
}
