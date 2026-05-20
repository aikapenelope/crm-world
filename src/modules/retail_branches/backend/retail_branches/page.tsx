'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, MapPin } from 'lucide-react'

type BranchRow = {
  id: string
  name: string
  code: string
  branch_type: string
  city: string | null
  state: string | null
  phone: string | null
  is_active: boolean
  manager_user_id: string | null
}

const typeLabels: Record<string, string> = {
  store: 'Tienda',
  warehouse: 'Bodega',
  kiosk: 'Kiosco',
  popup: 'Pop-up',
}

export default function RetailBranchesPage() {
  const router = useRouter()
  const [branches, setBranches] = React.useState<BranchRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: BranchRow[] }>(
        '/api/retail-branches/branches?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setBranches(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<BranchRow>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MapPin className="size-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span>,
    },
    {
      accessorKey: 'branch_type',
      header: 'Tipo',
      cell: ({ row }) => (
        <Badge variant="outline">{typeLabels[row.original.branch_type] ?? row.original.branch_type}</Badge>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Ciudad',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {[row.original.city, row.original.state].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone ?? '—'}</span>,
    },
    {
      accessorKey: 'is_active',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Sucursales</h1>
              <p className="text-sm text-muted-foreground">
                {branches.length} sucursal{branches.length !== 1 ? 'es' : ''} registrada{branches.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button type="button" onClick={() => router.push('/backend/retail_branches/create')}>
            <Plus className="mr-2 size-4" />
            Nueva Sucursal
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={branches}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/backend/retail_branches/${row.id}`)}
        />
      </PageBody>
    </Page>
  )
}
