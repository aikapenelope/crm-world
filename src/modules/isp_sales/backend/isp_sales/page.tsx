'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type LeadRow = {
  id: string
  name: string
  phone: string
  city: string
  source: string
  status: string
  coverage_status: string | null
  created_at: string
}

const SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp 📱', instagram: 'Instagram 📷', referral: 'Referido 🤝',
  website: 'Web 🌐', cold_call: 'Llamada 📞', other: 'Otro',
}
const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'neutral' | 'error'> = {
  new: 'info', coverage_check: 'warning', quoted: 'warning',
  scheduled: 'info', installed: 'success', lost: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  new: 'Nuevo', coverage_check: 'Verificando', quoted: 'Cotizado',
  scheduled: 'Agendado', installed: '✓ Instalado', lost: 'Perdido',
}

export default function IspSalesPage() {
  const router = useRouter()
  const [leads, setLeads] = React.useState<LeadRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [kpis, setKpis] = React.useState<any>(null)
  const [statusFilter, setStatusFilter] = React.useState('')

  const load = React.useCallback(async () => {
    setIsLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const [lRes, kRes] = await Promise.all([
      apiCall<{ items: LeadRow[] }>(`/api/isp-sales/leads?${params}`, undefined, { fallback: { items: [] } }),
      apiCall<any>('/api/isp-sales/dashboard', undefined, { fallback: null }),
    ])
    if (lRes.ok) setLeads(lRes.result?.items ?? [])
    if (kRes.ok) setKpis(kRes.result)
    setIsLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const columns: ColumnDef<LeadRow>[] = [
    { accessorKey: 'name', header: 'Nombre', cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { accessorKey: 'phone', header: 'Teléfono', cell: ({ row }) => <span className="font-mono text-sm">{row.original.phone}</span> },
    { accessorKey: 'city', header: 'Ciudad' },
    { accessorKey: 'source', header: 'Canal', cell: ({ row }) => SOURCE_LABELS[row.original.source] ?? row.original.source },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {STATUS_LABEL[row.original.status] ?? row.original.status}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'created_at', header: 'Fecha',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'open', label: 'Ver detalle', onSelect: () => router.push(`/backend/isp-sales/${row.original.id}`) },
        ]} />
      ),
    },
  ]

  const STATUS_FILTERS = [
    { value: '', label: 'Todos' }, { value: 'new', label: 'Nuevos' },
    { value: 'quoted', label: 'Cotizados' }, { value: 'scheduled', label: 'Agendados' },
    { value: 'lost', label: 'Perdidos' },
  ]

  const total = kpis?.total ?? 0
  const converted = kpis?.converted_this_month ?? 0
  const rate = kpis?.conversion_rate ?? 0

  return (
    <Page>
      <PageHeader
        title="Pipeline de Ventas"
        description={kpis ? `${total} leads · ${converted} convertidos este mes · ${rate}% conversión` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(f.value)}
                >{f.label}</Button>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => router.push('/backend/isp-sales/coverage')}>
              Cobertura
            </Button>
            <Button type="button" onClick={() => router.push('/backend/isp-sales/create')}>
              <Plus className="size-4 mr-2" /> Nuevo lead
            </Button>
          </div>
        }
      />
      <PageBody>
        <DataTable
          entityId="isp_sales.lead"
          extensionTableId="isp-leads-list"
          data={leads}
          columns={columns}
          isLoading={isLoading}
          emptyState={{ title: 'Sin leads', description: 'Registra tu primer prospecto.' }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
