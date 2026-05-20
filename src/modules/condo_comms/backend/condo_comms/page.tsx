'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Vote, BookOpen } from 'lucide-react'

type CircularRow = {
  id: string
  circular_number: string
  title: string
  category: string
  priority: string
  status: string
  total_recipients: number
  total_read: number
  published_at: string | null
}

export default function CondoCommsPage() {
  const router = useRouter()
  const [circulars, setCirculars] = React.useState<CircularRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: CircularRow[] }>(
        '/api/condo-comms/circulars?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (res.ok) setCirculars(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const categoryLabels: Record<string, string> = {
    general: 'General', maintenance: 'Mantenimiento', security: 'Seguridad',
    assembly: 'Asamblea', payment: 'Pagos', rules: 'Normas', emergency: 'Emergencia',
  }

  const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'secondary', published: 'default', expired: 'outline',
  }

  const columns: ColumnDef<CircularRow>[] = [
    {
      accessorKey: 'circular_number',
      header: '#',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.circular_number}</span>,
    },
    { accessorKey: 'title', header: 'Título' },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }) => categoryLabels[row.original.category] ?? row.original.category,
    },
    {
      accessorKey: 'priority',
      header: 'Prioridad',
      cell: ({ row }) => (
        <Badge variant={row.original.priority === 'urgent' ? 'destructive' : row.original.priority === 'important' ? 'default' : 'secondary'}>
          {row.original.priority}
        </Badge>
      ),
    },
    {
      id: 'read_rate',
      header: 'Lectura',
      cell: ({ row }) => {
        const total = row.original.total_recipients
        const read = row.original.total_read
        const rate = total > 0 ? Math.round((read / total) * 100) : 0
        return <span className="text-sm">{read}/{total} ({rate}%)</span>
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status] ?? 'secondary'}>
          {row.original.status === 'draft' ? 'Borrador' : row.original.status === 'published' ? 'Publicada' : 'Expirada'}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Comunicaciones</h1>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/condo_comms/votes')}>
              <Vote className="mr-2 size-4" />
              Votaciones
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/condo_comms/assemblies')}>
              <BookOpen className="mr-2 size-4" />
              Asambleas
            </Button>
            <Button type="button" onClick={() => router.push('/backend/condo_comms/circulars/create')}>
              <Plus className="mr-2 size-4" />
              Nueva Circular
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={circulars}
          isLoading={isLoading}
          searchPlaceholder="Buscar circular..."
        />
      </PageBody>
    </Page>
  )
}
