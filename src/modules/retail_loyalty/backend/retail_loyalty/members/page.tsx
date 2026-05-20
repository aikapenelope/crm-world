'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import type { ColumnDef } from '@tanstack/react-table'
import { Star } from 'lucide-react'

type MemberRow = {
  id: string
  customer_id: string
  current_points: number
  lifetime_points: number
  tier_id: string | null
  last_activity_at: string | null
}

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = React.useState<MemberRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: MemberRow[] }>(
        '/api/retail-loyalty/accounts?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setMembers(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<MemberRow>[] = [
    {
      accessorKey: 'customer_id',
      header: 'Cliente',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.customer_id.slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'current_points',
      header: 'Puntos Actuales',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Star className="size-3 text-primary" />
          <span className="font-bold">{row.original.current_points.toLocaleString('es-VE')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'lifetime_points',
      header: 'Puntos Lifetime',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.lifetime_points.toLocaleString('es-VE')}</span>
      ),
    },
    {
      accessorKey: 'tier_id',
      header: 'Nivel',
      cell: ({ row }) => (
        row.original.tier_id
          ? <Badge variant="default">VIP</Badge>
          : <Badge variant="outline">Estándar</Badge>
      ),
    },
    {
      accessorKey: 'last_activity_at',
      header: 'Última Actividad',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.last_activity_at
            ? new Date(row.original.last_activity_at).toLocaleDateString('es-VE')
            : '—'}
        </span>
      ),
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Miembros del Programa</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} miembro{members.length !== 1 ? 's' : ''} registrado{members.length !== 1 ? 's' : ''}
          </p>
        </div>

        <DataTable
          columns={columns}
          data={members}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/backend/retail_loyalty/members/${row.customer_id}`)}
        />
      </PageBody>
    </Page>
  )
}
