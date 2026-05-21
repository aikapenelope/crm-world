'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Users } from 'lucide-react'

type InstructorRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  specialty: string | null
  hourly_rate_usd: string | null
  modalities: string[] | null
  is_active: boolean
}

const MODALITY_LABELS: Record<string, string> = {
  in_person: 'Presencial', online: 'Online', hybrid: 'Híbrida',
}

export default function AcademyInstructorsPage() {
  const router = useRouter()
  const [instructors, setInstructors] = React.useState<InstructorRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: InstructorRow[] }>(
        '/api/academy-instructors/instructors?pageSize=200',
        undefined,
        { fallback: { items: [] } },
      )
      setInstructors(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<InstructorRow>[] = [
    {
      header: 'Instructor',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.specialty && (
            <div className="text-xs text-muted-foreground">{row.original.specialty}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Contacto',
      accessorKey: 'email',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.email && <div>{row.original.email}</div>}
          {row.original.phone && <div className="text-muted-foreground">{row.original.phone}</div>}
        </div>
      ),
    },
    {
      header: 'Modalidades',
      accessorKey: 'modalities',
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {(row.original.modalities ?? []).map(m => (
            <Badge key={m} variant="secondary" className="text-xs">
              {MODALITY_LABELS[m] ?? m}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Tarifa/h',
      accessorKey: 'hourly_rate_usd',
      cell: ({ row }) => row.original.hourly_rate_usd
        ? `USD ${Number(row.original.hourly_rate_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
        : <span className="text-muted-foreground">—</span>,
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="size-6" />
              Instructores
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {instructors.filter(i => i.is_active).length} instructores activos
            </p>
          </div>
          <Button type="button" onClick={() => router.push('/backend/academy_instructors/create')}>
            <Plus className="mr-2 size-4" />
            Nuevo instructor
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={instructors}
          isLoading={isLoading}
          searchPlaceholder="Buscar instructor..."
        />
      </PageBody>
    </Page>
  )
}
