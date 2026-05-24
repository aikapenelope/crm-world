'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody, PageHeader } from '@open-mercato/ui/backend/Page'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { ArrowLeft, Truck, FileText } from 'lucide-react'

type PageState = 'loading' | 'notFound' | 'ready'

const STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', confirmed: 'info', partially_dispatched: 'warning',
  fully_dispatched: 'info', invoiced: 'warning', paid: 'success', cancelled: 'error',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', confirmed: 'Confirmada', fully_dispatched: 'Despachada',
  invoiced: 'Facturada', paid: 'Pagada', cancelled: 'Cancelada',
}

export default function SaleOrderDetailPage() {
  const params  = useParams<{ id: string }>()
  const router  = useRouter()
  const orderId = params.id

  const [state, setState]         = React.useState<PageState>('loading')
  const [order, setOrder]         = React.useState<any>(null)
  const [dispatches, setDisp]     = React.useState<any[]>([])
  const [invoices, setInvoices]   = React.useState<any[]>([])
  const [showDispForm, setDispForm] = React.useState(false)
  const [showInvForm, setInvForm]   = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const [orderRes, dispRes, invRes] = await Promise.all([
      apiCall<{ items: any[] }>(`/api/agri-sales/sale-orders?id=${orderId}`),
      apiCall<{ items: any[] }>(`/api/agri-sales/sale-dispatches?sale_order_id=${orderId}&pageSize=20`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: any[] }>(`/api/agri-sales/sale-invoices?sale_order_id=${orderId}&pageSize=20`, undefined, { fallback: { items: [] } }),
    ])
    const o = (orderRes.result?.items ?? [])[0] ?? null
    if (!o) { setState('notFound'); return }
    setOrder(o)
    setDisp(dispRes.result?.items ?? [])
    setInvoices(invRes.result?.items ?? [])
    setState('ready')
  }, [orderId])

  React.useEffect(() => { load() }, [load])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando orden..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-sales')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Órdenes
      </Button>
      <ErrorMessage label="Orden de venta no encontrada." />
    </PageBody></Page>
  )

  const totalDispatched = (dispatches as any[]).reduce((s, d) => s + Number((d as any).total_weight_kg ?? 0), 0)
  const totalInvoiced   = (invoices as any[]).reduce((s, i) => s + Number((i as any).total_usd ?? 0), 0)
  const totalPaid       = (invoices as any[]).reduce((s, i) => s + Number((i as any).paid_amount_usd ?? 0), 0)

  return (
    <Page>
      <PageHeader
        title={order.order_number}
        description={`USD ${order.total_usd} · ${new Date(order.order_date).toLocaleDateString('es-VE')}`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/agri-sales')}>
              <ArrowLeft className="mr-2 size-4" /> Órdenes
            </Button>
            <StatusBadge variant={STATUS_VARIANT[order.status] ?? 'neutral'} dot>
              {STATUS_LABEL[order.status] ?? order.status}
            </StatusBadge>
            {['confirmed', 'partially_dispatched'].includes(order.status) && (
              <Button type="button" variant="outline" onClick={() => setDispForm(!showDispForm)}>
                <Truck className="size-4 mr-2" /> Registrar Despacho
              </Button>
            )}
            {['fully_dispatched', 'partially_dispatched'].includes(order.status) && (
              <Button type="button" onClick={() => setInvForm(!showInvForm)}>
                <FileText className="size-4 mr-2" /> Generar Factura
              </Button>
            )}
          </div>
        }
      />
      <PageBody>
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total orden', value: `USD ${order.total_usd}` },
            { label: 'Despachado (kg)', value: `${totalDispatched.toFixed(2)} kg` },
            { label: 'Facturado', value: `USD ${totalInvoiced.toFixed(2)}` },
            { label: 'Cobrado', value: `USD ${totalPaid.toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-border rounded-lg p-4">
              <div className="text-xs text-muted-foreground mb-1">{label}</div>
              <div className="text-xl font-bold">{value}</div>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Productos en la Orden</h3>
          <div className="space-y-2">
            {((order.items ?? []) as any[]).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                <div>
                  <span className="font-semibold">{item.product_name}</span>
                  {item.lot_number && <span className="text-muted-foreground ml-2 font-mono text-xs">{item.lot_number}</span>}
                </div>
                <div className="text-right">
                  <span className="font-semibold">{item.quantity_kg} kg</span>
                  <span className="text-muted-foreground ml-2">@ USD {item.unit_price_usd}/kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch form */}
        {showDispForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Registrar Guía de Despacho</h3>
            <CrudForm{...({} as any)}
              entityId="agri_sales.dispatch"
              mode="create"
              fields={[
                { type: 'text' as const,    id: 'dispatch_number',  label: 'N° Guía (GD-2026-XXX)', required: true },
                { type: 'date' as const,    id: 'dispatch_date',    label: 'Fecha de Despacho',     required: true },
                { type: 'text' as const,    id: 'vehicle_plate',    label: 'Placa del Vehículo' },
                { type: 'text' as const,    id: 'driver_name',      label: 'Nombre del Chofer' },
                { type: 'text' as const,    id: 'loading_temp_c',   label: 'Temp. de Carga (°C)' },
                { type: 'text' as const,    id: 'total_weight_kg',  label: 'Peso Total (kg)', required: true },
                { type: 'textarea' as const, id: 'notes',           label: 'Observaciones' },
              ]}
              groups={[
                { id: 'dispatch', title: 'Despacho', fields: ['dispatch_number', 'dispatch_date', 'vehicle_plate', 'driver_name', 'loading_temp_c', 'total_weight_kg'] },
                { id: 'notes',    title: 'Notas',    fields: ['notes'] },
              ]}
              onSubmit={async (values) => {
                await apiCallOrThrow('/api/agri-sales/sale-dispatches', {
                  method: 'POST',
                  body: JSON.stringify({ ...values, sale_order_id: orderId, items: order.items ?? [] }),
                })
                flash('Guía de despacho registrada', 'success')
                setDispForm(false)
                load()
              }}
            />
          </div>
        )}

        {/* Invoice form */}
        {showInvForm && (
          <div className="mb-6 border border-border rounded-lg p-4 bg-background">
            <h3 className="text-sm font-semibold mb-4">Generar Factura</h3>
            <CrudForm{...({} as any)}
              entityId="agri_sales.invoice"
              mode="create"
              fields={[
                { type: 'text' as const,  id: 'invoice_number',  label: 'N° Factura (FAC-2026-XXXX)', required: true },
                { type: 'text' as const,  id: 'control_number',  label: 'N° Control SENIAT' },
                { type: 'date' as const,  id: 'issue_date',      label: 'Fecha de Emisión',           required: true },
                { type: 'date' as const,  id: 'due_date',        label: 'Fecha de Vencimiento',       required: true },
                { type: 'text' as const,  id: 'subtotal_usd',    label: 'Subtotal (USD)',              required: true },
                { type: 'text' as const,  id: 'total_usd',       label: 'Total (USD)',                 required: true },
                { type: 'text' as const,  id: 'iva_amount_ves',  label: 'IVA (VES)' },
                { type: 'text' as const,  id: 'bcv_rate',        label: 'Tasa BCV del día' },
                { type: 'text' as const,  id: 'igtf_amount_usd', label: 'IGTF en USD (3% si pago en divisa)' },
              ]}
              groups={[
                { id: 'invoice', title: 'Factura',    fields: ['invoice_number', 'control_number', 'issue_date', 'due_date'] },
                { id: 'amounts', title: 'Montos',     fields: ['subtotal_usd', 'total_usd', 'iva_amount_ves', 'bcv_rate', 'igtf_amount_usd'] },
              ]}
              onSubmit={async (values) => {
                await apiCallOrThrow('/api/agri-sales/sale-invoices', {
                  method: 'POST',
                  body: JSON.stringify({ ...values, sale_order_id: orderId, customer_id: order.customer_id }),
                })
                flash('Factura generada', 'success')
                setInvForm(false)
                load()
              }}
            />
          </div>
        )}

        {/* Dispatches */}
        {dispatches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Despachos ({dispatches.length})</h3>
            <div className="space-y-2">
              {(dispatches as any[]).map((d: any) => (
                <div key={d.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono font-semibold">{d.dispatch_number}</span>
                    <span className="text-muted-foreground ml-2">{new Date(d.dispatch_date).toLocaleDateString('es-VE')}</span>
                    {d.driver_name && <span className="text-muted-foreground ml-2">· {d.driver_name}</span>}
                  </div>
                  <div>
                    <span className="font-semibold">{d.total_weight_kg} kg</span>
                    {d.delivery_temp_c && (
                      <span className={`ml-2 text-xs ${Number(d.delivery_temp_c) > 8 ? 'text-status-error-text' : 'text-status-success-text'}`}>
                        {d.delivery_temp_c}°C
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoices */}
        {invoices.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Facturas ({invoices.length})</h3>
            <div className="space-y-2">
              {(invoices as any[]).map((inv: any) => (
                <div key={inv.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono font-semibold">{inv.invoice_number}</span>
                    {inv.control_number && <span className="text-muted-foreground ml-2">Control: {inv.control_number}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">USD {inv.total_usd}</span>
                    <StatusBadge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'error' : 'warning'} dot>
                      {inv.status === 'paid' ? 'Pagada' : inv.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
