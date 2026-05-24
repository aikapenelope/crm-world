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
import { Plus, CheckCircle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type BomRow = {
  id: string; product_code: string; product_name: string; version: string
  bom_type: string; base_quantity: string; base_uom: string
  expected_yield_pct: string | null; status: string
}

const STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', active: 'success', superseded: 'warning', archived: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', active: 'Activo', superseded: 'Reemplazado', archived: 'Archivado',
}
const TYPE_LABEL: Record<string, string> = {
  process: 'Por procesos', discrete: 'Discreto',
}

export default function MfgBomPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation()
  const [boms, setBoms]          = React.useState<BomRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [showForm, setShowForm]  = React.useState(false)
  const [statusFilter, setFilter] = React.useState('active')

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const res = await apiCall<{ items: BomRow[] }>(`/api/mfg-bom/bom-headers?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setBoms(res.result?.items ?? [])
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleActivate = (bom: BomRow) => {
    runMutation({
      operation: 'update',
      context: { entityId: 'mfg_bom.header', recordId: bom.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/mfg-bom/bom-headers', {
          method: 'PUT',
          body: JSON.stringify({ id: bom.id, status: 'active', approved_at: new Date().toISOString() }),
        })
        flash(`BOM ${bom.product_code} v${bom.version} activado`, 'success')
        load()
      },
    })
  }

  const columns: ColumnDef<BomRow>[] = [
    {
      accessorKey: 'product_code',
      header: 'Código',
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.product_code}</span>,
    },
    {
      accessorKey: 'product_name',
      header: 'Producto',
      meta: { truncate: true, maxWidth: 250 },
    },
    {
      accessorKey: 'bom_type',
      header: 'Tipo',
      cell: ({ row }) => TYPE_LABEL[row.original.bom_type] ?? row.original.bom_type,
    },
    {
      accessorKey: 'version',
      header: 'Versión',
      cell: ({ row }) => <span className="font-semibold">v{row.original.version}</span>,
    },
    {
      id: 'base',
      header: 'Base',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.base_quantity} {row.original.base_uom}
          {row.original.expected_yield_pct && (
            <span className="text-muted-foreground ml-1">({row.original.expected_yield_pct}% rend.)</span>
          )}
        </span>
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
          { id: 'edit',     label: 'Editar componentes', onSelect: () => router.push(`/backend/mfg-bom/${row.original.id}`) },
          ...(row.original.status === 'draft' ? [
            { id: 'activate', label: 'Activar BOM', onSelect: () => handleActivate(row.original) },
          ] : []),
        ]} />
      ),
    },
  ]

  const activeBomCount = boms.filter((b) => b.status === 'active').length

  const FILTERS = [
    { value: 'active', label: 'Activos' },
    { value: 'draft',  label: 'Borrador' },
    { value: '',       label: 'Todos' },
  ]

  return (
    <Page>
      <PageHeader
        title="Bill of Materials"
        description={`${activeBomCount} BOM${activeBomCount !== 1 ? 's' : ''} activo${activeBomCount !== 1 ? 's' : ''} en producción`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {FILTERS.map((f) => (
                <Button key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setFilter(f.value)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={() => setShowForm(!showForm)}>
              <Plus className="size-4 mr-2" /> Nuevo BOM
            </Button>
          </div>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Crear Bill of Materials</h3>
            <CrudForm
              entityId="mfg_bom.header"
              apiPath="/api/mfg-bom/bom-headers"
              mode="create"
              fields={[
                { type: 'text' as const,   id: 'product_code',       label: 'Código de Producto', required: true },
                { type: 'text' as const,   id: 'product_name',       label: 'Nombre del Producto', required: true },
                { type: 'select' as const, id: 'bom_type',           label: 'Tipo de BOM', required: true,
                  options: [
                    { value: 'discrete', label: 'Discreto (lista de componentes)' },
                    { value: 'process',  label: 'Por Procesos (receta con rendimiento)' },
                  ]},
                { type: 'text' as const,   id: 'base_quantity',      label: 'Cantidad Base (ej: 1000)' },
                { type: 'text' as const,   id: 'base_uom',           label: 'Unidad (kg, units, liters)', required: true },
                { type: 'text' as const,   id: 'expected_yield_pct', label: 'Rendimiento Esperado (%) — solo para "Por Procesos"' },
                { type: 'text' as const,   id: 'version',            label: 'Versión (ej: 1.0)' },
                { type: 'textarea' as const, id: 'notes',            label: 'Notas / Alcance del BOM' },
              ]}
              groups={[
                { id: 'product',  title: 'Producto',    fields: ['product_code', 'product_name', 'bom_type'] },
                { id: 'output',   title: 'Producción',  fields: ['base_quantity', 'base_uom', 'expected_yield_pct'] },
                { id: 'meta',     title: 'Versión',     fields: ['version', 'notes'] },
              ]}
              onSuccess={() => {
                flash('BOM creado — ahora agrega los componentes en el detalle', 'success')
                setShowForm(false)
                load()
              }}
            />
          </div>
        )}

        <DataTable
          entityId="mfg_bom.header"
          extensionTableId="mfg-bom-list"
          data={boms}
          columns={columns}
          isLoading={isLoading}
          emptyState='Sin BOMs registrados'
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
