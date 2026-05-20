'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Calendar } from 'lucide-react'

type EventRow = {
  id: string
  title: string
  event_type: string
  start_date: string
  end_date: string
  is_all_day: boolean
}

const TYPE_LABELS: Record<string, string> = {
  class_day: 'Día de clases',
  holiday: 'Feriado',
  exam_period: 'Exámenes',
  meeting: 'Reunión',
  event: 'Evento',
  administrative: 'Administrativo',
  graduation: 'Graduación',
}

const TYPE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  holiday: 'destructive',
  exam_period: 'secondary',
  meeting: 'outline',
  event: 'default',
  graduation: 'default',
  administrative: 'outline',
  class_day: 'outline',
}

export default function SchoolCalendarPage() {
  const [events, setEvents] = React.useState<EventRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: EventRow[] }>(
        '/api/school-calendar/events?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) setEvents(call.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<EventRow>[] = [
    {
      accessorKey: 'title',
      header: 'Evento',
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: 'event_type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant={TYPE_VARIANTS[row.original.event_type] ?? 'outline'}>
          {TYPE_LABELS[row.original.event_type] ?? row.original.event_type}
        </Badge>
      ),
    },
    {
      accessorKey: 'start_date',
      header: 'Inicio',
      cell: ({ row }) => new Date(row.original.start_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'end_date',
      header: 'Fin',
      cell: ({ row }) => new Date(row.original.end_date).toLocaleDateString('es-VE'),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Calendario Escolar</h1>
          </div>
          <Button type="button"><Plus className="mr-2 h-4 w-4" />Agregar Evento</Button>
        </div>
        <DataTable columns={columns} data={events} isLoading={isLoading} searchPlaceholder="Buscar eventos..." />
      </PageBody>
    </Page>
  )
}
