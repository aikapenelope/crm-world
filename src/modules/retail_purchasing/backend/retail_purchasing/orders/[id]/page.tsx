'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ShoppingBag } from 'lucide-react'

type PO = { id: string; order_number: string; supplier_id: string; status: string; origin: string; currency: string; subtotal: string; tax_amount: string; total: string; exchange_rate: string | null; notes: string | null; created_at: string; sent_at: string | null; received_at: string | null }

const statusFlow = ['draft', 'sent', 'partially_received', 'received']
const statusLabels: Record<string, string> = { draft: 'Borrador', sent: 'Enviada', partially_received: 'Parcial', received: 'Recibida', cancelled: 'Cancelada' }

export default function PurchaseOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [po, setPo] = React.useState<PO | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ item: PO }>(`/api/retail-purchasing/orders?id=${orderId}`, undefined, { fallback: null as any })
      if (call.ok && call.result) setPo(call.result.item)
      setIsLoading(false)
    }
    load()
  }, [orderId])

  async function advanceStatus() {
    if (!po) return
    const idx = statusFlow.indexOf(po.status)
    if (idx < 0 || idx >= statusFlow.length - 1) return
    const next = statusFlow[idx + 1]
    const call = await apiCall('/api/retail-purchasing/orders', { method: 'PUT', body: JSON.stringify({ id: po.id, status: next }) })
    if (call.ok) { setPo({ ...po, status: next }); flash(`Orden actualizada: ${statusLabels[next]}`, 'success') }
  }

  if (isLoading) return <Page><PageBody><div className="text-center py-8 text-muted-foreground">Cargando...</div></PageBody></Page>
  if (!po) return <Page><PageBody><div className="text-center py-8 text-muted-foreground">No encontrada.</div></PageBody></Page>

  const fmt = (v: string) => Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2 })

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{po.order_number}</h1>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={po.status === 'received' ? 'default' : 'secondary'}>{statusLabels[po.status]}</Badge>
                {po.origin === 'auto_reorder' && <Badge variant="outline">Auto-generada</Badge>}
                <span className="text-muted-foreground">{new Date(po.created_at).toLocaleString('es-VE')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {statusFlow.indexOf(po.status) >= 0 && statusFlow.indexOf(po.status) < statusFlow.length - 1 && (
              <Button type="button" onClick={advanceStatus}>
                {po.status === 'draft' ? 'Enviar a Proveedor' : po.status === 'sent' ? 'Registrar Recepción' : 'Completar'}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => router.back()}>Volver</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Proveedor</h3>
            <p className="font-mono text-xs">{po.supplier_id}</p>
            {po.exchange_rate && <p className="text-sm">Tasa: {po.exchange_rate} Bs/USD</p>}
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Totales</h3>
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{po.currency} {fmt(po.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>IVA</span><span>{po.currency} {fmt(po.tax_amount)}</span></div>
            <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{po.currency} {fmt(po.total)}</span></div>
          </div>
        </div>

        {po.notes && (
          <div className="mt-4 max-w-3xl rounded-lg border p-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase mb-1">Notas</h3>
            <p className="text-sm">{po.notes}</p>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
