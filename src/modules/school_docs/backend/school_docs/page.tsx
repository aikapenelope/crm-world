'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, FileText } from 'lucide-react'

type DocRow = {
  id: string
  template_id: string
  student_id: string
  status: string
  generated_at: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  generated: 'Generada',
  delivered: 'Entregada',
}

export default function SchoolDocsPage() {
  const [docs, setDocs] = React.useState<DocRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: DocRow[] }>(
        '/api/school-docs/generated-documents?pageSize=50',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) setDocs(call.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<DocRow>[] = [
    {
      accessorKey: 'student_id',
      header: 'Estudiante',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.student_id.slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'generated' ? 'default' : row.original.status === 'delivered' ? 'secondary' : 'outline'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'generated_at',
      header: 'Generada',
      cell: ({ row }) => row.original.generated_at ? new Date(row.original.generated_at).toLocaleDateString('es-VE') : '—',
    },
    {
      accessorKey: 'created_at',
      header: 'Solicitada',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Constancias</h1>
          </div>
          <Button type="button"><Plus className="mr-2 h-4 w-4" />Generar Constancia</Button>
        </div>
        <DataTable columns={columns} data={docs} isLoading={isLoading} searchPlaceholder="Buscar constancias..." />
      </PageBody>
    </Page>
  )
}
