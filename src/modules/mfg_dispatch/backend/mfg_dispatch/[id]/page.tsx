'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { ArrowLeft, Plus, Truck, FileText, CheckCircle } from 'lucide-react'

type PageState = 'loading' | 'notFound' | 'ready'
const SO_STATUS_LABEL: Record<string, string> = { draft: 'Borrador', confirmed: 'Confirmado', in_preparation: 'En preparación', dispatched: 'Despachado', invoiced: 'Facturado', cancelled: 'Cancelado' }
const SO_STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = { draft: 'neutral', confirmed: 'info', in_preparation: 'warning', dispatched: 'warning', invoiced: 'success' }
const DISP_STATUS_LABEL: Record<string, string> = { draft: 'Borrador', loading: 'Cargando', in_transit: 'En tránsito', delivered: 'Entregado', returned: 'Devuelto' }
const DISP_STATUS_VARIANT: Record<string, 'neutral' | 'warning' | 'success'> = { draft: 'neutral', loading: 'warning', in_transit: 'warning', delivered: 'success', returned: 'neutral' }

export default function DispatchDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { runMutation } = useGuardedMutation()

  const [state, setState]     = React.useState<PageState>('loading')
  const [so, setSo]           = React.useState<any>(null)
  const [lines, setLines]     = React.useState<any[]>([])
  const [dispatches, setDisps] = React.useState<any[]>([])
  const [coas, setCoas]       = React.useState<any[]>([])
  const [showDispForm, setDF] = React.useState(false)
  const [showLineForm, setLF] = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const [soRes, linesRes, dispRes, coaRes] = await Promise.all([
      apiCall<{ items: any[] }>(`/api/mfg-dispatch/sale-orders?id=${params.id}`),
      apiCall<{ items: any[] }>(`/api/mfg-dispatch/sale-order-lines?sale_order_id=${params.id}&pageSize=50`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>(`/api/mfg-dispatch/dispatch-orders?sale_order_id=${params.id}&pageSize=10`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>('/api/mfg-dispatch/coa?pageSize=50', undefined, { fallback: { items: [] } }),
    ])
    const s = (soRes.result?.items ?? [])[0] ?? null
    if (!s) { setState('notFound'); return }
    setSo(s)
    setLines(linesRes.result?.items ?? [])
    setDisps(dispRes.result?.items ?? [])
    setCoas(coaRes.result?.items ?? [])
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  const handleConfirmDelivery = (disp: any) => {
    runMutation({
      operation: 'update', context: { entityId: 'mfg_dispatch.dispatch', recordId: disp.id },
      mutationPayload: async () => {
        await apiCallOrThrow('/api/mfg-dispatch/dispatch-orders', { method: 'PUT', body: JSON.stringify({ id: disp.id, status: 'delivered', delivery_date: new Date().toISOString().split('T')[0], customer_signature: true }) })
        await apiCallOrThrow('/api/mfg-dispatch/sale-orders', { method: 'PUT', body: JSON.stringify({ id: params.id, status: 'invoiced', actual_dispatch_date: new Date().toISOString().split('T')[0] }) })
        flash('Entrega confirmada — pedido marcado como facturado', 'success')
        load()
      },
    })
  }

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando pedido..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-dispatch')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Despacho
      </Button>
      <ErrorMessage message="Pedido no encontrado." />
    </PageBody></Page>
  )

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-dispatch')} className="mb-6">
          <ArrowLeft className="mr-2 size-4" /> Pedidos
        </Button>

        <div className="max-w-3xl space-y-4">
          {/* Order header */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold font-mono">{so.order_number}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {so.customer_name}{so.customer_rif && ` · RIF: ${so.customer_rif}`}
                </p>
              </div>
              <StatusBadge variant={SO_STATUS_VARIANT[so.status] ?? 'neutral'} dot>
                {SO_STATUS_LABEL[so.status] ?? so.status}
              </StatusBadge>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Subtotal</p>
                <p className="font-semibold">USD {Number(so.subtotal_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 bg-muted/20 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">IVA {so.iva_pct}%</p>
                <p className="font-semibold">USD {Number(so.iva_amount_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">USD {Number(so.total_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {so.payment_method && <StatusBadge variant="neutral">{so.payment_method}</StatusBadge>}
              {so.requires_coa && <StatusBadge variant="info">CoA requerido</StatusBadge>}
              {so.requires_temperature_control && <StatusBadge variant="warning">🌡 Control de temperatura</StatusBadge>}
            </div>
          </div>

          {/* Lines */}
          <div className="border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Líneas del Pedido ({lines.length})</h3>
              <Button type="button" size="sm" variant="outline" onClick={() => setLF(!showLineForm)}>
                <Plus className="size-4 mr-1" /> Agregar línea
              </Button>
            </div>
            {showLineForm && (
              <div className="mb-4 border border-border rounded-lg p-3 bg-background">
                <CrudForm entityId="mfg_dispatch.sale_order_line" apiPath="/api/mfg-dispatch/sale-order-lines" mode="create"
                  initial={{ sale_order_id: params.id, line_number: lines.length + 1 }}
                  fields={[
                    { type: 'text' as const, name: 'product_code',   label: 'Código producto', required: true },
                    { type: 'text' as const, name: 'product_name',   label: 'Nombre producto', required: true },
                    { type: 'text' as const, name: 'quantity',       label: 'Cantidad', required: true },
                    { type: 'text' as const, name: 'uom',            label: 'Unidad', required: true },
                    { type: 'text' as const, name: 'unit_price_usd', label: 'Precio unitario (USD)', required: true },
                    { type: 'text' as const, name: 'total_price_usd', label: 'Total (USD)', required: true },
                    { type: 'text' as const, name: 'lot_number',     label: 'Número de lote de PT' },
                  ]}
                  onSubmit={async (v) => {
                    await apiCallOrThrow('/api/mfg-dispatch/sale-order-lines', { method: 'POST', body: JSON.stringify({ ...v, sale_order_id: params.id }) })
                    flash('Línea agregada', 'success'); setLF(false); load()
                  }}
                />
              </div>
            )}
            {lines.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                <div>
                  <span className="font-mono font-medium">{l.product_code}</span>
                  <span className="text-muted-foreground ml-2">{l.product_name}</span>
                  {l.lot_number && <span className="text-xs text-muted-foreground ml-2">lote: {l.lot_number}</span>}
                </div>
                <div className="text-right">
                  <span className="font-semibold">{l.quantity} {l.uom}</span>
                  <span className="text-muted-foreground ml-2">@ USD {Number(l.unit_price_usd).toFixed(4)}</span>
                  <span className="font-bold ml-2">= USD {Number(l.total_price_usd).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CoAs */}
          {coas.filter((c: any) => lines.some((l: any) => l.lot_id === c.lot_id)).length > 0 && (
            <div className="border border-border rounded-xl p-4 bg-card">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><FileText className="size-4" /> Certificados de Análisis</h3>
              {coas.filter((c: any) => lines.some((l: any) => l.lot_id === c.lot_id)).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                  <div>
                    <span className="font-mono font-medium">{c.coa_number}</span>
                    <span className="text-muted-foreground ml-2">lote: {c.lot_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.is_released ? <StatusBadge variant="success">Liberado</StatusBadge> : <StatusBadge variant="warning">Pendiente</StatusBadge>}
                    {c.approved_by && <span className="text-xs text-muted-foreground">{c.approved_by}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dispatch orders */}
          <div className="border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Truck className="size-4" /> Guías de Despacho ({dispatches.length})</h3>
              {['confirmed', 'in_preparation'].includes(so.status) && (
                <Button type="button" size="sm" variant="outline" onClick={() => setDF(!showDispForm)}>
                  <Plus className="size-4 mr-1" /> Emitir guía
                </Button>
              )}
            </div>
            {showDispForm && (
              <div className="mb-4 border border-border rounded-lg p-3 bg-background">
                <CrudForm entityId="mfg_dispatch.dispatch_order" apiPath="/api/mfg-dispatch/dispatch-orders" mode="create"
                  initial={{ sale_order_id: params.id, sale_order_number: so.order_number, customer_name: so.customer_name, dispatch_date: new Date().toISOString().split('T')[0], requires_temperature_control: so.requires_temperature_control }}
                  fields={[
                    { type: 'text' as const,   name: 'dispatch_number',  label: 'Número guía (DISP-2026-XXX)', required: true },
                    { type: 'text' as const,   name: 'carrier_name',     label: 'Transporte / Empresa de carga' },
                    { type: 'text' as const,   name: 'vehicle_plate',    label: 'Placa del vehículo (AA-123-BC)' },
                    { type: 'text' as const,   name: 'driver_name',      label: 'Nombre del conductor' },
                    { type: 'date' as const,   name: 'dispatch_date',    label: 'Fecha de despacho' },
                    { type: 'text' as const,   name: 'temperature_range', label: 'Rango de temperatura (si aplica)' },
                  ]}
                  onSuccess={() => { flash('Guía de despacho emitida', 'success'); setDF(false); load() }}
                />
              </div>
            )}
            {dispatches.length > 0 ? (
              dispatches.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div>
                    <span className="font-mono font-semibold text-sm">{d.dispatch_number}</span>
                    <div className="text-xs text-muted-foreground">
                      {d.carrier_name && `${d.carrier_name} · `}
                      {d.vehicle_plate && `${d.vehicle_plate} · `}
                      {d.driver_name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={DISP_STATUS_VARIANT[d.status] ?? 'neutral'} dot>
                      {DISP_STATUS_LABEL[d.status] ?? d.status}
                    </StatusBadge>
                    {d.status === 'in_transit' && (
                      <Button type="button" size="sm" onClick={() => handleConfirmDelivery(d)}>
                        <CheckCircle className="size-3 mr-1" /> Confirmar entrega
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sin guías de despacho emitidas.</p>
            )}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
