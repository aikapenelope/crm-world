'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft, DollarSign, MessageCircle } from 'lucide-react'

type Props = { params: { orgSlug: string } }


type EnrollmentData = {
  enrollment_id: string; course_name: string; group_code: string
  price_agreed: string; currency: string; paid_total: string; remaining: string
  status: string
}

const METHOD_LABELS: Record<string, string> = {
  transfer: 'Transferencia', zelle: 'Zelle', binance: 'Binance/USDT',
  cash_usd: 'Efectivo USD', mobile_payment: 'Pago móvil',
}

export default function AcademyPortalPaymentsPage({ params }: Props) {
  const router = useRouter()
  const [enrollments, setEnrollments] = React.useState<EnrollmentData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [payingId, setPayingId] = React.useState<string | null>(null)
  const [payAmount, setPayAmount] = React.useState('')
  const [payMethod, setPayMethod] = React.useState('transfer')
  const [payRef, setPayRef] = React.useState('')
  const [paying, setPaying] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const phone = url.searchParams.get('phone') ?? ''
    const eid = url.searchParams.get('enrollment_id') ?? ''
    const param = eid ? `enrollment_id=${eid}` : `phone=${encodeURIComponent(phone)}`
    if (!phone && !eid) { setIsLoading(false); return }

    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: EnrollmentData[] }>(
        `/api/academy-portal/student?${param}`, undefined, { fallback: { items: [] } })
      setEnrollments(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  function backUrl() {
    const url = new URL(window.location.href)
    const p = url.searchParams.get('phone') ?? ''
    const eid = url.searchParams.get('enrollment_id') ?? ''
    return eid ? `/${params.orgSlug}/portal/dashboard?enrollment_id=${eid}` : `/${params.orgSlug}/portal/dashboard?phone=${encodeURIComponent(p)}`
  }

  function openPay(e: EnrollmentData) {
    setPayingId(e.enrollment_id)
    setPayAmount(Number(e.remaining).toFixed(2))
    setPayRef('')
    setMessage(null)
  }

  async function handlePay(evt: React.FormEvent) {
    evt.preventDefault()
    if (!payingId) return
    setPaying(true)
    const res = await apiCall('/api/academy-payments/payments', {
      method: 'POST',
      body: JSON.stringify({
        enrollment_id: payingId,
        amount: payAmount,
        currency: 'USD',
        payment_method: payMethod,
        reference: payRef || null,
        payment_date: new Date().toISOString().slice(0, 10),
        status: 'pending',
        notes: 'Reportado por el alumno desde el portal',
      }),
    })
    if (res.ok) {
      setMessage('Pago reportado. La academia lo confirmará pronto.')
      setPayingId(null)
    } else {
      setMessage('Error al reportar el pago.')
    }
    setPaying(false)
  }

  const totalRemaining = enrollments.reduce((s, e) => s + Number(e.remaining), 0)

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backUrl())}>
          <ArrowLeft className="mr-2 h-4 w-4" />Inicio
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <DollarSign className="size-5" />Pagos
        </h1>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          {message}
        </div>
      )}

      {isLoading && <div className="text-center py-8 text-muted-foreground">Cargando...</div>}

      {totalRemaining > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mb-4">
          <div className="text-sm font-medium text-destructive">Saldo total pendiente:</div>
          <div className="text-2xl font-bold text-destructive">USD {totalRemaining.toFixed(2)}</div>
        </div>
      )}

      <div className="space-y-4">
        {enrollments.map(e => {
          const hasDebt = Number(e.remaining) > 0
          const isPayOpen = payingId === e.enrollment_id
          return (
            <div key={e.enrollment_id} className="rounded-lg border overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{e.course_name}</div>
                    <div className="text-sm text-muted-foreground">{e.group_code}</div>
                    <div className="text-sm mt-1">
                      <span className="text-muted-foreground">Total: </span>
                      <span>{e.currency} {Number(e.price_agreed).toFixed(2)}</span>
                      {' · '}
                      <span className="text-primary">Pagado: {Number(e.paid_total).toFixed(2)}</span>
                    </div>
                  </div>
                  {hasDebt ? (
                    <div className="text-right">
                      <div className="text-destructive font-bold">{e.currency} {Number(e.remaining).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">pendiente</div>
                    </div>
                  ) : (
                    <Badge variant="secondary">Al día</Badge>
                  )}
                </div>
                {hasDebt && !isPayOpen && (
                  <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => openPay(e)}>
                    Reportar pago
                  </Button>
                )}
              </div>

              {isPayOpen && (
                <form onSubmit={handlePay} className="border-t bg-muted/20 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Monto (USD)</label>
                      <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                        min="0.01" step="0.01" required
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Método</label>
                      <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                        {Object.entries(METHOD_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input type="text" value={payRef} onChange={e => setPayRef(e.target.value)}
                    placeholder="Número de referencia / comprobante"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setPayingId(null)}>Cancelar</Button>
                    <Button type="submit" size="sm" disabled={paying}>
                      {paying ? 'Enviando...' : 'Reportar pago'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
