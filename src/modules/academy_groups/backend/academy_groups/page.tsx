'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Calendar } from 'lucide-react'

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

export default function AcademyGroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = React.useState<GroupRow[]>([])
  const [courseNames, setCourseNames] = React.useState<CourseMap>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [filterStatus, setFilterStatus] = React.useState('all')

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const [groupsRes, coursesRes] = await Promise.all([
        apiCall<{ items: GroupRow[] }>('/api/academy-groups/groups?pageSize=200', undefined, { fallback: { items: [] } }),
        apiCall<{ items: { id: string; name: string }[] }>('/api/academy-courses/courses?pageSize=200&is_active=true', undefined, { fallback: { items: [] } }),
      ])
      setGroups(groupsRes.result?.items ?? [])
      const map: CourseMap = {}
      for (const c of (coursesRes.result?.items ?? [])) map[c.id] = c.name
      setCourseNames(map)
      setIsLoading(false)
    }
    load()
  }, [])

  const filtered = filterStatus === 'all' ? groups : groups.filter(g => g.status === filterStatus)

  const columns: ColumnDef<GroupRow>[] = [
    {
      header: 'Grupo',
      accessorKey: 'group_code',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.group_code}</div>
          <div className="text-xs text-muted-foreground">{courseNames[row.original.course_id] ?? row.original.course_id}</div>
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
      header: 'Fechas',
      accessorKey: 'start_date',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.start_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
          {' – '}
          {new Date(row.original.end_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      ),
    },
    {
      header: 'Alumnos',
      accessorKey: 'enrolled_count',
      cell: ({ row }) => `${row.original.enrolled_count}/${row.original.max_students}`,
    },
    {
      header: 'Sesiones',
      accessorKey: 'sessions_count',
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="size-6" />Grupos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {groups.filter(g => g.status === 'in_progress').length} en curso · {groups.filter(g => g.status === 'scheduled').length} próximos
            </p>
          </div>
          <Button type="button" onClick={() => router.push('/backend/academy_groups/create')}>
            <Plus className="mr-2 size-4" />Nuevo grupo
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          {['all', 'scheduled', 'in_progress', 'completed'].map(f => (
            <Button key={f} type="button" variant={filterStatus === f ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus(f)}>
              {f === 'all' ? 'Todos' : STATUS_LABELS[f] ?? f}
            </Button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          searchPlaceholder="Buscar grupo o curso..."
          onRowClick={(row) => router.push(`/backend/academy_groups/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
