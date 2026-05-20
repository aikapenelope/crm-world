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

type ApplicationRow = {
  id: string
  application_type: string
  requested_grade: string
  requested_section: string | null
  status: string
  applicant_contact_id: string
  student_id: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  new: 'Nuevo ingreso',
  renewal: 'Renovación',
  transfer: 'Traslado',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  documents_pending: 'Docs. pendientes',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  documents_pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  cancelled: 'destructive',
}

export default function EnrollmentListPage() {
  const router = useRouter()
  const [applications, setApplications] = React.useState<ApplicationRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: ApplicationRow[] }>(
        '/api/enrollment/applications?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setApplications(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<ApplicationRow>[] = [
    {
      accessorKey: 'application_type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline">
          {TYPE_LABELS[row.original.application_type] ?? row.original.application_type}
        </Badge>
      ),
    },
    {
      accessorKey: 'requested_grade',
      header: 'Grado',
    },
    {
      accessorKey: 'requested_section',
      header: 'Sección',
      cell: ({ row }) => row.original.requested_section ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'outline'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'applicant_contact_id',
      header: 'Representante',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.applicant_contact_id.slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inscripciones</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/backend/enrollment/periods')}>
              Períodos
            </Button>
            <Button onClick={() => router.push('/backend/enrollment/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Solicitud
            </Button>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={applications}
          isLoading={isLoading}
          searchPlaceholder="Buscar solicitudes..."
        />
      </PageBody>
    </Page>
  )
}
