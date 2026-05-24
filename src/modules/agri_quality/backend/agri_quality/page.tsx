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
  id: string; nc_number: string; source: string; severity: string
  description: string; detection_date: string; status: string
  decision: string | null; affected_lot_id: string | null
}

const SEVERITY_VARIANT: Record<string, 'error' | 'warning' | 'neutral'> = {
  critical: 'error', major: 'warning', minor: 'neutral',
}
const STATUS_VARIANT: Record<string, 'error' | 'warning' | 'info' | 'neutral' | 'success'> = {
  open: 'error', investigating: 'warning', pending_decision: 'warning',
  resolved: 'success', closed: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Abierta', investigating: 'En investigación', pending_decision: 'Pendiente decisión',
  resolved: 'Resuelta', closed: 'Cerrada',
}
const SOURCE_LABEL: Record<string, string> = {
  ccp_deviation: 'PCC', temperature_excursion: 'Temperatura', microbiological: 'Microbiología',
  physical: 'Físico', chemical: 'Químico', bpm_checklist: 'BPM', external_audit: 'Auditoría', complaint: 'Reclamo',
}

export default function AgriQualityPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation({ contextId: 'agri_quality.page' })
  const [ncs, setNcs]           = React.useState<NcRow[]>([])
  const [isLoading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [statusFilter, setFilter] = React.useState('open')

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const res = await apiCall<{ items: NcRow[] }>(`/api/agri-quality/non-conformities?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setNcs(res.result?.items ?? [])
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleDecide = (nc: NcRow, decision: string) => {
    runMutation({
      context: { entityId: 'agri_quality.non_conformity', recordId: nc.id },
      operation: async () => {
        await apiCallOrThrow('/api/agri-quality/non-conformities', {
          method: 'PUT',
          body: JSON.stringify({ id: nc.id, decision, status: 'resolved', decision_date: new Date().toISOString().split('T')[0] }),
        })
        flash(`Decisión tomada: ${decision}`, 'success')
        load()
      },
    })
  }

  const openCount    = ncs.filter(n => n.status === 'open').length
  const criticalOpen = ncs.filter(n => n.severity === 'critical' && n.status === 'open').length

  const columns: ColumnDef<NcRow>[] = [
    {
      accessorKey: 'nc_number',
      header: 'N° NC',
      cell: ({ row }) => <span className="font-mono font-semibold">{row.original.nc_number}</span>,
    },
    {
      accessorKey: 'severity',
      header: 'Severidad',
      cell: ({ row }) => (
        <StatusBadge variant={SEVERITY_VARIANT[row.original.severity] ?? 'neutral'}>
          {row.original.severity === 'critical' ? 'Crítica' : row.original.severity === 'major' ? 'Mayor' : 'Menor'}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Origen',
      cell: ({ row }) => SOURCE_LABEL[row.original.source] ?? row.original.source,
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      meta: { truncate: true, maxWidth: 300 },
    },
    {
      accessorKey: 'detection_date',
      header: 'Detectada',
      cell: ({ row }) => new Date(row.original.detection_date).toLocaleDateString('es-VE'),
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
            { id: 'open', label: 'Ver detalle / Workflow', onSelect: () => router.push(`/backend/agri-quality/non-conformities/${row.original.id}`) },
            ...(['open', 'investigating', 'pending_decision'].includes(row.original.status) ? [
              { id: 'rework',   label: 'Decidir: Retrabajo',    onSelect: () => handleDecide(row.original, 'rework') },
              { id: 'destroy',  label: 'Decidir: Destrucción',   variant: 'destructive' as const, onSelect: () => handleDecide(row.original, 'destroy') },
              { id: 'release',  label: 'Decidir: Liberar',       onSelect: () => handleDecide(row.original, 'release') },
            ] : []),
          ]}
        />
      ),
    },
  ]

  const FILTERS = [
    { value: 'open', label: 'Abiertas' },
    { value: 'pending_decision', label: 'Pendiente decisión' },
    { value: 'resolved', label: 'Resueltas' },
    { value: '', label: 'Todas' },
  ]

  return (
    <Page>
      <PageHeader
        title="No-Conformidades"
        description={criticalOpen > 0
          ? `${criticalOpen} NC crítica(s) sin resolver`
          : openCount > 0 ? `${openCount} NC(s) abiertas`
          : 'Sin no-conformidades abiertas'}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {FILTERS.map(f => (
                <Button key={f.value} type="button" size="sm"
                  variant={statusFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setFilter(f.value)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={() => setShowForm(true)}>
              <Plus className="size-4 mr-2" /> Nueva NC
            </Button>
          </div>
        }
      />
      <PageBody>
        {criticalOpen > 0 && (
          <div className="mb-4 p-3 bg-status-error-bg border border-status-error-border rounded-lg flex items-center gap-2">
            <AlertOctagon className="size-4 text-status-error-icon shrink-0" />
            <span className="text-sm text-status-error-text font-semibold">
              {criticalOpen} no-conformidad(es) crítica(s) requieren decisión inmediata del gerente de calidad.
            </span>
          </div>
        )}

        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Nueva No-Conformidad</h3>
            <CrudForm
              entityId="agri_quality.non_conformity"
              apiPath="/api/agri-quality/non-conformities"
              mode="create"
              fields={[
                { type: 'text' as const,   id: 'nc_number',      label: 'N° NC (NC-YYYYMM-XXX)',   required: true },
                { type: 'select' as const, id: 'source',         label: 'Origen',                   required: true,
                  options: [
                    { value: 'ccp_deviation',      label: 'Desviación de PCC' },
                    { value: 'temperature_excursion', label: 'Excursión de temperatura' },
                    { value: 'microbiological',    label: 'Resultado microbiológico' },
                    { value: 'physical',           label: 'Peligro físico' },
                    { value: 'chemical',           label: 'Peligro químico' },
                    { value: 'bpm_checklist',      label: 'Checklist BPM' },
                    { value: 'external_audit',     label: 'Auditoría externa' },
                    { value: 'complaint',          label: 'Reclamo de cliente' },
                  ]},
                { type: 'select' as const, id: 'severity',       label: 'Severidad',               required: true,
                  options: [
                    { value: 'critical', label: 'Crítica' },
                    { value: 'major',    label: 'Mayor' },
                    { value: 'minor',    label: 'Menor' },
                  ]},
                { type: 'textarea' as const, id: 'description',  label: 'Descripción',              required: true },
                { type: 'date' as const,   id: 'detection_date', label: 'Fecha de Detección',       required: true },
                { type: 'textarea' as const, id: 'notes',        label: 'Notas' },
              ]}
              groups={[
                { id: 'info',  title: 'Información', fields: ['nc_number', 'source', 'severity', 'detection_date'] },
                { id: 'desc',  title: 'Descripción', fields: ['description', 'notes'] },
              ]}
              onSuccess={() => { flash('No-conformidad registrada', 'success'); setShowForm(false); load() }}
            />
          </div>
        )}

        <DataTable
          entityId="agri_quality.non_conformity"
          extensionTableId="agri-quality-nc-list"
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
