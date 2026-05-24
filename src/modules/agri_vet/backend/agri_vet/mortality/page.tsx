'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type MortRow = {
  id: string; flock_id: string; record_date: string;
  count: number; cause: string; cause_detail: string | null
}

const CAUSE_LABEL: Record<string, string> = {
  sanitary: 'Sanitaria', heat_stress: 'Golpe de calor', crushing: 'Aplastamiento',
  low_weight_selection: 'Selección bajo peso', other: 'Otra causa',
}
const CAUSE_VARIANT: Record<string, 'error' | 'warning' | 'neutral' | 'info'> = {
  sanitary: 'error', heat_stress: 'warning', crushing: 'warning',
  low_weight_selection: 'info', other: 'neutral',
}

export default function MortalityPage() {
  const [records, setRecords]    = React.useState<MortRow[]>([])
  const [isLoading, setLoading]  = React.useState(true)
  const [showForm, setShowForm]  = React.useState(false)
  const [flockOptions, setFlocks] = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    const [mortRes, flockRes] = await Promise.all([
      apiCall<{ items: MortRow[] }>('/api/agri-vet/mortality-records?pageSize=200', undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/agri-units/flocks?pageSize=100&status=active', undefined, { fallback: { items: [] } }),
    ])
    if (mortRes.ok)  setRecords((mortRes.result?.items ?? []).sort((a: MortRow, b: MortRow) => b.record_date.localeCompare(a.record_date)))
    if (flockRes.ok) setFlocks((flockRes.result?.items ?? []).map((f: any) => ({ value: f.id, label: f.flock_number })))
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const todayTotal = records
    .filter(r => r.record_date === new Date().toISOString().split('T')[0])
    .reduce((sum, r) => sum + r.count, 0)

  const columns: ColumnDef<MortRow>[] = [
    {
      accessorKey: 'record_date',
      header: 'Fecha',
      cell: ({ row }) => new Date((row.original as MortRow).record_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'count',
      header: 'Muertes',
      cell: ({ row }) => (
        <span className="font-bold text-status-error-text">{(row.original as MortRow).count}</span>
      ),
    },
    {
      accessorKey: 'cause',
      header: 'Causa',
      cell: ({ row }) => (
        <StatusBadge variant={CAUSE_VARIANT[(row.original as MortRow).cause] ?? 'neutral'}>
          {CAUSE_LABEL[(row.original as MortRow).cause] ?? (row.original as MortRow).cause}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'cause_detail',
      header: 'Detalle',
      cell: ({ row }) => (row.original as MortRow).cause_detail ?? '—',
      meta: { truncate: true, maxWidth: 300 },
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Registro de Mortalidad"
        description={todayTotal > 0 ? `${todayTotal} muertes registradas hoy` : 'Sin registros de mortalidad hoy'}
        actions={
          <Button type="button" onClick={() => setShowForm(true)}>
            <Plus className="size-4 mr-2" /> Registrar Mortalidad
          </Button>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Registrar Mortalidad Diaria</h3>
            <CrudForm
              entityId="agri_vet.mortality"
              apiPath="/api/agri-vet/mortality-records"
              mode="create"
              fields={[
                { type: 'select' as const,   id: 'flock_id',    label: 'Lote de Aves', required: true, options: flockOptions },
                { type: 'date' as const,     id: 'record_date', label: 'Fecha',        required: true },
                { type: 'number' as const,   id: 'count',       label: 'Número de Muertes', required: true },
                { type: 'select' as const,   id: 'cause',       label: 'Causa',        required: true,
                  options: [
                    { value: 'sanitary',              label: 'Sanitaria' },
                    { value: 'heat_stress',           label: 'Golpe de calor' },
                    { value: 'crushing',              label: 'Aplastamiento' },
                    { value: 'low_weight_selection',  label: 'Selección por bajo peso' },
                    { value: 'other',                 label: 'Otra causa' },
                  ]},
                { type: 'textarea' as const, id: 'cause_detail', label: 'Detalle de la Causa' },
                { type: 'textarea' as const, id: 'notes',        label: 'Observaciones' },
              ]}
              groups={[
                { id: 'record', title: 'Registro', fields: ['flock_id', 'record_date', 'count', 'cause', 'cause_detail', 'notes'] },
              ]}
              onSuccess={() => { flash('Mortalidad registrada', 'success'); setShowForm(false); load() }}
            />
          </div>
        )}
        <DataTable
          entityId="agri_vet.mortality"
          extensionTableId="agri-vet-mortality-list"
          data={records}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin registros de mortalidad"
        />
      </PageBody>
    </Page>
  )
}
