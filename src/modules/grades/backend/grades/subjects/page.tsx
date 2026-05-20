'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, Plus } from 'lucide-react'

type SubjectRow = { id: string; name: string; code: string; is_qualitative: boolean; is_active: boolean; sort_order: number }

export default function SubjectsPage() {
  const [subjects, setSubjects] = React.useState<SubjectRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: SubjectRow[] }>(
        '/api/grades/subjects?pageSize=50',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) setSubjects(call.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<SubjectRow>[] = [
    { accessorKey: 'code', header: 'Código' },
    { accessorKey: 'name', header: 'Materia', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    {
      accessorKey: 'is_qualitative',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={row.original.is_qualitative ? 'secondary' : 'outline'}>
          {row.original.is_qualitative ? 'Cualitativa (A-E)' : 'Numérica (0-20)'}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'destructive'}>
          {row.original.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    { accessorKey: 'sort_order', header: 'Orden' },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold">Materias</h1>
          </div>
          <Button type="button"><Plus className="mr-2 h-4 w-4" />Agregar Materia</Button>
        </div>
        <DataTable columns={columns} data={subjects} isLoading={isLoading} searchPlaceholder="Buscar materias..." />
      </PageBody>
    </Page>
  )
}
