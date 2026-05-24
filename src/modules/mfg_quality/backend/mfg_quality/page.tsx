'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { Plus, AlertOctagon } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type NcRow = {
  id: string; nc_number: string; source: string; product_code: string | null
  severity: string; status: string; description: string
  quantity_affected: string | null; uom: string | null; cost_nc_usd: string | null
  created_at: string
}

const SEV_VARIANT: Record<string, 'error' | 'warning' | 'neutral'> = {
  critical: 'error', major: 'warning', minor: 'neutral',
}
const SEV_LABEL: Record<string, string> = {
  critical: 'Crítica', major: 'Mayor', minor: 'Menor',
}
const STATUS_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'neutral' | 'success'> = {
  open: 'error', under_review: 'warning', pending_disposition: 'warning',
  resolved: 'success', closed: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Abierta', under_review: 'En revisión', pending_disposition: 'Pend. disposición',
  resolved: 'Resuelta', closed: 'Cerrada',
}
const SOURCE_LABEL: Record<string, string> = {
  receiving: 'Recepción', in_process: 'Proceso', finished_goods: 'PT',
  customer_return: 'Devolución cliente', audit: 'Auditoría',
}

export default function MfgQualityPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation({ contextId: 'mfg_quality.page' })
  const [ncs, setNcs]           = React.useState<NcRow[]>([])
  const [isLoading, setLoading] = React.useState(true)
  const [statusFilter, setFilter] = React.useState('open')
  const [showForm, setShowForm]  = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const res = await apiCall<{ items: NcRow[] }>(`/api/mfg-quality/nonconformances?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setNcs(res.result?.items ?? [])
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const criticalCount = ncs.filter((nc) => nc.severity === 'critical' && nc.status !== 'closed').length
  const totalCostNc   = ncs.filter((nc) => nc.cost_nc_usd).reduce((s, nc) => s + Number(nc.cost_nc_usd), 0)

  const STATUS_FILTERS = [
    { value: 'open',              label: 'Abiertas' },
    { value: 'pending_disposition', label: 'Pend. disposición' },
    { value: '',                  label: 'Todas' },
  ]

  const columns: ColumnDef<NcRow>[] = [
    {
      accessorKey: 'nc_number',
      header: 'N° NC',
      cell: ({ row }) => <span className="font-mono font-semibold text-sm">{row.original.nc_number}</span>,
    },
    {
      accessorKey: 'source',
      header: 'Origen',
      cell: ({ row }) => <span className="text-sm">{SOURCE_LABEL[row.original.source] ?? row.original.source}</span>,
    },
    {
      accessorKey: 'product_code',
      header: 'Producto',
      cell: ({ row }) => row.original.product_code ?? '—',
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      meta: { truncate: true, maxWidth: 300 },
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.description}</span>,
    },
    {
      accessorKey: 'severity',
      header: 'Severidad',
      cell: ({ row }) => (
        <StatusBadge variant={SEV_VARIANT[row.original.severity] ?? 'neutral'}>
          {SEV_LABEL[row.original.severity] ?? row.original.severity}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>
          {STATUS_LABEL[row.original.status] ?? row.original.status}
        </StatusBadge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'view', label: 'Ver detalle / Workflow', onSelect: () => router.push(`/backend/mfg-quality/${row.original.id}`) },
        ]} />
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Control de Calidad — No-Conformidades"
        description={[
          criticalCount > 0 && `${criticalCount} NC crítica(s) abiertas`,
          totalCostNc > 0 && `Costo NC: USD ${totalCostNc.toFixed(2)}`,
        ].filter(Boolean).join(' · ') || `${ncs.length} no-conformidades`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <Button key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setFilter(f.value)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={() => setShowForm(!showForm)}>
              <Plus className="size-4 mr-2" /> Nueva NC
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/backend/mfg-quality/spc')}>
              Cartas SPC
            </Button>
          </div>
        }
      />
      <PageBody>
        {criticalCount > 0 && (
          <div className="mb-4 p-3 bg-status-error-bg border border-status-error-border rounded-lg flex items-center gap-2">
            <AlertOctagon className="size-4 text-status-error-icon shrink-0" />
            <span className="text-sm text-status-error-text">
              <strong>{criticalCount} No-Conformidad(es) crítica(s)</strong> abiertas — requieren disposición urgente.
            </span>
          </div>
        )}

        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Registrar No-Conformidad</h3>
            <CrudForm
              entityId="mfg_quality.nc"
              apiPath="/api/mfg-quality/nonconformances"
              mode="create"
              initial={{ status: 'open' }}
              fields={[
                { type: 'text' as const,   id: 'nc_number',    label: 'Número de NC (NC-MFG-2026-XXX)', required: true },
                { type: 'select' as const, id: 'source',       label: 'Origen de la detección', required: true,
                  options: [
                    { value: 'receiving',       label: 'Recepción de materia prima' },
                    { value: 'in_process',      label: 'Durante el proceso productivo' },
                    { value: 'finished_goods',  label: 'Producto terminado' },
                    { value: 'customer_return', label: 'Devolución de cliente' },
                    { value: 'audit',           label: 'Auditoría interna/externa' },
                  ]},
                { type: 'text' as const,   id: 'product_code', label: 'Código del producto/material afectado' },
                { type: 'textarea' as const, id: 'description', label: 'Descripción de la desviación', required: true },
                { type: 'select' as const, id: 'severity',     label: 'Severidad', required: true,
                  options: [
                    { value: 'critical', label: 'Crítica — riesgo de inocuidad/seguridad' },
                    { value: 'major',    label: 'Mayor — incumple especificación' },
                    { value: 'minor',    label: 'Menor — desviación cosmética o marginal' },
                  ]},
                { type: 'text' as const,   id: 'quantity_affected', label: 'Cantidad afectada' },
                { type: 'text' as const,   id: 'uom',               label: 'Unidad de medida' },
                { type: 'text' as const,   id: 'lot_number',        label: 'Número de lote afectado' },
                { type: 'text' as const,   id: 'cost_nc_usd',       label: 'Costo estimado de la NC (USD)' },
                { type: 'textarea' as const, id: 'notes',           label: 'Observaciones iniciales' },
              ]}
              groups={[
                { id: 'basic',    title: 'Identificación', fields: ['nc_number', 'source', 'product_code', 'lot_number'] },
                { id: 'desc',     title: 'Descripción',    fields: ['description', 'severity', 'quantity_affected', 'uom'] },
                { id: 'cost',     title: 'Costo / Notas',  fields: ['cost_nc_usd', 'notes'] },
              ]}
              onSuccess={() => {
                flash('No-Conformidad registrada', 'success')
                setShowForm(false)
                load()
              }}
            />
          </div>
        )}

        <DataTable
          entityId="mfg_quality.nc"
          extensionTableId="mfg-quality-ncs"
          data={ncs}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin no-conformidades"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
