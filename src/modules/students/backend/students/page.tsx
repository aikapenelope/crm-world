'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

type StudentRow = {
  id: string
  first_name: string
  last_name: string
  cedula: string | null
  grade_level: string
  section: string
  enrollment_status: string
  created_at: string
}

const GRADE_LABELS: Record<string, string> = {
  maternal: 'Maternal',
  preescolar_1: 'Preescolar I',
  preescolar_2: 'Preescolar II',
  preescolar_3: 'Preescolar III',
  primaria_1: '1er Grado',
  primaria_2: '2do Grado',
  primaria_3: '3er Grado',
  primaria_4: '4to Grado',
  primaria_5: '5to Grado',
  primaria_6: '6to Grado',
  bachillerato_1: '1er Año',
  bachillerato_2: '2do Año',
  bachillerato_3: '3er Año',
  bachillerato_4: '4to Año',
  bachillerato_5: '5to Año',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  graduated: 'secondary',
  withdrawn: 'destructive',
  suspended: 'destructive',
  transferred: 'outline',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  graduated: 'Graduado',
  withdrawn: 'Retirado',
  suspended: 'Suspendido',
  transferred: 'Transferido',
}

export default function StudentsListPage() {
  const router = useRouter()
  const [students, setStudents] = React.useState<StudentRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: StudentRow[] }>(
        '/api/students/students?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setStudents(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<StudentRow>[] = [
    {
      accessorKey: 'last_name',
      header: 'Apellido',
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline"
          onClick={() => router.push(`/backend/students/${row.original.id}`)}
        >
          {row.original.last_name}
        </button>
      ),
    },
    {
      accessorKey: 'first_name',
      header: 'Nombre',
    },
    {
      accessorKey: 'cedula',
      header: 'Cédula',
      cell: ({ row }) => row.original.cedula ?? '—',
    },
    {
      accessorKey: 'grade_level',
      header: 'Grado',
      cell: ({ row }) => (
        <Badge variant="outline">
          {GRADE_LABELS[row.original.grade_level] ?? row.original.grade_level}
        </Badge>
      ),
    },
    {
      accessorKey: 'section',
      header: 'Sección',
      cell: ({ row }) => row.original.section,
    },
    {
      accessorKey: 'enrollment_status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.enrollment_status] ?? 'outline'}>
          {STATUS_LABELS[row.original.enrollment_status] ?? row.original.enrollment_status}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Estudiantes</h1>
          <Button onClick={() => router.push('/backend/students/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={students}
          isLoading={isLoading}
          searchPlaceholder="Buscar estudiantes..."
        />
      </PageBody>
    </Page>
  )
}
