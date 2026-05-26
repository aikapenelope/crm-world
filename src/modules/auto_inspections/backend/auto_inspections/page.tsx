'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Camera } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type InspectionRow = {
  id: string
  service_order_id: string
  vehicle_id: string
  type: string
  status: string
  overall_condition: string | null
  sent_to_customer_at: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  intake: 'Recepción',
  diagnosis: 'Diagnóstico',
  progress: 'Progreso',
  completion: 'Finalización',
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'En Progreso',
  completed: 'Completada',
  sent_to_customer: 'Enviada al Cliente',
}

const CONDITION_LABELS: Record<string, string> = {
  good: 'Bueno',
  fair: 'Regular',
  needs_attention: 'Requiere Atención',
  critical: 'Crítico',
}

const CONDITION_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  good: 'default',
  fair: 'secondary',
  needs_attention: 'outline',
  critical: 'destructive',
}

export default function AutoInspectionsPage() {
  const t = useT()
  const router = useRouter()
  const [inspections, setInspections] = React.useState<InspectionRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: InspectionRow[] }>(
        '/api/auto-inspections/inspections?pageSize=100',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) { setInspections(call.result?.items ?? []) }
      setIsLoading(false)
    }
    load()
  }, [])

  const columns: ColumnDef<InspectionRow>[] = [
    {
      accessorKey: 'created_at',
      header: t('auto_inspections.list.col.date', 'Fecha'),
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'type',
      header: t('auto_inspections.list.col.type', 'Tipo'),
      cell: ({ row }) => TYPE_LABELS[row.original.type] ?? row.original.type,
    },
    {
      accessorKey: 'overall_condition',
      header: t('auto_inspections.list.col.condition', 'Condición'),
      cell: ({ row }) => row.original.overall_condition ? (
        <Badge variant={CONDITION_VARIANTS[row.original.overall_condition] ?? 'outline'}>
          {CONDITION_LABELS[row.original.overall_condition] ?? row.original.overall_condition}
        </Badge>
      ) : '—',
    },
    {
      accessorKey: 'status',
      header: t('auto_inspections.list.col.status', 'Estado'),
      cell: ({ row }) => (
        <Badge variant={row.original.status === 'sent_to_customer' ? 'default' : 'secondary'}>
          {STATUS_LABELS[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'sent_to_customer_at',
      header: t('auto_inspections.list.col.sent', 'Enviada'),
      cell: ({ row }) => row.original.sent_to_customer_at
        ? new Date(row.original.sent_to_customer_at).toLocaleDateString('es-VE')
        : '—',
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="size-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold">{t('auto_inspections.list.title', 'Inspecciones Digitales')}</h1>
          </div>
          <Button type="button" onClick={() => router.push('/backend/auto_inspections/create')}>
            <Plus className="mr-2 size-4" />
            {t('auto_inspections.list.new_button', 'Nueva Inspección')}
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={inspections}
          isLoading={isLoading}
          searchPlaceholder={t('auto_inspections.list.search_placeholder', 'Buscar inspección...')}
        />
      </PageBody>
    </Page>
  )
}
