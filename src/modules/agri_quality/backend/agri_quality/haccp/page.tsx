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

type PlanRow = {
  id: string
  name: string
  process: string
  version: string
  approved_by: string | null
  approved_date: string | null
  status: string
  critical_control_points: any[]
}

const PROCESS_LABEL: Record<string, string> = {
  beneficio: 'Beneficio',
  procesamiento: 'Procesamiento',
  almacenamiento: 'Almacenamiento',
  despacho: 'Despacho',
  general: 'General',
}
const STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', active: 'success', superseded: 'error',
}
const STATUS_LABEL: Record<string, string> = { draft: 'Borrador', active: 'Activo', superseded: 'Reemplazado' }

export default function HaccpPlansPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation()
  const [plans, setPlans]       = React.useState<PlanRow[]>([])
  const [isLoading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    const res = await apiCall<{ items: PlanRow[] }>(
      '/api/agri-quality/haccp-plans?pageSize=50',
      undefined,
      { fallback: { items: [] } },
    )
    if (res.ok) setPlans(res.result?.items ?? [])
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleActivate = (plan: PlanRow) => {
    runMutation({
      context: { entityId: 'agri_quality.haccp_plan', recordId: plan.id },
      operation: async () => {
        await apiCallOrThrow('/api/agri-quality/haccp-plans', {
          method: 'PUT',
          body: JSON.stringify({
            id: plan.id,
            status: 'active',
            approved_date: new Date().toISOString().split('T')[0],
          }),
        })
        flash('Plan HACCP activado', 'success')
        load()
      },
    })
  }

  const activePlan = plans.find((p) => p.status === 'active')

  const columns: ColumnDef<PlanRow>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre del Plan',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">v{row.original.version}</div>
        </div>
      ),
    },
    {
      accessorKey: 'process',
      header: 'Proceso',
      cell: ({ row }) => PROCESS_LABEL[row.original.process] ?? row.original.process,
    },
    {
      id: 'ccp_count',
      header: 'PCCs',
      cell: ({ row }) => {
        const count = (row.original.critical_control_points ?? []).length
        return (
          <span className={`font-semibold ${count === 0 ? 'text-status-warning-text' : 'text-status-success-text'}`}>
            {count} {count === 1 ? 'PCC' : 'PCCs'}
          </span>
        )
      },
    },
    {
      accessorKey: 'approved_by',
      header: 'Aprobado por',
      cell: ({ row }) => row.original.approved_by ?? '—',
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
        <RowActions
          items={[
            {
              id: 'edit',
              label: 'Editar PCCs',
              onSelect: () => router.push(`/backend/agri-quality/haccp/${row.original.id}`),
            },
            ...(row.original.status === 'draft'
              ? [{ id: 'activate', label: 'Activar plan', onSelect: () => handleActivate(row.original) }]
              : []),
          ]}
        />
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Planes HACCP"
        description={
          activePlan
            ? `Plan activo: ${activePlan.name} — ${(activePlan.critical_control_points ?? []).length} PCCs`
            : 'Sin plan HACCP activo — el sistema de inocuidad no está operativo'
        }
        actions={
          <Button type="button" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4 mr-2" /> Nuevo Plan
          </Button>
        }
      />
      <PageBody>
        {!activePlan && (
          <div className="mb-4 p-3 bg-status-warning-bg border border-status-warning-border rounded-lg text-sm text-status-warning-text">
            Sin plan HACCP activo. El sistema de inocuidad requiere al menos un plan activo con sus PCCs configurados antes de iniciar el monitoreo.
          </div>
        )}

        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Crear Plan HACCP</h3>
            <CrudForm
              entityId="agri_quality.haccp_plan"
              apiPath="/api/agri-quality/haccp-plans"
              mode="create"
              fields={[
                { type: 'text' as const,   id: 'name',       label: 'Nombre del Plan',  required: true },
                { type: 'select' as const, id: 'process',    label: 'Proceso Productivo', required: true,
                  options: [
                    { value: 'beneficio',     label: 'Beneficio avícola' },
                    { value: 'procesamiento', label: 'Procesamiento / cortes' },
                    { value: 'almacenamiento', label: 'Almacenamiento frío' },
                    { value: 'despacho',      label: 'Despacho / distribución' },
                    { value: 'general',       label: 'General (toda la planta)' },
                  ]},
                { type: 'text' as const,   id: 'version',    label: 'Versión', },
                { type: 'text' as const,   id: 'approved_by', label: 'Aprobado por (nombre/cargo)' },
                { type: 'textarea' as const, id: 'notes',    label: 'Alcance y descripción' },
              ]}
              groups={[
                { id: 'general', title: 'Identificación', fields: ['name', 'process', 'version', 'approved_by', 'notes'] },
              ]}
              onSuccess={() => {
                flash('Plan HACCP creado — ahora agrega los PCCs en el detalle del plan', 'success')
                setShowForm(false)
                load()
              }}
            />
          </div>
        )}

        <DataTable
          entityId="agri_quality.haccp_plan"
          extensionTableId="agri-quality-haccp-list"
          data={plans}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin planes HACCP"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
