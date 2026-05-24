'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Plus } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type EmpRow = { id: string; first_name: string; last_name: string; cedula: string | null; employee_type: string; department: string | null; position: string | null; salary_usd: string | null; base_jornal_usd: string | null; status: string }

const TYPE_LABEL: Record<string, string> = { fixed: 'Fijo', jornalero: 'Jornalero', destajero: 'Destajero' }
const TYPE_VARIANT: Record<string, 'success' | 'info' | 'warning'> = { fixed: 'success', jornalero: 'info', destajero: 'warning' }

export default function AgriHrPage() {
  const [employees, setEmployees]   = React.useState<EmpRow[]>([])
  const [isLoading, setLoading]     = React.useState(true)
  const [showForm, setShowForm]     = React.useState(false)
  const [editing, setEditing]       = React.useState<EmpRow | null>(null)
  const [typeFilter, setType]       = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '200', status: 'active' })
    if (typeFilter) params.set('employee_type', typeFilter)
    const res = await apiCall<{ items: EmpRow[] }>(`/api/agri-hr/employees?${params}`, undefined, { fallback: { items: [] } })
    if (res.ok) setEmployees(res.result?.items ?? [])
    setLoading(false)
  }, [typeFilter])

  React.useEffect(() => { load() }, [load])

  const fixedCount     = employees.filter(e => e.employee_type === 'fixed').length
  const jornaleroCount = employees.filter(e => e.employee_type === 'jornalero' || e.employee_type === 'destajero').length

  const columns: ColumnDef<EmpRow>[] = [
    { accessorKey: 'first_name', header: 'Nombre', cell: ({ row }) => <span className="font-semibold">{row.original.first_name} {row.original.last_name}</span> },
    { accessorKey: 'cedula', header: 'Cédula', cell: ({ row }) => row.original.cedula ?? '—' },
    {
      accessorKey: 'employee_type', header: 'Tipo',
      cell: ({ row }) => <StatusBadge variant={TYPE_VARIANT[row.original.employee_type] ?? 'neutral'}>{TYPE_LABEL[row.original.employee_type] ?? row.original.employee_type}</StatusBadge>,
    },
    { accessorKey: 'department', header: 'Dpto.', cell: ({ row }) => row.original.department ?? '—' },
    { accessorKey: 'position', header: 'Cargo', cell: ({ row }) => row.original.position ?? '—' },
    {
      id: 'rate', header: 'Tasa',
      cell: ({ row }) => {
        if (row.original.salary_usd) return `USD ${row.original.salary_usd}/mes`
        if (row.original.base_jornal_usd) return `USD ${row.original.base_jornal_usd}/día`
        return '—'
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions items={[
          { id: 'edit', label: 'Editar', onSelect: () => { setEditing(row.original); setShowForm(true) } },
        ]} />
      ),
    },
  ]

  const employeeFormFields = [
    { type: 'text' as const,   id: 'first_name',       label: 'Nombre',              required: true },
    { type: 'text' as const,   id: 'last_name',        label: 'Apellido',            required: true },
    { type: 'text' as const,   id: 'cedula',           label: 'Cédula (V-XXXXXXXX)' },
    { type: 'select' as const, id: 'employee_type',    label: 'Tipo de Trabajador',  required: true,
      options: [
        { value: 'fixed', label: 'Fijo Mensual' },
        { value: 'jornalero', label: 'Jornalero (pago diario)' },
        { value: 'destajero', label: 'Destajero (por unidad)' },
      ]},
    { type: 'text' as const,   id: 'department',       label: 'Departamento' },
    { type: 'text' as const,   id: 'position',         label: 'Cargo' },
    { type: 'date' as const,   id: 'hire_date',        label: 'Fecha de Ingreso',    required: true },
    { type: 'text' as const,   id: 'salary_usd',       label: 'Salario Mensual (USD) — solo fijos' },
    { type: 'text' as const,   id: 'base_jornal_usd',  label: 'Jornal Diario (USD) — jornaleros' },
    { type: 'text' as const,   id: 'base_destajo_usd', label: 'Tarifa por Unidad (USD) — destajeros' },
    { type: 'text' as const,   id: 'bank_name',        label: 'Banco' },
    { type: 'text' as const,   id: 'bank_account',     label: 'Número de Cuenta' },
  ]

  const TYPE_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'fixed', label: 'Fijos' },
    { value: 'jornalero', label: 'Jornaleros' },
    { value: 'destajero', label: 'Destajeros' },
  ]

  return (
    <Page>
      <PageHeader
        title="Personal Agropecuario"
        description={`${fixedCount} fijo${fixedCount !== 1 ? 's' : ''} · ${jornaleroCount} jornalero${jornaleroCount !== 1 ? 's' : ''}/destajeros`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {TYPE_FILTERS.map(f => (
                <Button key={f.value} type="button" size="sm" variant={typeFilter === f.value ? 'default' : 'outline'} onClick={() => setType(f.value)}>{f.label}</Button>
              ))}
            </div>
            <Button type="button" onClick={() => { setEditing(null); setShowForm(true) }}>
              <Plus className="size-4 mr-2" /> Nuevo Personal
            </Button>
          </div>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">{editing ? `Editar — ${editing.first_name} ${editing.last_name}` : 'Nuevo Personal'}</h3>
            <CrudForm
              entityId="agri_hr.employee"
              apiPath="/api/agri-hr/employees"
              mode={editing ? 'edit' : 'create'}
              initial={editing ?? undefined}
              fields={employeeFormFields}
              groups={[
                { id: 'personal',  title: 'Datos Personales', fields: ['first_name', 'last_name', 'cedula', 'hire_date'] },
                { id: 'job',       title: 'Cargo y Tipo',     fields: ['employee_type', 'department', 'position'] },
                { id: 'pay',       title: 'Remuneración',     fields: ['salary_usd', 'base_jornal_usd', 'base_destajo_usd'] },
                { id: 'bank',      title: 'Datos Bancarios',  fields: ['bank_name', 'bank_account'] },
              ]}
              onSuccess={() => { flash(editing ? 'Personal actualizado' : 'Personal registrado', 'success'); setShowForm(false); setEditing(null); load() }}
            />
          </div>
        )}
        <DataTable
          entityId="agri_hr.employee"
          extensionTableId="agri-hr-employees-list"
          data={employees}
          columns={columns}
          isLoading={isLoading}
          emptyState='Sin personal registrado'
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
