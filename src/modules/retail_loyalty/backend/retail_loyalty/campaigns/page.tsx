'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus } from 'lucide-react'

type CampaignRow = {
  id: string
  name: string
  type: string
  status: string
  target_segment: string
  starts_at: string
  ends_at: string | null
  total_recipients: number
  total_redeemed: number
}

const typeLabels: Record<string, string> = {
  points_multiplier: 'Multiplicador',
  bonus_points: 'Puntos Bonus',
  discount: 'Descuento',
  whatsapp_blast: 'WhatsApp',
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  scheduled: 'Programada',
  active: 'Activa',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'outline',
  scheduled: 'secondary',
  active: 'default',
  completed: 'default',
  cancelled: 'destructive',
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = React.useState<CampaignRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: CampaignRow[] }>(
        '/api/retail-loyalty/campaigns?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setCampaigns(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<CampaignRow>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => <Badge variant="outline">{typeLabels[row.original.type] ?? row.original.type}</Badge>,
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status] ?? 'outline'}>
          {statusLabels[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'starts_at',
      header: 'Inicio',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.starts_at).toLocaleDateString('es-VE')}
        </span>
      ),
    },
    {
      accessorKey: 'total_recipients',
      header: 'Alcance',
      cell: ({ row }) => <span>{row.original.total_recipients}</span>,
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campañas</h1>
            <p className="text-sm text-muted-foreground">Campañas de marketing y fidelización</p>
          </div>
          <Button type="button" onClick={() => router.push('/backend/retail_loyalty/campaigns/create')}>
            <Plus className="mr-2 size-4" />
            Nueva Campaña
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={campaigns}
          isLoading={isLoading}
        />
      </PageBody>
    </Page>
  )
}
