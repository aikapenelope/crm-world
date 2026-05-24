'use client'

import * as React from 'react'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { TrendingUp, TrendingDown, Calculator } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

type VarRow = {
  id: string; order_number: string; product_code: string; product_name: string
  planned_quantity: string; actual_quantity: string; uom: string
  standard_cost_usd: string; actual_cost_usd: string; total_variance_usd: string
  price_variance_usd: string; quantity_variance_usd: string; labor_variance_usd: string
  status: string; calculated_at: string | null; bcv_rate_used: string | null
}

const STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'success'> = { pending: 'neutral', calculated: 'warning', approved: 'success' }
const STATUS_LABEL:   Record<string, string>   = { pending: 'Pendiente', calculated: 'Calculada', approved: 'Aprobada' }

function VarianceCell({ value, label }: { value: number; label: string }) {
  const isUnfav = value > 0
  return (
    <div>
      <div className={`text-sm font-semibold flex items-center gap-1 ${isUnfav ? 'text-status-error-text' : 'text-status-success-text'}`}>
        {isUnfav ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
        {value > 0 ? '+' : ''}USD {value.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export default function MfgCostsPage() {
  const { runMutation } = useGuardedMutation()
  const [variances, setVars]  = React.useState<VarRow[]>([])
  const [isLoading, setLoad]  = React.useState(true)
  const [statusFilter, setSF] = React.useState('calculated')
  const [completedOrders, setOrders] = React.useState<any[]>([])

  const load = React.useCallback(async () => {
    setLoad(true)
    const [varRes, ordRes] = await Promise.all([
      apiCall<{ items: VarRow[] }>(`/api/mfg-costs/cost-variances?pageSize=100${statusFilter ? `&status=${statusFilter}` : ''}`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/mfg-orders/production-orders?status=completed&pageSize=50', undefined, { fallback: { items: [] } }),
    ])
    if (varRes.ok) setVars(varRes.result?.items ?? [])
    if (ordRes.ok) setOrders((ordRes.result?.items ?? []).filter((o: any) => o.actual_quantity))
    setLoad(false)
  }, [statusFilter])

  React.useEffect(() => { load() }, [load])

  const handleCalculate = (orderId: string, orderNumber: string) => {
    runMutation({
      operation: 'update', context: { entityId: 'mfg_costs.variance', recordId: orderId },
      operation: async () => {
        const res = await apiCallOrThrow<any>(`/api/mfg-costs/calculate-variances?order_id=${orderId}`, { method: 'POST', body: '{}' })
        const d = res.result?.data
        flash(`Variaciones calculadas para ${orderNumber}: USD ${d?.total_variance_usd} (${d?.favorable ? 'favorable' : 'desfavorable'})`, d?.favorable ? 'success' : 'warning')
        load()
      },
    })
  }

  const handleApprove = (v: VarRow) => {
    runMutation({
      operation: 'update', context: { entityId: 'mfg_costs.variance', recordId: v.id },
      operation: async () => {
        await apiCallOrThrow('/api/mfg-costs/cost-variances', { method: 'PUT', body: JSON.stringify({ id: v.id, status: 'approved' }) })
        flash(`Variaciones de ${v.order_number} aprobadas`, 'success')
        load()
      },
    })
  }

  // Summary stats
  const totalUnfav = variances.filter((v) => Number(v.total_variance_usd) > 0).reduce((s, v) => s + Number(v.total_variance_usd), 0)
  const totalFav   = variances.filter((v) => Number(v.total_variance_usd) <= 0).reduce((s, v) => s + Number(v.total_variance_usd), 0)
  const ordersWithoutVariance = completedOrders.filter((o) => !variances.find((v) => v.order_number === o.order_number))

  const columns: ColumnDef<VarRow>[] = [
    { accessorKey: 'order_number', header: 'Orden', cell: ({ row }) => (
      <div><span className="font-mono font-semibold text-sm">{row.original.order_number}</span>
      <div className="text-xs text-muted-foreground">{row.original.product_code}</div></div>
    )},
    { id: 'quantities', header: 'Plan / Real', cell: ({ row }) => (
      <div className="text-sm">
        <span>{Number(row.original.planned_quantity).toFixed(2)}</span>
        <span className="text-muted-foreground mx-1">→</span>
        <span className="font-semibold">{Number(row.original.actual_quantity).toFixed(2)} {row.original.uom}</span>
      </div>
    )},
    { id: 'costs', header: 'Estándar / Real', cell: ({ row }) => (
      <div className="text-sm">
        <div className="text-muted-foreground">Est: USD {Number(row.original.standard_cost_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
        <div className="font-semibold">Real: USD {Number(row.original.actual_cost_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
      </div>
    )},
    { id: 'total_var', header: 'Variación Total', cell: ({ row }) => <VarianceCell value={Number(row.original.total_variance_usd)} label="Total" /> },
    { id: 'breakdown', header: 'Precio / Cantidad / MO', cell: ({ row }) => (
      <div className="text-xs space-y-0.5">
        <div className={Number(row.original.price_variance_usd) > 0 ? 'text-status-error-text' : 'text-status-success-text'}>Precio: {Number(row.original.price_variance_usd) > 0 ? '+' : ''}USD {Number(row.original.price_variance_usd).toFixed(2)}</div>
        <div className={Number(row.original.quantity_variance_usd) > 0 ? 'text-status-error-text' : 'text-status-success-text'}>Cantidad: {Number(row.original.quantity_variance_usd) > 0 ? '+' : ''}USD {Number(row.original.quantity_variance_usd).toFixed(2)}</div>
        <div className={Number(row.original.labor_variance_usd) > 0 ? 'text-status-error-text' : 'text-status-success-text'}>MO: {Number(row.original.labor_variance_usd) > 0 ? '+' : ''}USD {Number(row.original.labor_variance_usd).toFixed(2)}</div>
      </div>
    )},
    { id: 'bcv', header: 'BCV', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.bcv_rate_used ? `Bs ${Number(row.original.bcv_rate_used).toLocaleString('es-VE', { minimumFractionDigits: 2 })}/USD` : '—'}</span> },
    { accessorKey: 'status', header: 'Estado', cell: ({ row }) => <StatusBadge variant={STATUS_VARIANT[row.original.status] ?? 'neutral'} dot>{STATUS_LABEL[row.original.status] ?? row.original.status}</StatusBadge> },
    { id: 'actions', cell: ({ row }) => (
      <RowActions items={[
        ...(row.original.status === 'calculated' ? [{ id: 'approve', label: 'Aprobar variaciones', onSelect: () => handleApprove(row.original) }] : []),
      ]} />
    )},
  ]

  return (
    <Page>
      <PageHeader
        title="Costos de Producción — Análisis de Variaciones"
        description={`USD ${totalUnfav.toFixed(2)} desfavorable · USD ${Math.abs(totalFav).toFixed(2)} favorable en el período`}
        actions={
          <div className="flex gap-1">
            {(['calculated', 'pending', ''] as const).map((s) => (
              <Button key={s} type="button" size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setSF(s)}>
                {s === 'calculated' ? 'Calculadas' : s === 'pending' ? 'Pendientes' : 'Todas'}
              </Button>
            ))}
          </div>
        }
      />
      <PageBody>
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Variación desfavorable</div>
            <div className="text-xl font-bold text-status-error-text flex items-center gap-1"><TrendingUp className="size-4" /> USD {totalUnfav.toFixed(2)}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Variación favorable</div>
            <div className="text-xl font-bold text-status-success-text flex items-center gap-1"><TrendingDown className="size-4" /> USD {Math.abs(totalFav).toFixed(2)}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Órdenes sin calcular</div>
            <div className={`text-xl font-bold ${ordersWithoutVariance.length > 0 ? 'text-status-warning-text' : 'text-status-success-text'}`}>{ordersWithoutVariance.length}</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Neto del período</div>
            <div className={`text-xl font-bold ${(totalUnfav + totalFav) > 0 ? 'text-status-error-text' : 'text-status-success-text'}`}>USD {(totalUnfav + totalFav).toFixed(2)}</div>
          </div>
        </div>

        {/* Pending orders for calculation */}
        {ordersWithoutVariance.length > 0 && (
          <div className="mb-4 p-3 bg-muted/20 rounded-lg flex items-start gap-3">
            <Calculator className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Órdenes completadas sin variaciones calculadas</p>
              <div className="flex flex-wrap gap-2">
                {ordersWithoutVariance.slice(0, 10).map((o: any) => (
                  <Button key={o.id} type="button" size="sm" variant="outline" onClick={() => handleCalculate(o.id, o.order_number)}>
                    <Calculator className="size-3 mr-1" /> {o.order_number}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <DataTable entityId="mfg_costs.variance" extensionTableId="mfg-costs-variances" data={variances} columns={columns} isLoading={isLoading}
          emptyState='Sin variaciones calculadas'
          stickyActionsColumn />
      </PageBody>
    </Page>
  )
}
