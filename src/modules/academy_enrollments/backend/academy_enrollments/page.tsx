'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, UserCheck } from 'lucide-react'

type EnrollmentRow = {
  id: string
  enrollment_number: string
  student_name: string
  student_phone: string | null
  group_id: string
  enrollment_date: string
  status: string
  price_agreed: string
  currency: string
  final_grade: string | null
  completion_date: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pend. pago', active: 'Activo',
  completed: 'Completado', withdrawn: 'Retirado', failed: 'Reprobado',
}
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending_payment: 'outline', active: 'default',
  completed: 'secondary', withdrawn: 'secondary', failed: 'destructive',
}

export default function AcademyEnrollmentsPage() {
  const router = useRouter()
  const [enrollments, setEnrollments] = React.useState<EnrollmentRow[]>([])
  const [groupNames, setGroupNames] = React.useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [filterStatus, setFilterStatus] = React.useState('all')

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const [eRes, gRes] = await Promise.all([
        apiCall<{ items: EnrollmentRow[] }>('/api/academy-enrollments/enrollments?pageSize=200', undefined, { fallback: { items: [] } }),
        apiCall<{ items: { id: string; group_code: string }[] }>('/api/academy-groups/groups?pageSize=200', undefined, { fallback: { items: [] } }),
      ])
      setEnrollments(eRes.result?.items ?? [])
      const map: Record<string, string> = {}
      for (const g of (gRes.result?.items ?? [])) map[g.id] = g.group_code
      setGroupNames(map)
      setIsLoading(false)
    }
    load()
  }, [])

  const filtered = filterStatus === 'all' ? enrollments : enrollments.filter(e => e.status === filterStatus)

  const columns: ColumnDef<EnrollmentRow>[] = [
    {
      header: 'Alumno',
      accessorKey: 'student_name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.student_name}</div>
          <div className="text-xs text-muted-foreground">{row.original.enrollment_number}</div>
        </div>
      ),
    },
    {
      header: 'Grupo',
      accessorKey: 'group_id',
      cell: ({ row }) => <span className="text-sm">{groupNames[row.original.group_id] ?? '—'}</span>,
    },
    {
      header: 'Inscripción',
      accessorKey: 'enrollment_date',
      cell: ({ row }) => new Date(row.original.enrollment_date).toLocaleDateString('es-VE'),
    },
    {
      header: 'Precio',
      accessorKey: 'price_agreed',
      cell: ({ row }) => `${row.original.currency} ${Number(row.original.price_agreed).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`,
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
    {
      header: 'Nota final',
      accessorKey: 'final_grade',
      cell: ({ row }) => row.original.final_grade ?? <span className="text-muted-foreground">—</span>,
    },
  ]

  const active = enrollments.filter(e => e.status === 'active').length
  const pendingPayment = enrollments.filter(e => e.status === 'pending_payment').length

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCheck className="size-6" />Inscripciones
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {active} activas · {pendingPayment} pendientes de pago
            </p>
          </div>
          <Button type="button" onClick={() => router.push('/backend/academy_enrollments/create')}>
            <Plus className="mr-2 size-4" />Inscribir alumno
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          {['all', 'active', 'pending_payment', 'completed', 'withdrawn'].map(f => (
            <Button key={f} type="button" variant={filterStatus === f ? 'default' : 'outline'} size="sm"
              onClick={() => setFilterStatus(f)}>
              {f === 'all' ? 'Todos' : STATUS_LABELS[f] ?? f}
            </Button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          searchPlaceholder="Buscar alumno..."
          onRowClick={(row) => router.push(`/backend/academy_enrollments/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
