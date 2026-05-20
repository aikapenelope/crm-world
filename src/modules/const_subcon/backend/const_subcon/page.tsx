'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, FileText, Star } from 'lucide-react'

type SubcontractorRow = {
  id: string; name: string; rif: string | null; specialty: string
  contact_name: string | null; phone: string | null; rating: number | null; is_active: boolean
}

const SPECIALTY_LABELS: Record<string, string> = {
  excavation: 'Excavación', concrete: 'Concreto', steel: 'Acero', masonry: 'Mampostería',
  electrical: 'Eléctrico', mechanical: 'Mecánico', plumbing: 'Sanitario',
  hvac: 'HVAC', finishing: 'Acabados', landscaping: 'Paisajismo', other: 'Otro',
}

export default function ConstSubconPage() {
  const router = useRouter()
  const [subcontractors, setSubcontractors] = React.useState<SubcontractorRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: SubcontractorRow[] }>('/api/const-subcon/subcontractors?pageSize=100', undefined, { fallback: { items: [] } })
      if (res.ok) setSubcontractors(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<SubcontractorRow>[] = [
    {
      accessorKey: 'name',
      header: 'Subcontratista',
      cell: ({ row }) => (
        <div>
          <span className="font-medium">{row.original.name}</span>
          {row.original.rif && <span className="ml-2 text-xs text-muted-foreground">{row.original.rif}</span>}
        </div>
      ),
    },
    {
      accessorKey: 'specialty',
      header: 'Especialidad',
      cell: ({ row }) => <Badge variant="outline">{SPECIALTY_LABELS[row.original.specialty] ?? row.original.specialty}</Badge>,
    },
    {
      accessorKey: 'contact_name',
      header: 'Contacto',
      cell: ({ row }) => (
        <div>
          <span className="text-sm">{row.original.contact_name ?? '—'}</span>
          {row.original.phone && <p className="text-xs text-muted-foreground">{row.original.phone}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => {
        if (!row.original.rating) return <span className="text-muted-foreground">—</span>
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`size-3 ${i < row.original.rating! ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
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
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Subcontratistas</h1>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/const_subcon/contracts')}>
              <FileText className="mr-2 size-4" />
              Contratos
            </Button>
            <Button type="button" onClick={() => {}}>
              <Plus className="mr-2 size-4" />
              Nuevo
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{subcontractors.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Activos</p>
            <p className="text-xl font-bold">{subcontractors.filter((s) => s.is_active).length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Con Rating</p>
            <p className="text-xl font-bold">{subcontractors.filter((s) => s.rating).length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Rating Promedio</p>
            <p className="text-xl font-bold">
              {subcontractors.filter((s) => s.rating).length > 0
                ? (subcontractors.filter((s) => s.rating).reduce((sum, s) => sum + s.rating!, 0) / subcontractors.filter((s) => s.rating).length).toFixed(1)
                : '—'}
            </p>
          </div>
        </div>

        <DataTable columns={columns} data={subcontractors} isLoading={isLoading} searchPlaceholder="Buscar subcontratista..." />
      </PageBody>
    </Page>
  )
}
