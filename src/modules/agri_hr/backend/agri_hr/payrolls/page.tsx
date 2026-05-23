'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@open-mercato/ui/primitives/select'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { Plus, CheckCircle, DollarSign } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

// LOTTT minimum provision rates
const VACATION_RATE  = 15 / 365  // 0.04110
const BONUS_RATE     = 30 / 365  // 0.08219
const SEVERANCE_RATE = 15 / 365  // 0.04110

type Employee = { id: string; first_name: string; last_name: string; employee_type: string; base_jornal_usd: string | null; base_destajo_usd: string | null; destajo_unit: string | null }
type PayrollRow = {
  id: string; employee_id: string; period_start: string; period_end: string
  days_worked: number | null; units_worked: string | null; gross_usd: string
  vacation_provision_usd: string; bonus_provision_usd: string; severance_provision_usd: string
  total_provisions_usd: string; net_usd: string; status: string; payment_date: string | null
}

const STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'success'> = {
  draft: 'neutral', approved: 'warning', paid: 'success',
}
const STATUS_LABEL: Record<string, string> = { draft: 'Borrador', approved: 'Aprobada', paid: 'Pagada' }

export default function PayrollsPage() {
  const { runMutation } = useGuardedMutation()
  const [payrolls, setPayrolls]    = React.useState<PayrollRow[]>([])
  const [employees, setEmployees]  = React.useState<Employee[]>([])
  const [isLoading, setLoading]    = React.useState(true)
  const [showForm, setShowForm]    = React.useState(false)
  const [statusFilter, setFilter]  = React.useState('')

  // New payroll form state
  const [selectedEmpId, setEmpId] = React.useState('')
  const [periodStart, setPeriodStart] = React.useState('')
  const [periodEnd, setPeriodEnd]     = React.useState('')
  const [grossInput, setGrossInput]   = React.useState('')
  const [daysWorked, setDaysWorked]   = React.useState('')
  const [unitsWorked, setUnitsWorked] = React.useState('')
  const [submitting, setSubmitting]   = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ pageSize: '100' })
    if (statusFilter) params.set('status', statusFilter)
    const [payRes, empRes] = await Promise.all([
      apiCall<{ items: PayrollRow[] }>(`/api/agri-hr/jornalero-payrolls?${params}`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: Employee[] }>('/api/agri-hr/employees?pageSize=200&status=active', undefined, { fallback: { items: [] } }),
    ])
    if (payRes.ok) setPayrolls(payRes.result?.items ?? [])
    if (empRes.ok) setEmployees((empRes.result?.items ?? []).filter((e) => e.employee_type !== 'fixed'))
    setLoading(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  // Resolve selected employee
  const selectedEmp = employees.find((e) => e.id === selectedEmpId) ?? null

  // Auto-compute gross from days/units if employee rate is known
  React.useEffect(() => {
    if (!selectedEmp) return
    if (selectedEmp.employee_type === 'jornalero' && daysWorked !== '' && selectedEmp.base_jornal_usd) {
      const computed = Number(daysWorked) * Number(selectedEmp.base_jornal_usd)
      setGrossInput(computed.toFixed(2))
    } else if (selectedEmp.employee_type === 'destajero' && unitsWorked !== '' && selectedEmp.base_destajo_usd) {
      const computed = Number(unitsWorked) * Number(selectedEmp.base_destajo_usd)
      setGrossInput(computed.toFixed(2))
    }
  }, [selectedEmp, daysWorked, unitsWorked])

  // Provision preview
  const gross = Number(grossInput || 0)
  const preview = gross > 0 ? {
    vacation:  (gross * VACATION_RATE).toFixed(4),
    bonus:     (gross * BONUS_RATE).toFixed(4),
    severance: (gross * SEVERANCE_RATE).toFixed(4),
    total:     (gross * (VACATION_RATE + BONUS_RATE + SEVERANCE_RATE)).toFixed(4),
  } : null

  const handleSubmit = async () => {
    if (!selectedEmpId || !periodStart || !periodEnd || grossInput === '') {
      flash('Completa empleado, período y monto bruto', 'warning')
      return
    }
    setSubmitting(true)
    try {
      await apiCallOrThrow('/api/agri-hr/jornalero-payrolls', {
        method: 'POST',
        body: JSON.stringify({
          employee_id:  selectedEmpId,
          period_start: periodStart,
          period_end:   periodEnd,
          days_worked:  daysWorked !== '' ? Number(daysWorked) : null,
          units_worked: unitsWorked !== '' ? unitsWorked : null,
          gross_usd:    grossInput,
          net_usd:      grossInput, // Net = Gross (provisiones son pasivos contables, no deducciones)
          status: 'draft',
        }),
      })
      flash('Nómina registrada con provisiones LOTTT calculadas automáticamente', 'success')
      setShowForm(false)
      setEmpId(''); setPeriodStart(''); setPeriodEnd(''); setGrossInput(''); setDaysWorked(''); setUnitsWorked('')
      load()
    } catch {
      flash('Error al registrar nómina', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprove = (p: PayrollRow) => {
    runMutation({
      operation: 'update',
      context: { entityId: 'agri_hr.payroll', recordId: p.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/agri-hr/jornalero-payrolls', {
          method: 'PUT',
          body: JSON.stringify({ id: p.id, status: 'approved' }),
        })
        flash('Nómina aprobada', 'success')
        load()
      },
    })
  }

  const handlePay = (p: PayrollRow) => {
    runMutation({
      operation: 'update',
      context: { entityId: 'agri_hr.payroll', recordId: p.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/agri-hr/jornalero-payrolls', {
          method: 'PUT',
          body: JSON.stringify({ id: p.id, status: 'paid', payment_date: new Date().toISOString().split('T')[0] }),
        })
        flash('Pago registrado', 'success')
        load()
      },
    })
  }

  // Build employee name map for display
  const empMap = new Map<string, Employee>(employees.map((e) => [e.id, e]))

  const pendingApproval = payrolls.filter((p) => p.status === 'draft').length
  const pendingPayment  = payrolls.filter((p) => p.status === 'approved').length
  const totalToPay      = payrolls.filter((p) => p.status === 'approved').reduce((s, p) => s + Number(p.net_usd), 0)

  const columns: ColumnDef<PayrollRow>[] = [
    {
      id: 'employee',
      header: 'Trabajador',
      cell: ({ row }) => {
        const emp = empMap.get((row.original as PayrollRow).employee_id)
        return emp
          ? <div><span className="font-semibold">{emp.first_name} {emp.last_name}</span><div className="text-xs text-muted-foreground capitalize">{emp.employee_type}</div></div>
          : <span className="text-muted-foreground text-xs">—</span>
      },
    },
    {
      id: 'period',
      header: 'Período',
      cell: ({ row }) => {
        const r = row.original as PayrollRow
        return `${new Date(r.period_start).toLocaleDateString('es-VE')} → ${new Date(r.period_end).toLocaleDateString('es-VE')}`
      },
    },
    {
      id: 'work',
      header: 'Trabajo',
      cell: ({ row }) => {
        const r = row.original as PayrollRow
        if (r.days_worked) return `${r.days_worked} días`
        if (r.units_worked) return `${r.units_worked} unidades`
        return '—'
      },
    },
    {
      accessorKey: 'gross_usd',
      header: 'Bruto',
      cell: ({ row }) => <span className="font-semibold">USD {(row.original as PayrollRow).gross_usd}</span>,
    },
    {
      accessorKey: 'total_provisions_usd',
      header: 'Provisiones LOTTT',
      cell: ({ row }) => (
        <div>
          <span className="text-sm">USD {Number((row.original as PayrollRow).total_provisions_usd).toFixed(2)}</span>
          <div className="text-xs text-muted-foreground">≈ {(Number((row.original as PayrollRow).total_provisions_usd) / Number((row.original as PayrollRow).gross_usd) * 100).toFixed(1)}% del bruto</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => <StatusBadge variant={STATUS_VARIANT[(row.original as PayrollRow).status] ?? 'neutral'} dot>{STATUS_LABEL[(row.original as PayrollRow).status] ?? (row.original as PayrollRow).status}</StatusBadge>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const r = row.original as PayrollRow
        return (
          <div className="flex gap-1">
            {r.status === 'draft' && (
              <Button type="button" size="sm" onClick={() => handleApprove(r)}>
                <CheckCircle className="size-3 mr-1" /> Aprobar
              </Button>
            )}
            {r.status === 'approved' && (
              <Button type="button" size="sm" variant="outline" onClick={() => handlePay(r)}>
                <DollarSign className="size-3 mr-1" /> Pagar
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const FILTERS = [
    { value: '', label: 'Todas' },
    { value: 'draft', label: 'Borrador' },
    { value: 'approved', label: 'Aprobadas' },
    { value: 'paid', label: 'Pagadas' },
  ]

  return (
    <Page>
      <PageHeader
        title="Nóminas — Jornaleros y Destajeros"
        description={[
          pendingApproval > 0 && `${pendingApproval} pendiente(s) de aprobación`,
          pendingPayment > 0 && `${pendingPayment} por pagar (USD ${totalToPay.toFixed(2)})`,
        ].filter(Boolean).join(' · ') || undefined}
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
              <Plus className="size-4 mr-2" /> Nueva Nómina
            </Button>
          </div>
        }
      />
      <PageBody>
        {/* LOTTT info */}
        <div className="mb-4 p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground">
          <strong>Provisiones LOTTT automáticas:</strong> Vacaciones 15d/año · Utilidades 30d/año · Prestaciones sociales 15d/año (años 1-5).
          Las provisiones son pasivos contables — el trabajador cobra el bruto completo, pero la empresa reserva el pasivo.
        </div>

        {/* Create form */}
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Nueva Nómina de Jornalero / Destajero</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Empleado */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Trabajador *</label>
                <Select value={selectedEmpId} onValueChange={setEmpId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.first_name} {e.last_name} ({e.employee_type === 'jornalero' ? `USD ${e.base_jornal_usd}/día` : `USD ${e.base_destajo_usd}/${e.destajo_unit ?? 'unidad'}`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Período */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Inicio del período *</label>
                <Input type="date" value={periodStart} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodStart(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Fin del período *</label>
                <Input type="date" value={periodEnd} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodEnd(e.target.value)} />
              </div>

              {/* Días/unidades */}
              {selectedEmp?.employee_type === 'jornalero' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Días trabajados
                    {selectedEmp.base_jornal_usd && <span className="text-muted-foreground ml-1">(@ USD {selectedEmp.base_jornal_usd}/día)</span>}
                  </label>
                  <Input type="number" min="0" value={daysWorked} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDaysWorked(e.target.value)} placeholder="15" />
                </div>
              )}
              {selectedEmp?.employee_type === 'destajero' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Unidades trabajadas
                    {selectedEmp.base_destajo_usd && <span className="text-muted-foreground ml-1">(@ USD {selectedEmp.base_destajo_usd}/{selectedEmp.destajo_unit ?? 'unidad'})</span>}
                  </label>
                  <Input type="number" min="0" step="0.001" value={unitsWorked} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitsWorked(e.target.value)} placeholder="50" />
                </div>
              )}

              {/* Bruto */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Pago bruto (USD) *</label>
                <Input type="number" min="0" step="0.01" value={grossInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGrossInput(e.target.value)} placeholder="0.00" />
              </div>
            </div>

            {/* Provision preview */}
            {preview && (
              <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                <div className="text-xs font-semibold text-muted-foreground mb-2">Provisiones LOTTT calculadas automáticamente:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-background rounded-md p-2">
                    <div className="text-xs text-muted-foreground">Vacaciones (15d/año)</div>
                    <div className="font-semibold">USD {preview.vacation}</div>
                  </div>
                  <div className="bg-background rounded-md p-2">
                    <div className="text-xs text-muted-foreground">Utilidades (30d/año)</div>
                    <div className="font-semibold">USD {preview.bonus}</div>
                  </div>
                  <div className="bg-background rounded-md p-2">
                    <div className="text-xs text-muted-foreground">Prestaciones (15d/año)</div>
                    <div className="font-semibold">USD {preview.severance}</div>
                  </div>
                  <div className="bg-primary text-primary-foreground rounded-md p-2">
                    <div className="text-xs opacity-80">Total provisión</div>
                    <div className="font-bold">USD {preview.total}</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  El trabajador cobra USD {grossInput} (bruto completo). Las provisiones USD {preview.total} se registran como pasivo de la empresa.
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Registrando...' : 'Registrar nómina'}
              </Button>
            </div>
          </div>
        )}

        <DataTable
          entityId="agri_hr.payroll"
          extensionTableId="agri-hr-payrolls-list"
          data={payrolls}
          columns={columns}
          isLoading={isLoading}
          emptyState={{
            title: 'Sin nóminas registradas',
            description: 'Registra la primera nómina de jornaleros o destajeros para este período.',
          }}
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
