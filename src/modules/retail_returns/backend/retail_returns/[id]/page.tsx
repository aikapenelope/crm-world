'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { WorkflowApprovalWidget } from '@app/lib/workflows/WorkflowApprovalWidget'
import { RotateCcw } from 'lucide-react'

type Return = {
  id: string
  return_number: string
  status: string
  reason: string
  reason_detail: string | null
  refund_method: string
  subtotal: string
  restocking_fee: string
  refund_amount: string
  currency: string
  notes: string | null
  created_at: string
  processed_at: string | null
}

const statusFlow = ['requested', 'approved', 'inspecting', 'completed']

const statusLabels: Record<string, string> = {
  requested: 'Solicitada', approved: 'Aprobada', inspecting: 'Inspección',
  completed: 'Completada', rejected: 'Rechazada', cancelled: 'Cancelada',
}

const reasonLabels: Record<string, string> = {
  defective: 'Defectuoso', wrong_item: 'Producto equivocado',
  not_as_described: 'No como se describió', changed_mind: 'Cambio de opinión',
  damaged_shipping: 'Dañado en envío', other: 'Otro',
}

export default function ReturnDetailPage() {
  const params = useParams()
  const router = useRouter()
  const returnId = params.id as string
  const [ret, setRet] = React.useState<Return | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ item: Return }>(`/api/retail-returns/returns?id=${returnId}`, undefined, { fallback: null as any })
      if (call.ok && call.result) setRet(call.result.item)
      setIsLoading(false)
    }
    load()
  }, [returnId])

  async function advanceStatus() {
    if (!ret) return
    const idx = statusFlow.indexOf(ret.status)
    if (idx < 0 || idx >= statusFlow.length - 1) return
    const next = statusFlow[idx + 1]
    const call = await apiCall('/api/retail-returns/returns', {
      method: 'PUT', body: JSON.stringify({ id: ret.id, status: next }),
    })
    if (call.ok) {
      setRet({ ...ret, status: next })
      flash(`Devolución actualizada a: ${statusLabels[next]}`, 'success')
    }
  }

  if (isLoading) return <Page><PageBody><div className="text-center py-8 text-muted-foreground">Cargando...</div></PageBody></Page>
  if (!ret) return <Page><PageBody><div className="text-center py-8 text-muted-foreground">No encontrada.</div></PageBody></Page>

  const fmt = (v: string) => Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2 })

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RotateCcw className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">{ret.return_number}</h1>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={ret.status === 'completed' ? 'default' : ret.status === 'rejected' ? 'destructive' : 'secondary'}>
                  {statusLabels[ret.status]}
                </Badge>
                <span className="text-muted-foreground">{new Date(ret.created_at).toLocaleString('es-VE')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {statusFlow.indexOf(ret.status) >= 0 && statusFlow.indexOf(ret.status) < statusFlow.length - 1 && (
              <Button type="button" onClick={advanceStatus}>Avanzar Estado</Button>
            )}
            <Button type="button" variant="outline" onClick={() => router.back()}>Volver</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Razón</h3>
            <p className="font-medium">{reasonLabels[ret.reason]}</p>
            {ret.reason_detail && <p className="text-sm text-muted-foreground">{ret.reason_detail}</p>}
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">Reembolso</h3>
            <p className="text-sm">Método: <span className="font-medium">{ret.refund_method}</span></p>
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{ret.currency} {fmt(ret.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span>Cargo restock</span><span>-{ret.currency} {fmt(ret.restocking_fee)}</span></div>
            <div className="flex justify-between font-bold border-t pt-1"><span>Reembolso</span><span>{ret.currency} {fmt(ret.refund_amount)}</span></div>
          </div>
        </div>

        {/* Workflow de autorización — para devoluciones fuera de política */}
        {(ret.status === 'requested' || (ret as any).out_of_policy) && (
          <div className="mt-6 max-w-md">
            <WorkflowApprovalWidget
              workflowId="devolucion_fuera_politica_v1"
              entityId={ret.id}
              entityType="RetailReturn"
              title="Autorización Fuera de Política"
              startLabel="Escalar al gerente para autorización"
              startContext={{
                return_id: ret.id,
                return_number: ret.return_number,
                reason: ret.reason,
                refund_amount: ret.refund_amount,
              }}
              decisions={[
                { value: 'approve', label: 'Autorizar devolución', variant: 'default' },
                { value: 'approve_exchange', label: 'Solo cambio', variant: 'outline' },
                { value: 'reject', label: 'Rechazar', variant: 'destructive' },
              ]}
              onCompleted={() => window.location.reload()}
            />
          </div>
        )}
      </PageBody>
    </Page>
  )
}
