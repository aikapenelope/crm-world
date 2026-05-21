'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Flag, AlertTriangle, CalendarPlus } from 'lucide-react'
import { calendarLinks } from '@app/lib/calendar-links'

type GanttTask = {
  id: string
  task_number: string
  name: string
  level: number
  status: string
  planned_start: string
  planned_end: string
  actual_start: string | null
  progress_percent: string
  assigned_to: string | null
  is_milestone: boolean
  is_critical: boolean
  is_delayed: boolean
  days_remaining: number
}

type GanttMilestone = {
  id: string
  name: string
  milestone_type: string
  planned_date: string
  actual_date: string | null
  status: string
}

type GanttData = {
  tasks: GanttTask[]
  milestones: GanttMilestone[]
  summary: {
    total_tasks: number
    completed: number
    in_progress: number
    delayed: number
    critical: number
    avg_progress: number
  }
}

type ProjectOption = { id: string; name: string }

const STATUS_LABELS: Record<string, string> = {
  not_started: 'No iniciada', in_progress: 'En Progreso',
  completed: 'Completada', on_hold: 'Pausada', cancelled: 'Cancelada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  not_started: 'secondary', in_progress: 'default',
  completed: 'secondary', on_hold: 'outline', cancelled: 'destructive',
}

const MILESTONE_LABELS: Record<string, string> = {
  start: 'Inicio', delivery: 'Entrega', payment: 'Pago',
  inspection: 'Inspección', permit: 'Permiso', other: 'Otro',
}

const MILESTONE_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  upcoming: 'outline', at_risk: 'destructive', achieved: 'default', delayed: 'destructive',
}

export default function ConstSchedulePage() {
  const router = useRouter()
  const [data, setData] = React.useState<GanttData | null>(null)
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [selectedProject, setSelectedProject] = React.useState('')
  const [view, setView] = React.useState<'tasks' | 'milestones'>('tasks')
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
      const res = await apiCall<GanttData>(`/api/const-schedule/gantt${qs}`, undefined, { fallback: null })
      if (res.ok && res.result) setData(res.result)
      setIsLoading(false)
    }
    load()
  }, [selectedProject])

  const taskColumns: ColumnDef<GanttTask>[] = [
    {
      accessorKey: 'task_number',
      header: '#',
      cell: ({ row }) => (
        <div style={{ paddingLeft: `${row.original.level * 16}px` }}>
          <span className={`font-mono text-xs ${row.original.is_critical ? 'text-destructive font-bold' : ''}`}>
            {row.original.task_number}
          </span>
          {row.original.is_critical && <span className="ml-1 text-xs text-destructive">●</span>}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Tarea',
      cell: ({ row }) => (
        <div style={{ paddingLeft: `${row.original.level * 16}px` }}>
          <span className={`text-sm ${row.original.level === 0 ? 'font-semibold' : ''}`}>
            {row.original.is_milestone && <Flag className="mr-1 inline size-3 text-primary" />}
            {row.original.name}
          </span>
          {row.original.is_delayed && (
            <span className="ml-2 text-xs text-destructive">
              <AlertTriangle className="mr-1 inline size-3" />
              {Math.abs(row.original.days_remaining)}d retrasada
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'planned_start',
      header: 'Inicio Plan.',
      cell: ({ row }) => <span className="text-xs font-mono">{row.original.planned_start}</span>,
    },
    {
      accessorKey: 'planned_end',
      header: 'Fin Plan.',
      cell: ({ row }) => <span className={`text-xs font-mono ${row.original.is_delayed ? 'text-destructive' : ''}`}>{row.original.planned_end}</span>,
    },
    {
      accessorKey: 'progress_percent',
      header: 'Avance',
      cell: ({ row }) => {
        const pct = Number(row.original.progress_percent)
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 rounded-full bg-secondary">
              <div className={`h-2 rounded-full ${row.original.is_delayed ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
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
      accessorKey: 'assigned_to',
      header: 'Responsable',
      cell: ({ row }) => <span className="text-xs">{row.original.assigned_to ?? '—'}</span>,
    },
  ]

  const milestoneColumns: ColumnDef<GanttMilestone>[] = [
    {
      accessorKey: 'name',
      header: 'Hito',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Flag className="size-4 text-primary" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'milestone_type',
      header: 'Tipo',
      cell: ({ row }) => <Badge variant="outline">{MILESTONE_LABELS[row.original.milestone_type] ?? row.original.milestone_type}</Badge>,
    },
    {
      accessorKey: 'planned_date',
      header: 'Fecha Plan.',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.planned_date}</span>,
    },
    {
      accessorKey: 'actual_date',
      header: 'Fecha Real',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.actual_date ?? '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={MILESTONE_STATUS_VARIANTS[row.original.status] ?? 'secondary'}>
          {row.original.status === 'upcoming' ? 'Próximo' :
           row.original.status === 'at_risk' ? 'En Riesgo' :
           row.original.status === 'achieved' ? 'Alcanzado' : 'Retrasado'}
        </Badge>
      ),
    },
    {
      id: 'calendar',
      header: '',
      cell: ({ row }) => {
        if (row.original.status === 'achieved' || row.original.status === 'delayed') return null
        if (!row.original.planned_date) return null
        const d = new Date(row.original.planned_date)
        d.setHours(9, 0, 0, 0)
        const de = new Date(row.original.planned_date)
        de.setHours(10, 0, 0, 0)
        const links = calendarLinks({ title: `Hito: ${row.original.name}`, start: d, end: de })
        return (
          <a href={links.google} target="_blank" rel="noopener noreferrer" title="Agregar al calendario">
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0">
              <CalendarPlus className="size-3 text-muted-foreground" />
            </Button>
          </a>
        )
      },
    },
  ]

  const s = data?.summary

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cronograma</h1>
          <Button type="button" onClick={() => router.push('/backend/const_schedule/milestones')}>
            <Plus className="mr-2 size-4" />
            Agregar Hito
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">Proyecto:</label>
          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Todos</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="ml-auto flex rounded-md border">
            <Button
              type="button"
              variant={view === 'tasks' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => setView('tasks')}
            >
              Tareas
            </Button>
            <Button
              type="button"
              variant={view === 'milestones' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => setView('milestones')}
            >
              Hitos
            </Button>
          </div>
        </div>

        {/* KPIs */}
        {s && (
          <div className="mb-6 grid grid-cols-3 gap-4 md:grid-cols-6">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Tareas</p>
              <p className="text-xl font-bold">{s.total_tasks}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Completadas</p>
              <p className="text-xl font-bold">{s.completed}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">En Progreso</p>
              <p className="text-xl font-bold">{s.in_progress}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Retrasadas</p>
              <p className={`text-xl font-bold ${s.delayed > 0 ? 'text-destructive' : ''}`}>{s.delayed}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Ruta Crítica</p>
              <p className="text-xl font-bold">{s.critical}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Avance Prom.</p>
              <p className="text-xl font-bold">{s.avg_progress}%</p>
            </div>
          </div>
        )}

        {view === 'tasks' ? (
          <DataTable
            columns={taskColumns}
            data={data?.tasks ?? []}
            isLoading={isLoading}
            searchPlaceholder="Buscar tarea..."
          />
        ) : (
          <DataTable
            columns={milestoneColumns}
            data={data?.milestones ?? []}
            isLoading={isLoading}
            searchPlaceholder="Buscar hito..."
          />
        )}
      </PageBody>
    </Page>
  )
}
