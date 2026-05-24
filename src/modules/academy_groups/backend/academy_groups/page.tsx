'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { useAppEvent } from '@open-mercato/ui/backend/injection/useAppEvent'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Calendar, LayoutGrid, List, Clock, Users, CheckCircle2 } from 'lucide-react'

type GroupRow = {
  id: string
  group_code: string
  course_id: string
  instructor_id: string | null
  start_date: string
  end_date: string
  schedule_days: string[]
  schedule_time: string
  status: string
  max_students: number
  enrolled_count: number
  sessions_count: number
}

type CourseMap = Record<string, string>
type InstructorMap = Record<string, string>

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programado', in_progress: 'En curso',
  completed: 'Completado', cancelled: 'Cancelado',
}
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'outline', in_progress: 'default',
  completed: 'secondary', cancelled: 'destructive',
}

const DAY_SHORT: Record<string, string> = {
  monday: 'L', tuesday: 'Ma', wednesday: 'Mi',
  thursday: 'J', friday: 'V', saturday: 'S', sunday: 'D',
}

const KANBAN_COLUMNS = [
  { id: 'scheduled', label: 'Programados', color: 'border-border bg-muted/30' },
  { id: 'in_progress', label: 'En Curso', color: 'border-primary/30 bg-primary/5' },
  { id: 'completed', label: 'Completados', color: 'border-border bg-muted/10' },
  { id: 'cancelled', label: 'Cancelados', color: 'border-destructive/20 bg-destructive/5' },
]

