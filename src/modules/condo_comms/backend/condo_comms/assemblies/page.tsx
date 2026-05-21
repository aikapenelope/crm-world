'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, Plus, CalendarPlus, Download } from 'lucide-react'
import { calendarLinks, downloadIcs } from '@app/lib/calendar-links'

type AssemblyRow = {
  id: string
  assembly_number: string
  assembly_type: string
  title: string
  date: string
  start_time: string | null
  end_time: string | null
  location: string | null
  status: string
  attendees_count: number
  quorum_present: string | null
}

type BuildingOption = { id: string; name: string }

const TYPE_LABELS: Record<string, string> = {
  ordinary: 'Ordinaria',
  extraordinary: 'Extraordinaria',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programada', in_progress: 'En Curso',
  completed: 'Completada', cancelled: 'Cancelada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'outline', in_progress: 'default',
  completed: 'secondary', cancelled: 'destructive',
}

function assemblyDates(row: AssemblyRow): { start: Date; end: Date } {
  const [year, month, day] = row.date.split('-').map(Number)
  const parseTime = (t: string | null, fallbackHour: number) => {
    if (!t) return { h: fallbackHour, m: 0 }
    const [h, m] = t.split(':').map(Number)
    return { h: h ?? fallbackHour, m: m ?? 0 }
  }
  const s = parseTime(row.start_time, 19)
  const e = parseTime(row.end_time, 21)
  return {
    start: new Date(year, month - 1, day, s.h, s.m),
    end: new Date(year, month - 1, day, e.h, e.m),
  }
}

const MILESTONE_LABELS: Record<string, string> = {
  start: 'Inicio', delivery: 'Entrega', payment: 'Pago',
  inspection: 'Inspección', permit: 'Permiso', other: 'Otro',
}

export default function CondoAssembliesPage() {
  const router = useRouter()
  const [assemblies, setAssemblies] = React.useState<AssemblyRow[]>([])
  const [buildings, setBuildings] = React.useState<BuildingOption[]>([])
  const [selectedBuilding, setSelectedBuilding] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadBuildings() {
      const res = await apiCall<{ items: BuildingOption[] }>(
        '/api/condo-properties/buildings?pageSize=100', undefined, { fallback: { items: [] } },
      )
      if (res.ok) setBuildings(res.result?.items ?? [])
    }
    loadBuildings()
  }, [])

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const qs = selectedBuilding ? `?building_id=${selectedBuilding}` : ''
      const res = await apiCall<{ items: AssemblyRow[] }>(
        `/api/condo-comms/assemblies${qs}&pageSize=100`, undefined, { fallback: { items: [] } },
      )
      if (res.ok) setAssemblies(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [selectedBuilding])

  const columns: ColumnDef<AssemblyRow>[] = [
    {
      accessorKey: 'assembly_number',
      header: '#',
      cell: ({ row }) => <span className="font-mono text-xs font-bold">{row.original.assembly_number}</span>,
    },
    {
      accessorKey: 'title',
      header: 'Asamblea',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.title}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {TYPE_LABELS[row.original.assembly_type] ?? row.original.assembly_type}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'date',
      header: 'Fecha y Hora',
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-sm">{row.original.date}</span>
          {row.original.start_time && (
            <span className="ml-2 text-xs text-muted-foreground">
              {row.original.start_time}{row.original.end_time ? ` – ${row.original.end_time}` : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: 'Lugar',
      cell: ({ row }) => <span className="text-sm">{row.original.location ?? '—'}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANTS[row.original.status] ?? 'secondary'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      id: 'calendar',
      header: 'Agregar al calendario',
      cell: ({ row }) => {
        if (row.original.status === 'cancelled' || row.original.status === 'completed') return null

        const { start, end } = assemblyDates(row.original)
        const links = calendarLinks({
          title: `Asamblea: ${row.original.title}`,
          start,
          end,
          description: [
            `${TYPE_LABELS[row.original.assembly_type] ?? ''} — ${row.original.assembly_number}`,
            row.original.location ? `📍 ${row.original.location}` : '',
          ].filter(Boolean).join('\n'),
          location: row.original.location ?? undefined,
        })

        return (
          <div className="flex items-center gap-1">
            <a href={links.google} target="_blank" rel="noopener noreferrer" title="Google Calendar">
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <CalendarPlus className="mr-1 size-3" />
                Google
              </Button>
            </a>
            <a href={links.outlook} target="_blank" rel="noopener noreferrer" title="Outlook">
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs">
                Outlook
              </Button>
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Descargar .ics (Apple Calendar / Thunderbird)"
              onClick={() => downloadIcs(links.ics, `asamblea-${row.original.assembly_number.toLowerCase()}.ics`)}
            >
              <Download className="size-3 text-muted-foreground" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/condo_comms')}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-bold">Asambleas</h1>
          </div>
          <Button type="button" onClick={() => router.push('/backend/condo_comms/assemblies/create')}>
            <Plus className="mr-2 size-4" />
            Nueva Asamblea
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Edificio:</label>
          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="">Todos</option>
            {buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{assemblies.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Programadas</p>
            <p className="text-xl font-bold">{assemblies.filter((a) => a.status === 'scheduled').length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Completadas</p>
            <p className="text-xl font-bold">{assemblies.filter((a) => a.status === 'completed').length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Ordinarias / Extraordinarias</p>
            <p className="text-xl font-bold">
              {assemblies.filter((a) => a.assembly_type === 'ordinary').length}
              {' / '}
              {assemblies.filter((a) => a.assembly_type === 'extraordinary').length}
            </p>
          </div>
        </div>

        <DataTable columns={columns} data={assemblies} isLoading={isLoading} searchPlaceholder="Buscar asamblea..." />
      </PageBody>
    </Page>
  )
}
