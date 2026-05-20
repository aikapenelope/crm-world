'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, FileText } from 'lucide-react'

type ReportCardRow = {
  id: string
  student_id: string
  average_score: string | null
  status: string
  generated_at: string | null
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  delivered: 'Entregado',
}

export default function ReportCardsPage() {
  const [cards, setCards] = React.useState<ReportCardRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: ReportCardRow[] }>(
        '/api/grades/report-cards?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) setCards(call.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<ReportCardRow>[] = [
    {
      accessorKey: 'student_id',
      header: 'Estudiante',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.student_id.slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'average_score',
      header: 'Promedio',
      cell: ({ row }) => row.original.average_score ? `${Number(row.original.average_score).toFixed(2)} pts` : '—',
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'published' ? 'default' : row.original.status === 'delivered' ? 'secondary' : 'outline'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'generated_at',
      header: 'Generado',
      cell: ({ row }) => row.original.generated_at ? new Date(row.original.generated_at).toLocaleDateString('es-VE') : '—',
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="mt-2 flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Boletines</h1>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={cards}
          isLoading={isLoading}
          searchPlaceholder="Buscar boletines..."
        />
      </PageBody>
    </Page>
  )
}
