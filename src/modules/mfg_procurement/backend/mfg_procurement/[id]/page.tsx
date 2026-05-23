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
import { ArrowLeft, Plus } from 'lucide-react'

type PageState = 'loading' | 'notFound' | 'ready'

const PO_STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador', sent: 'Enviada', confirmed: 'Confirmada', in_transit: 'En tránsito',
  at_customs: 'En aduana VE', delivered: 'Recibida', cancelled: 'Cancelada',
}
const PO_STATUS_VARIANT: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'neutral', sent: 'info', confirmed: 'info', in_transit: 'warning',
  at_customs: 'warning', delivered: 'success', cancelled: 'error',
}

function CostRow({ label, value, highlight, sub }: { label: string; value: string | number; highlight?: boolean; sub?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 border-b border-border/50 last:border-0 ${sub ? 'pl-4' : ''}`}>
      <span className={`text-sm ${sub ? 'text-muted-foreground' : ''}`}>{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-primary text-base' : ''}`}>USD {typeof value === 'number' ? value.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
    </div>
  )
}

function DateRow({ label, estimated, actual }: { label: string; estimated?: string | null; actual?: string | null }) {
  const today = new Date().toISOString().split('T')[0]
  const isLate = estimated && !actual && estimated < today
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        {estimated && <div className={`text-xs ${isLate ? 'text-status-warning-text' : 'text-muted-foreground'}`}>Est: {new Date(estimated).toLocaleDateString('es-VE')}</div>}
        {actual && <div className="text-sm font-semibold text-status-success-text">Real: {new Date(actual).toLocaleDateString('es-VE')}</div>}
        {!estimated && !actual && <span className="text-xs text-muted-foreground">Pendiente</span>}
      </div>
    </div>
  )
}

