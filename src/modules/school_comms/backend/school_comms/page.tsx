'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Mail, AlertTriangle } from 'lucide-react'

type AnnouncementRow = {
  id: string
  title: string
  announcement_type: string
  target_audience: string
  published_at: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  circular: 'Circular',
  notice: 'Aviso',
  reminder: 'Recordatorio',
  emergency: 'Emergencia',
}

const TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  circular: 'default',
  notice: 'secondary',
  reminder: 'outline',
  emergency: 'destructive',
}

const AUDIENCE_LABELS: Record<string, string> = {
  all: 'Todos',
  grade_specific: 'Por grado',
  section_specific: 'Por sección',
}

export default function SchoolCommsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = React.useState<AnnouncementRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: AnnouncementRow[] }>(
        '/api/school-comms/announcements?pageSize=50',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) setAnnouncements(call.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<AnnouncementRow>[] = [
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: 'announcement_type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={TYPE_VARIANTS[row.original.announcement_type] ?? 'outline'}>
          {row.original.announcement_type === 'emergency' && <AlertTriangle className="mr-1 h-3 w-3" />}
          {TYPE_LABELS[row.original.announcement_type] ?? row.original.announcement_type}
        </Badge>
      ),
    },
    {
      accessorKey: 'target_audience',
      header: 'Audiencia',
      cell: ({ row }) => AUDIENCE_LABELS[row.original.target_audience] ?? row.original.target_audience,
    },
    {
      accessorKey: 'published_at',
      header: 'Estado',
      cell: ({ row }) => row.original.published_at
        ? <Badge variant="default">Publicada</Badge>
        : <Badge variant="outline">Borrador</Badge>,
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
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Comunicaciones</h1>
          </div>
          <Button type="button" onClick={() => router.push('/backend/school-comms/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Comunicación
          </Button>
        </div>
        <DataTable columns={columns} data={announcements} isLoading={isLoading} searchPlaceholder="Buscar comunicaciones..." />
      </PageBody>
    </Page>
  )
}
