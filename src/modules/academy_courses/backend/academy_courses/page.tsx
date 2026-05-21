'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, BookOpen, Users, TrendingUp } from 'lucide-react'

type CourseRow = {
  id: string
  name: string
  category: string
  level: string
  duration_hours: string
  price_usd: string
  modality: string
  max_students: number
  is_active: boolean
}

type DashboardData = {
  courses: { total: number; active: number }
  groups: { in_progress: number; scheduled: number }
  enrollments: { active: number; completed: number }
}

const MODALITY_LABELS: Record<string, string> = {
  in_person: 'Presencial', online: 'Online', hybrid: 'Híbrida',
}

export default function AcademyCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = React.useState<CourseRow[]>([])
  const [dashboard, setDashboard] = React.useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [filterActive, setFilterActive] = React.useState<string>('all')

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const [coursesRes, dashRes] = await Promise.all([
        apiCall<{ items: CourseRow[] }>(
          '/api/academy-courses/courses?pageSize=200',
          undefined,
          { fallback: { items: [] } },
        ),
        apiCall<DashboardData>(
          '/api/academy-courses/dashboard',
          undefined,
          { fallback: null },
        ),
      ])
      setCourses(coursesRes.result?.items ?? [])
      setDashboard(dashRes.result)
      setIsLoading(false)
    }
    load()
  }, [])

  const filteredCourses = filterActive === 'all' ? courses
    : filterActive === 'active' ? courses.filter(c => c.is_active)
    : courses.filter(c => !c.is_active)

  const columns: ColumnDef<CourseRow>[] = [
    {
      header: 'Curso',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.category} · {row.original.level}</div>
        </div>
      ),
    },
    {
      header: 'Modalidad',
      accessorKey: 'modality',
      cell: ({ row }) => <Badge variant="outline">{MODALITY_LABELS[row.original.modality] ?? row.original.modality}</Badge>,
    },
    {
      header: 'Horas',
      accessorKey: 'duration_hours',
      cell: ({ row }) => `${Number(row.original.duration_hours).toFixed(0)} h`,
    },
    {
      header: 'Precio',
      accessorKey: 'price_usd',
      cell: ({ row }) => `USD ${Number(row.original.price_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
    },
    {
      header: 'Cap.',
      accessorKey: 'max_students',
      cell: ({ row }) => `${row.original.max_students} alumnos`,
    },
    {
      header: 'Estado',
      accessorKey: 'is_active',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="size-6" />
              Cursos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Catálogo de cursos de la academia
            </p>
          </div>
          <Button type="button" onClick={() => router.push('/backend/academy_courses/create')}>
            <Plus className="mr-2 size-4" />
            Nuevo curso
          </Button>
        </div>

        {/* Dashboard KPIs */}
        {dashboard && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-lg border p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Cursos activos</div>
              <div className="font-bold text-lg">{dashboard.courses.active}</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Grupos en curso</div>
              <div className="font-bold text-lg text-primary">{dashboard.groups.in_progress}</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Grupos próximos</div>
              <div className="font-bold text-lg">{dashboard.groups.scheduled}</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Inscripciones activas</div>
              <div className="font-bold text-lg">{dashboard.enrollments.active}</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['all', 'active', 'inactive'].map(f => (
            <Button
              key={f}
              type="button"
              variant={filterActive === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActive(f)}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </Button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filteredCourses}
          isLoading={isLoading}
          searchPlaceholder="Buscar curso..."
          onRowClick={(row) => router.push(`/backend/academy_courses/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