export default function ProcurementDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [po, setPo]       = React.useState<any>(null)
  const [lines, setLines] = React.useState<any[]>([])
  const [showLineForm, setLF] = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const [poRes, linesRes] = await Promise.all([
      apiCall<{ items: any[] }>(`/api/mfg-procurement/purchase-orders?id=${params.id}`),
      apiCall<{ items: any[] }>(`/api/mfg-procurement/po-lines?po_id=${params.id}&pageSize=100`, undefined, { fallback: { items: [] } }),
    ])
    const p = (poRes.result?.items ?? [])[0] ?? null
    if (!p) { setState('notFound'); return }
    setPo(p)
    setLines(linesRes.result?.items ?? [])
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando OC..." /></PageBody></Page>
  if (state === 'notFound') return (
    <Page><PageBody>
      <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-procurement')} className="mb-4">
        <ArrowLeft className="mr-2 size-4" /> Compras
      </Button>
      <ErrorMessage message="OC no encontrada." />
    </PageBody></Page>
  )

  const p = po
  const cifComponents = [
    { label: 'Valor FOB',           value: p.subtotal_fob },
    { label: 'Flete internacional', value: p.freight_cost },
    { label: 'Seguro de carga',     value: p.insurance_cost },
    { label: 'Arancel SENIAT',      value: p.tariff_cost },
    { label: 'IVA importación (16%)', value: p.import_vat },
    { label: 'Honorarios agente aduana', value: p.agency_fees },
    { label: 'Flete interno (puerto → almacén)', value: p.inland_transport },
  ]
  const totalCifCalc = cifComponents.reduce((s, c) => s + Number(c.value), 0)
  const totalQty = lines.reduce((s, l) => s + Number(l.quantity), 0)
  const unitCif  = totalQty > 0 ? totalCifCalc / totalQty : 0

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/mfg-procurement')} className="mb-6">
          <ArrowLeft className="mr-2 size-4" /> Compras
        </Button>

        <div className="max-w-3xl space-y-4">
          {/* Header */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold font-mono">{p.po_number}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {p.supplier_name}
                  {p.incoterm && ` · ${p.incoterm}`}
                  {p.country_of_origin && ` · ${p.country_of_origin}`}
                  {p.dau_number && ` · DAU: ${p.dau_number}`}
                </p>
              </div>
              <StatusBadge variant={PO_STATUS_VARIANT[p.status] ?? 'neutral'} dot>
                {PO_STATUS_LABEL[p.status] ?? p.status}
              </StatusBadge>
            </div>

            {/* BCV info */}
            {(p.bcv_rate_at_order || p.bcv_rate_at_arrival) && (
              <div className="p-2 bg-muted/30 rounded text-xs text-muted-foreground mb-4">
                Tasa BCV al pedir: {p.bcv_rate_at_order ? `Bs ${Number(p.bcv_rate_at_order).toLocaleString('es-VE', { minimumFractionDigits: 2 })}/USD` : '—'}
                {p.bcv_rate_at_arrival && ` · Al recibir: Bs ${Number(p.bcv_rate_at_arrival).toLocaleString('es-VE', { minimumFractionDigits: 2 })}/USD`}
              </div>
            )}
          </div>

          {/* CIF calculation */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <h3 className="text-sm font-semibold mb-4">Cálculo de Costo CIF en Almacén</h3>
            {cifComponents.map((c) => <CostRow key={c.label} label={c.label} value={c.value} sub />)}
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
              <span className="font-bold">Costo CIF Total</span>
              <span className="text-xl font-bold text-primary">USD {totalCifCalc.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
            </div>
            {totalQty > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Costo CIF unitario: USD {unitCif.toFixed(6)} / {lines[0]?.uom ?? 'unidad'} (total qty: {totalQty.toFixed(3)})
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1 italic">
              Este costo unitario se transfiere automáticamente al lote de inventario al recibir la mercancía.
            </p>
          </div>

          {/* Timeline */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <h3 className="text-sm font-semibold mb-4">Timeline de la Importación</h3>
            <DateRow label="Fecha de embarque" estimated={p.estimated_ship_date} actual={p.actual_ship_date} />
            <DateRow label="Llegada al puerto" estimated={p.estimated_arrival_port} actual={p.actual_arrival_port} />
            <DateRow label="Levante de aduana" estimated={p.estimated_customs_clearance} actual={p.actual_customs_clearance} />
            <DateRow label="Llegada al almacén" estimated={p.estimated_warehouse_arrival} actual={p.actual_warehouse_arrival} />
          </div>

          {/* Lines */}
          <div className="border border-border rounded-xl p-5 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Líneas de la OC ({lines.length})</h3>
              <Button type="button" size="sm" variant="outline" onClick={() => setLF(!showLineForm)}>
                <Plus className="size-4 mr-1" /> Agregar línea
              </Button>
            </div>
            {showLineForm && (
              <div className="mb-4 border border-border rounded-lg p-3 bg-background">
                <CrudForm entityId="mfg_procurement.po_line" apiPath="/api/mfg-procurement/po-lines" mode="create"
                  initial={{ po_id: params.id, line_number: lines.length + 1 }}
                  fields={[
                    { type: 'text' as const, name: 'material_code', label: 'Código material', required: true },
                    { type: 'text' as const, name: 'material_name', label: 'Nombre material', required: true },
                    { type: 'text' as const, name: 'quantity',      label: 'Cantidad', required: true },
                    { type: 'text' as const, name: 'uom',           label: 'Unidad', required: true },
                    { type: 'text' as const, name: 'unit_price',    label: 'Precio unitario (USD)', required: true },
                    { type: 'text' as const, name: 'total_price',   label: 'Total (USD)', required: true },
                  ]}
                  onSubmit={async (values) => {
                    await apiCallOrThrow('/api/mfg-procurement/po-lines', { method: 'POST', body: JSON.stringify({ ...values, po_id: params.id }) })
                    flash('Línea agregada', 'success')
                    setLF(false)
                    load()
                  }}
                />
              </div>
            )}
            {lines.length > 0 ? (
              <div className="space-y-2">
                {lines.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                    <div>
                      <span className="font-mono font-medium">{l.material_code}</span>
                      <span className="text-muted-foreground ml-2">{l.material_name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{l.quantity} {l.uom}</span>
                      <span className="text-muted-foreground ml-2">× USD {Number(l.unit_price).toFixed(4)}</span>
                      <span className="font-bold ml-2">= USD {Number(l.total_price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin líneas — agrega los materiales de esta OC.</p>
            )}
          </div>
        </div>
      </PageBody>
    </Page>
  )
}
