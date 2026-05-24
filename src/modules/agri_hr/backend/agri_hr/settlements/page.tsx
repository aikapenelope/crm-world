'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { Plus, CheckCircle } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type SettlementRow = {
  id: string; cycle_end_date: string; actual_fca: string; actual_avg_weight_kg: string
  actual_mortality_pct: string; target_fca: string; base_payment_usd: string
  fca_bonus_usd: string; fca_penalty_usd: string; total_payment_usd: string; status: string
}

const STATUS_VARIANT: Record<string, 'info' | 'success' | 'neutral'> = {
  calculated: 'info', approved: 'success', paid: 'neutral',
}
const STATUS_LABEL: Record<string, string> = { calculated: 'Calculada', approved: 'Aprobada', paid: 'Pagada' }

export default function SettlementsPage() {
  const router = useRouter()
  const { runMutation } = useGuardedMutation({ contextId: 'agri_hr.page' })
  const [settlements, setSettlements] = React.useState<SettlementRow[]>([])
  const [isLoading, setLoading]       = React.useState(true)
  const [showForm, setShowForm]       = React.useState(false)
  const [flockOptions, setFlocks]     = React.useState<{ value: string; label: string }[]>([])
  const [unitOptions, setUnits]       = React.useState<{ value: string; label: string }[]>([])

  const load = React.useCallback(async () => {
    setLoading(true)
    const [settleRes, flockRes, unitRes] = await Promise.all([
      apiCall<{ items: SettlementRow[] }>('/api/agri-hr/producer-settlements?pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/agri-units/flocks?pageSize=100', undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/agri-units/farm-units?pageSize=100&ownership_type=integrated', undefined, { fallback: { items: [] } }),
    ])
    if (settleRes.ok) setSettlements(settleRes.result?.items ?? [])
    if (flockRes.ok)  setFlocks((flockRes.result?.items ?? []).map((f: any) => ({ value: f.id, label: f.flock_number })))
    if (unitRes.ok)   setUnits((unitRes.result?.items ?? []).map((u: any) => ({ value: u.id, label: u.name })))
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleApprove = (s: SettlementRow) => {
    runMutation({
      context: { entityId: 'agri_hr.settlement', recordId: s.id },
      operation: async () => {
        await apiCallOrThrow('/api/agri-hr/producer-settlements', {
          method: 'PUT',
          body: JSON.stringify({ id: s.id, status: 'approved', approved_at: new Date().toISOString() }),
        })
        flash('Liquidación aprobada', 'success')
        load()
      },
    })
  }

  const handlePay = (s: SettlementRow) => {
    runMutation({
      context: { entityId: 'agri_hr.settlement', recordId: s.id },
      operation: async () => {
        await apiCallOrThrow('/api/agri-hr/producer-settlements', {
          method: 'PUT',
          body: JSON.stringify({ id: s.id, status: 'paid', payment_date: new Date().toISOString().split('T')[0] }),
        })
        flash('Pago registrado', 'success')
        load()
      },
    })
  }

  const pendingApproval = settlements.filter(s => s.status === 'calculated').length
  const totalPending    = settlements.filter(s => s.status === 'approved').reduce((sum, s) => sum + Number(s.total_payment_usd), 0)

  const columns: ColumnDef<SettlementRow>[] = [
    { accessorKey: 'cycle_end_date', header: 'Fin de Ciclo', cell: ({ row }) => new Date(row.original.cycle_end_date).toLocaleDateString('es-VE') },
    { accessorKey: 'actual_fca', header: 'FCA Real', cell: ({ row }) => {
      const fca    = Number(row.original.actual_fca)
      const target = Number(row.original.target_fca)
      return <span className={fca <= target ? 'text-status-success-text font-semibold' : 'text-status-warning-text font-semibold'}>{row.original.actual_fca}</span>
    }},
    { accessorKey: 'actual_avg_weight_kg', header: 'Peso Prom.', cell: ({ row }) => `${row.original.actual_avg_weight_kg} kg` },
    { accessorKey: 'actual_mortality_pct', header: 'Mortalidad', cell: ({ row }) => `${row.original.actual_mortality_pct}%` },
    { accessorKey: 'base_payment_usd', header: 'Base (USD)', cell: ({ row }) => `USD ${row.original.base_payment_usd}` },
    { accessorKey: 'total_payment_usd', header: 'Total (USD)', cell: ({ row }) => <span className="font-bold">USD {row.original.total_payment_usd}</span> },
    {
      accessorKey: 'status', header: 'Estado',
      cell: ({ row }) => <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>{STATUS_LABEL[row.original.status] ?? row.original.status}</StatusBadge>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => router.push(`/backend/agri-hr/settlements/${row.original.id}`)}>
            Ver / Workflow
          </Button>
          {row.original.status === 'calculated' && (
            <Button type="button" size="sm" onClick={() => handleApprove(row.original)}>
              <CheckCircle className="size-3 mr-1" /> Aprobar
            </Button>
          )}
          {row.original.status === 'approved' && (
            <Button type="button" size="sm" variant="outline" onClick={() => handlePay(row.original)}>
              Registrar Pago
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Liquidaciones de Productores"
        description={[
          pendingApproval > 0 && `${pendingApproval} pendiente(s) de aprobación`,
          totalPending > 0 && `USD ${totalPending.toFixed(2)} por pagar`,
        ].filter(Boolean).join(' · ') || undefined}
        actions={
          <Button type="button" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4 mr-2" /> Nueva Liquidación
          </Button>
        }
      />
      <PageBody>
        {showForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Calcular Liquidación de Productor Integrado</h3>
            <CrudForm{...({} as any)}
              entityId="agri_hr.settlement"
              apiPath="/api/agri-hr/producer-settlements"
              mode="create"
              fields={[
                { type: 'select' as const, id: 'flock_id',             label: 'Lote de Aves',            required: true, options: flockOptions },
                { type: 'select' as const, id: 'farm_unit_id',         label: 'Galpón (Productor)',       required: true, options: unitOptions },
                { type: 'text' as const,   id: 'producer_id',          label: 'ID del Productor (Customer)', required: true },
                { type: 'date' as const,   id: 'cycle_start_date',     label: 'Inicio del Ciclo',         required: true },
                { type: 'date' as const,   id: 'cycle_end_date',       label: 'Fin del Ciclo',            required: true },
                { type: 'number' as const, id: 'initial_birds',        label: 'Aves Iniciales',           required: true },
                { type: 'number' as const, id: 'final_birds',          label: 'Aves Finales',             required: true },
                { type: 'text' as const,   id: 'actual_fca',           label: 'FCA Real',                 required: true },
                { type: 'text' as const,   id: 'actual_avg_weight_kg', label: 'Peso Promedio Real (kg)',  required: true },
                { type: 'text' as const,   id: 'actual_mortality_pct', label: 'Mortalidad Real (%)',      required: true },
                { type: 'text' as const,   id: 'target_fca',           label: 'FCA Objetivo (Contrato)',  required: true },
                { type: 'text' as const,   id: 'target_weight_kg',     label: 'Peso Objetivo (Contrato, kg)', required: true },
                { type: 'text' as const,   id: 'price_per_kg_usd',     label: 'Precio Base (USD/kg)',     required: true },
                { type: 'text' as const,   id: 'base_payment_usd',     label: 'Pago Base Calculado (USD)', required: true },
                { type: 'text' as const,   id: 'fca_bonus_usd',        label: 'Bonus FCA (USD)' },
                { type: 'text' as const,   id: 'weight_bonus_usd',     label: 'Bonus Peso (USD)' },
                { type: 'text' as const,   id: 'fca_penalty_usd',      label: 'Penalización FCA (USD)' },
                { type: 'text' as const,   id: 'total_payment_usd',    label: 'Total a Pagar (USD)',      required: true },
                { type: 'textarea' as const, id: 'notes',              label: 'Observaciones del Técnico' },
              ]}
              groups={[
                { id: 'cycle',    title: 'Ciclo',         fields: ['flock_id', 'farm_unit_id', 'producer_id', 'cycle_start_date', 'cycle_end_date', 'initial_birds', 'final_birds'] },
                { id: 'results',  title: 'Resultados',    fields: ['actual_fca', 'actual_avg_weight_kg', 'actual_mortality_pct'] },
                { id: 'contract', title: 'Contrato',      fields: ['target_fca', 'target_weight_kg', 'price_per_kg_usd'] },
                { id: 'payment',  title: 'Liquidación',   fields: ['base_payment_usd', 'fca_bonus_usd', 'weight_bonus_usd', 'fca_penalty_usd', 'total_payment_usd', 'notes'] },
              ]}
              onSuccess={() => { flash('Liquidación calculada', 'success'); setShowForm(false); load() }}
            />
          </div>
        )}

        <DataTable
          entityId="agri_hr.settlement"
          data={settlements}
          columns={columns}
          isLoading={isLoading}
          emptyState="Sin liquidaciones registradas"
          stickyActionsColumn
        />
      </PageBody>
    </Page>
  )
}
