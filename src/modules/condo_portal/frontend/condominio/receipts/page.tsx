'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, CheckCircle2, DollarSign } from 'lucide-react'

type Receipt = {
  id: string
  receipt_number: string
  period_month: string
  total_amount: string
  paid_amount: string
  status: string
  due_date: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', partial: 'Pago parcial',
  paid: 'Pagado', overdue: 'Vencido', cancelled: 'Cancelado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', partial: 'outline', paid: 'secondary', overdue: 'destructive', cancelled: 'secondary',
}

const METHOD_LABELS: Record<string, string> = {
  transfer: 'Transferencia', cash_usd: 'Efectivo USD', cash_ves: 'Efectivo VES',
  zelle: 'Zelle', binance: 'Binance/USDT', mobile_payment: 'Pago móvil', card: 'Tarjeta',
}

export default function PortalReceiptsPage() {
  const router = useRouter()
  const [receipts, setReceipts] = React.useState<Receipt[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [unitId, setUnitId] = React.useState<string | null>(null)

  // Pay form state
  const [payingId, setPayingId] = React.useState<string | null>(null)
  const [payMethod, setPayMethod] = React.useState('transfer')
  const [payReference, setPayReference] = React.useState('')
  const [payAmount, setPayAmount] = React.useState('')
  const [paying, setPaying] = React.useState(false)
  const [payMessage, setPayMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const uid = url.searchParams.get('unit_id') ?? ''
    setUnitId(uid)
    if (!uid) { setIsLoading(false); return }

    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ recent_receipts: Receipt[] }>(
        `/api/condo-portal/account?unit_id=${uid}`,
        undefined,
        { fallback: null },
      )
      if (res.ok && res.result?.recent_receipts) {
        setReceipts(res.result.recent_receipts)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  function openPayForm(receipt: Receipt) {
    setPayingId(receipt.id)
    const remaining = Math.max(0, Number(receipt.total_amount) - Number(receipt.paid_amount))
    setPayAmount(remaining.toFixed(2))
    setPayReference('')
    setPayMessage(null)
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!payingId) return
    setPaying(true)
    const res = await apiCall('/api/condo-portal/report-payment', {
      method: 'POST',
      body: JSON.stringify({
        receipt_id: payingId,
        amount: payAmount,
        payment_method: payMethod,
        reference: payReference || null,
      }),
    })
    if (res.ok) {
      setPayMessage('Pago reportado. El administrador verificará el pago.')
      setPayingId(null)
      // Reload receipts
      if (unitId) {
        const updated = await apiCall<{ recent_receipts: Receipt[] }>(
          `/api/condo-portal/account?unit_id=${unitId}`,
          undefined,
          { fallback: null },
        )
        if (updated.result?.recent_receipts) setReceipts(updated.result.recent_receipts)
      }
    } else {
      setPayMessage('Error al reportar el pago. Intenta nuevamente.')
    }
    setPaying(false)
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push(unitId ? `/condominio/dashboard?unit_id=${unitId}` : '/condominio/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Inicio
        </Button>
        <h1 className="text-xl font-bold">Mis Recibos</h1>
      </div>

      {payMessage && (
        <div className={`mb-4 rounded-lg border p-3 text-sm ${payMessage.includes('Error') ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-primary/20 bg-primary/5 text-primary'}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {payMessage}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">Cargando recibos...</div>
      )}

      {!isLoading && receipts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">No hay recibos registrados.</div>
      )}

      {receipts.length > 0 && (
        <div className="space-y-3">
          {receipts.map(r => {
            const isPaid = r.status === 'paid' || r.status === 'cancelled'
            const remaining = Math.max(0, Number(r.total_amount) - Number(r.paid_amount))
            const isPayFormOpen = payingId === r.id

            return (
              <div key={r.id} className="rounded-lg border overflow-hidden">
                {/* Receipt header */}
                <div className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{r.receipt_number}</span>
                      <Badge variant={STATUS_VARIANTS[r.status] ?? 'outline'} className="text-xs">
                        {STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">
                      Período {r.period_month} · Vence {new Date(r.due_date).toLocaleDateString('es-VE')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">$ {Number(r.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                    {!isPaid && remaining < Number(r.total_amount) && (
                      <div className="text-xs text-muted-foreground">Pendiente: $ {remaining.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                    )}
                  </div>
                </div>

                {/* Pay button */}
                {!isPaid && !isPayFormOpen && (
                  <div className="px-4 pb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openPayForm(r)}
                    >
                      <DollarSign className="mr-2 size-4" />
                      Reportar pago
                    </Button>
                  </div>
                )}

                {/* Pay form */}
                {isPayFormOpen && (
                  <form onSubmit={handlePay} className="border-t bg-muted/20 p-4 space-y-3">
                    <p className="text-sm font-medium">Reportar pago para {r.receipt_number}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Monto (USD)</label>
                        <input
                          type="number" step="0.01" min="0.01" value={payAmount}
                          onChange={e => setPayAmount(e.target.value)} required
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Método</label>
                        <select
                          value={payMethod} onChange={e => setPayMethod(e.target.value)}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        >
                          {Object.entries(METHOD_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Referencia / Comprobante</label>
                      <input
                        type="text" value={payReference} onChange={e => setPayReference(e.target.value)}
                        placeholder="Número de referencia..."
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setPayingId(null)}>Cancelar</Button>
                      <Button type="submit" size="sm" disabled={paying}>
                        {paying ? 'Enviando...' : 'Confirmar'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
