'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Sun, Cloud, CloudRain, Wind, AlertTriangle } from 'lucide-react'

type ReportRow = {
  id: string
  report_number: string
  report_date: string
  weather: string
  work_hours: string
  status: string
  safety_incidents: number
  submitted_by: string | null
  overall_notes: string | null
}

type ProjectOption = { id: string; name: string }

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  sunny: React.createElement(Sun, { className: 'size-4 text-status-warning-icon' }),
  cloudy: React.createElement(Cloud, { className: 'size-4 text-muted-foreground' }),
  rainy: React.createElement(CloudRain, { className: 'size-4 text-status-info-icon' }),
  windy: React.createElement(Wind, { className: 'size-4 text-muted-foreground' }),
  foggy: React.createElement(Cloud, { className: 'size-4 text-muted-foreground' }),
}

const WEATHER_LABELS: Record<string, string> = {
  sunny: 'Soleado', cloudy: 'Nublado', rainy: 'Lluvioso', windy: 'Ventoso', foggy: 'Neblina',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary', submitted: 'outline', approved: 'default',
}

export default function ConstDailyPage() {
  const router = useRouter()
  const [reports, setReports] = React.useState<ReportRow[]>([])
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
      const res = await apiCall<{ items: ReportRow[] }>(`/api/const-daily/reports${qs}`, undefined, { fallback: { items: [] } })
      if (res.ok) setReports(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [selectedProject])

  const totalIncidents = reports.reduce((s, r) => s + r.safety_incidents, 0)

  const columns: ColumnDef<ReportRow>[] = [
    {
      accessorKey: 'report_number',
      header: '#',
      cell: ({ row }) => <span className="font-mono font-bold">{row.original.report_number}</span>,
    },
    {
      accessorKey: 'report_date',
      header: 'Fecha',
      cell: ({ row }) => <span className="font-mono">{row.original.report_date}</span>,
    },
    {
      accessorKey: 'weather',
      header: 'Clima',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {WEATHER_ICONS[row.original.weather]}
          <span className="text-xs">{WEATHER_LABELS[row.original.weather] ?? row.original.weather}</span>
        </div>
      ),
    },
    {
      accessorKey: 'work_hours',
      header: 'Horas',
      cell: ({ row }) => <span className="text-sm">{row.original.work_hours}h</span>,
    },
    {
      accessorKey: 'safety_incidents',
      header: 'Seguridad',
      cell: ({ row }) => row.original.safety_incidents > 0 ? (
        <div className="flex items-center gap-1 text-destructive">
          <AlertTriangle className="size-4" />
          <span className="font-bold">{row.original.safety_incidents}</span>
        </div>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'submitted_by',
      header: 'Elaborado por',
      cell: ({ row }) => <span className="text-xs">{row.original.submitted_by ?? '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'secondary'}>
          {row.original.status === 'draft' ? 'Borrador' : row.original.status === 'submitted' ? 'Enviado' : 'Aprobado'}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Reportes Diarios de Obra</h1>
          <Button type="button" onClick={() => router.push('/backend/const_daily/create')}>
            <Plus className="mr-2 size-4" />
            Nuevo RDO
          </Button>
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
            <p className="text-xs text-muted-foreground">Reportes</p>
            <p className="text-xl font-bold">{reports.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Aprobados</p>
            <p className="text-xl font-bold">{reports.filter((r) => r.status === 'approved').length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Horas Totales</p>
            <p className="text-xl font-bold">{reports.reduce((s, r) => s + Number(r.work_hours), 0).toFixed(0)}h</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Incidentes</p>
            <p className={`text-xl font-bold ${totalIncidents > 0 ? 'text-destructive' : ''}`}>{totalIncidents}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={reports}
          isLoading={isLoading}
          searchPlaceholder="Buscar reporte..."
          onRowClick={(row) => router.push(`/backend/const_daily/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
