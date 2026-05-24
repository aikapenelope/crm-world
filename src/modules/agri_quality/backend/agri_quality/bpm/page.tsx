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

type BpmRow = {
  id: string; checklist_type: string; area: string; check_date: string
  shift: string | null; overall_result: string; findings: string | null
}

const RESULT_VARIANT: Record<string, 'success' | 'error' | 'warning'> = {
  pass: 'success', fail: 'error', conditional: 'warning',
}
const RESULT_LABEL: Record<string, string> = { pass: 'Conforme', fail: 'No conforme', conditional: 'Condicional' }
const TYPE_LABEL: Record<string, string> = {
  cleaning_disinfection: 'Limpieza/Desinfección', personal_hygiene: 'Higiene personal',
  pest_control: 'Control de plagas', equipment_calibration: 'Calibración equipos', general_bpm: 'BPM General',
}

export default function BpmChecklistsPage() {
  const [checklists, setChecklists] = React.useState<BpmRow[]>([])
  const [isLoading, setLoading]     = React.useState(true)
  const [showForm, setShowForm]     = React.useState(false)
  const [typeFilter, setType]       = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (typeFilter) params.set('checklist_type', typeFilter)
    const res = await apiCall<{ items: BpmRow[] }>(`/api/agri-quality/bpm-checklists?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setChecklists(res.result?.items ?? [])
    setLoading(false)
  }, [typeFilter])

  React.useEffect(() => { load() }, [load])

  const failCount = checklists.filter(c => c.overall_result === 'fail').length

  const columns: ColumnDef<BpmRow>[] = [
    {
      accessorKey: 'check_date',
      header: 'Fecha',
      cell: ({ row }) => new Date((row.original as BpmRow).check_date).toLocaleDateString('es-VE'),
    },
    {
      accessorKey: 'checklist_type',
      header: 'Tipo',
      cell: ({ row }) => TYPE_LABEL[(row.original as BpmRow).checklist_type] ?? (row.original as BpmRow).checklist_type,
    },
    { accessorKey: 'area', header: 'Área' },
    {
      accessorKey: 'shift',
      header: 'Turno',
      cell: ({ row }) => {
        const s = (row.original as BpmRow).shift
        return s === 'morning' ? 'Mañana' : s === 'afternoon' ? 'Tarde' : s === 'night' ? 'Noche' : '—'
      },
    },
    {
      accessorKey: 'overall_result',
      header: 'Resultado',
      cell: ({ row }) => (
        <StatusBadge variant={RESULT_VARIANT[(row.original as BpmRow).overall_result] ?? 'neutral'} dot>
          {RESULT_LABEL[(row.original as BpmRow).overall_result] ?? (row.original as BpmRow).overall_result}
        </StatusBadge>
      ),
    },
    {
      accessorKey: 'findings',
      header: 'Hallazgos',
      cell: ({ row }) => (row.original as BpmRow).findings ?? '—',
      meta: { truncate: true, maxWidth: 250 },
    },
  ]

  const TYPE_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'cleaning_disinfection', label: 'Limpieza' },
    { value: 'personal_hygiene',      label: 'Higiene' },
    { value: 'pest_control',          label: 'Plagas' },
  ]

  return (
    <Page>
      <PageHeader
        title="Checklists BPM"
        description={failCount > 0 ? `${failCount} checklist(s) no conforme(s)` : 'Todos los checklists conformes'}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {TYPE_FILTERS.map(f => (
                <Button key={f.value} type="button" size="sm"
                  variant={typeFilter === f.value ? 'default' : 'outline'}
                  onClick={() => setType(f.value)}>
                  {f.label}
                </Button>
              ))}
            </div>
            <Button type="button" onClick={() => setShowForm(true)}>
              <Plus className="size-4 mr-2" /> Nuevo Checklist
            </Button>
          </div>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Nuevo Checklist BPM</h3>
            <CrudForm
              entityId="agri_quality.bpm_checklist"
              apiPath="/api/agri-quality/bpm-checklists"
              mode="create"
              fields={[
                { type: 'select' as const, id: 'checklist_type',  label: 'Tipo de Checklist',  required: true,
                  options: [
                    { value: 'cleaning_disinfection', label: 'Limpieza y Desinfección' },
                    { value: 'personal_hygiene',      label: 'Higiene del Personal' },
                    { value: 'pest_control',          label: 'Control de Plagas' },
                    { value: 'equipment_calibration', label: 'Calibración de Equipos' },
                    { value: 'general_bpm',           label: 'BPM General' },
                  ]},
                { type: 'text' as const,   id: 'area',            label: 'Área',                required: true },
                { type: 'date' as const,   id: 'check_date',      label: 'Fecha',               required: true },
                { type: 'select' as const, id: 'shift',           label: 'Turno',
                  options: [
                    { value: 'morning',   label: 'Mañana' },
                    { value: 'afternoon', label: 'Tarde' },
                    { value: 'night',     label: 'Noche' },
                  ]},
                { type: 'select' as const, id: 'overall_result',  label: 'Resultado General',  required: true,
                  options: [
                    { value: 'pass',        label: 'Conforme' },
                    { value: 'conditional', label: 'Condicional' },
                    { value: 'fail',        label: 'No Conforme' },
                  ]},
                { type: 'textarea' as const, id: 'findings',          label: 'Hallazgos' },
                { type: 'textarea' as const, id: 'corrective_actions', label: 'Acciones Correctivas' },
              ]}
              groups={[
                { id: 'general', title: 'General',      fields: ['checklist_type', 'area', 'check_date', 'shift'] },
                { id: 'result',  title: 'Resultado',    fields: ['overall_result', 'findings', 'corrective_actions'] },
              ]}
              onSuccess={() => { flash('Checklist BPM registrado', 'success'); setShowForm(false); load() }}
            />
          </div>
        )}
        <DataTable
          entityId="agri_quality.bpm_checklist"
          extensionTableId="agri-quality-bpm-list"
          data={checklists}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin checklists BPM"
        />
      </PageBody>
    </Page>
  )
}