// ─── Kanban card ──────────────────────────────────────────────────────────────
function GroupCard({
  group,
  courseName,
  instructorName,
  onClick,
}: {
  group: GroupRow
  courseName: string
  instructorName: string
  onClick: () => void
}) {
  const days = (group.schedule_days ?? []).map(d => DAY_SHORT[d] ?? d).join('/')
  const fillPercent = group.max_students > 0
    ? Math.round((group.enrolled_count / group.max_students) * 100)
    : 0
  const isNearFull = fillPercent >= 80
  const isFull = fillPercent >= 100
  const isActive = group.status === 'in_progress'

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-background p-4 h-auto shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex-col items-start font-normal"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm truncate">{group.group_code}</div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">{courseName}</div>
        </div>
        {isActive && (
          <span className="ml-2 flex h-2 w-2 shrink-0 mt-1">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        )}
      </div>

      {/* Instructor */}
      {instructorName && (
        <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <Users className="size-3" />
          {instructorName}
        </div>
      )}

      {/* Enrollment progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className={`font-medium ${isFull ? 'text-destructive' : isNearFull ? 'text-status-warning-text' : 'text-muted-foreground'}`}>
            {group.enrolled_count}/{group.max_students} alumnos
          </span>
          <span className={`${isFull ? 'text-destructive' : isNearFull ? 'text-status-warning-text' : 'text-muted-foreground'}`}>
            {fillPercent}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFull ? 'bg-destructive' : isNearFull ? 'bg-status-warning-text' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(100, fillPercent)}%` }}
          />
        </div>
      </div>

      {/* Schedule + dates */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="size-3" />
          <span>{days} {group.schedule_time}</span>
        </div>
        <span>
          {new Date(group.start_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
          {' – '}
          {new Date(group.end_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      </div>

      {/* Sessions progress (only when in_progress) */}
      {isActive && group.sessions_count > 0 && (
        <div className="mt-2 pt-2 border-t flex items-center gap-1 text-xs text-primary">
          <CheckCircle2 className="size-3" />
          <span>{group.sessions_count} sesiones generadas</span>
        </div>
      )}
    </Button>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AcademyGroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = React.useState<GroupRow[]>([])
  const [courseNames, setCourseNames] = React.useState<CourseMap>({})
  const [instructorNames, setInstructorNames] = React.useState<InstructorMap>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'board' | 'list'>('board')

  async function load() {
    setIsLoading(true)
    const [groupsRes, coursesRes, instrRes] = await Promise.all([
      apiCall<{ items: GroupRow[] }>('/api/academy-groups/groups?pageSize=200', undefined, { fallback: { items: [] } }),
      apiCall<{ items: { id: string; name: string }[] }>('/api/academy-courses/courses?pageSize=200', undefined, { fallback: { items: [] } }),
      apiCall<{ items: { id: string; name: string }[] }>('/api/academy-instructors/instructors?pageSize=200', undefined, { fallback: { items: [] } }),
    ])
    setGroups(groupsRes.result?.items ?? [])
    const cmap: CourseMap = {}
    for (const c of (coursesRes.result?.items ?? [])) cmap[c.id] = c.name
    setCourseNames(cmap)
    const imap: InstructorMap = {}
    for (const i of (instrRes.result?.items ?? [])) imap[i.id] = i.name
    setInstructorNames(imap)
    setIsLoading(false)
  }

  React.useEffect(() => { load() }, [])

  // Real-time: refresh when an enrollment is created (affects enrolled_count)
  useAppEvent('academy_enrollments.enrollment.created', () => { void load() }, [])

  // Stats
  const inProgress = groups.filter(g => g.status === 'in_progress')
  const scheduled = groups.filter(g => g.status === 'scheduled')
  const totalEnrolled = inProgress.reduce((s, g) => s + g.enrolled_count, 0)

  // List view columns
  const columns: ColumnDef<GroupRow>[] = [
    {
      header: 'Grupo',
      accessorKey: 'group_code',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.group_code}</div>
          <div className="text-xs text-muted-foreground">{courseNames[row.original.course_id] ?? '—'}</div>
        </div>
      ),
    },
    {
      header: 'Horario',
      accessorKey: 'schedule_time',
      cell: ({ row }) => {
        const days = (row.original.schedule_days ?? []).map(d => DAY_SHORT[d] ?? d).join('/')
        return <span className="text-sm">{days} {row.original.schedule_time}</span>
      },
    },
    {
      header: 'Alumnos',
      accessorKey: 'enrolled_count',
      cell: ({ row }) => {
        const pct = Math.round((row.original.enrolled_count / row.original.max_students) * 100)
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{row.original.enrolled_count}/{row.original.max_students}</span>
            <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          </div>
        )
      },
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'outline'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="size-6" />
              Grupos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {inProgress.length} en curso · {scheduled.length} próximos · {totalEnrolled} alumnos activos
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`rounded-none h-9 px-3 ${viewMode === 'board' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                onClick={() => setViewMode('board')}
              >
                <LayoutGrid className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={`rounded-none h-9 px-3 border-l ${viewMode === 'list' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="size-4" />
              </Button>
            </div>
            <Button type="button" onClick={() => router.push('/backend/academy_groups/create')}>
              <Plus className="mr-2 size-4" />
              Nuevo grupo
            </Button>
          </div>
        </div>

        {/* ── BOARD VIEW ─────────────────────────────────────── */}
        {viewMode === 'board' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {KANBAN_COLUMNS.map(col => {
              const colGroups = groups.filter(g => g.status === col.id)
              return (
                <div key={col.id} className={`rounded-xl border-2 p-3 min-h-[200px] ${col.color}`}>
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {col.label}
                    </h3>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      {colGroups.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {isLoading && (
                      <div className="h-20 rounded-xl bg-muted/40 animate-pulse" />
                    )}
                    {!isLoading && colGroups.length === 0 && (
                      <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                        Sin grupos
                      </div>
                    )}
                    {colGroups.map(g => (
                      <GroupCard
                        key={g.id}
                        group={g}
                        courseName={courseNames[g.course_id] ?? '—'}
                        instructorName={instructorNames[g.instructor_id ?? ''] ?? ''}
                        onClick={() => router.push(`/backend/academy_groups/${g.id}`)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── LIST VIEW ──────────────────────────────────────── */}
        {viewMode === 'list' && (
          <DataTable
            columns={columns}
            data={groups}
            isLoading={isLoading}
            searchPlaceholder="Buscar grupo o curso..."
            onRowClick={(row) => router.push(`/backend/academy_groups/${row.id}`)}
          />
        )}
      </PageBody>
    </Page>
  )
}
