/**
 * AGM Exception: raw <form> — inline action panel in detail view
 *
 * This detail page renders a small form panel for an in-place action
 * (status update / payment recording) that appears conditionally within
 * a read-only detail view. CrudForm is designed for dedicated create/edit
 * pages, not for toggleable sub-panels within detail views.
 *
 * Acceptable to keep raw <form>. All other AGM rules apply.
 * Migrate to a dedicated action page + CrudForm if the form grows.
 */
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft, CalendarPlus, CheckCircle2, DollarSign, Download } from 'lucide-react'
import { calendarLinks, dueDateEvent } from '@app/lib/calendar-links'

type Receipt = {
  id: string
  receipt_number: string
  period_month: string
  unit_number: string
  owner_name: string
  aliquot_percent: string
  amount_usd: string
  amount_ves: string | null
  exchange_rate: string | null
  late_fee_amount: string
  total_amount: string
  paid_amount: string
  status: string
  due_date: string
  paid_at: string | null
  payment_method: string | null
  payment_reference: string | null
  notes: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', partial: 'Pago parcial',
  paid: 'Pagado', overdue: 'Vencido', cancelled: 'Cancelado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', partial: 'outline', paid: 'secondary',
  overdue: 'destructive', cancelled: 'secondary',
}

const METHOD_LABELS: Record<string, string> = {
  transfer: 'Transferencia', cash_usd: 'Efectivo USD', cash_ves: 'Efectivo VES',
  zelle: 'Zelle', binance: 'Binance/USDT', mobile_payment: 'Pago móvil', card: 'Tarjeta',
}

export default function CondoReceiptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const receiptId = params?.id as string

  const [receipt, setReceipt] = React.useState<Receipt | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [paying, setPaying] = React.useState(false)
  const [showPayForm, setShowPayForm] = React.useState(false)
  const [payMethod, setPayMethod] = React.useState('transfer')
  const [payReference, setPayReference] = React.useState('')
  const [payAmount, setPayAmount] = React.useState('')

  async function load() {
    setIsLoading(true)
    const res = await apiCall<{ items: Receipt[] }>(
      `/api/condo-fees/receipts?id=${receiptId}`,
      undefined,
      { fallback: { items: [] } },
    )
    const r = res.result?.items?.[0] ?? null
    setReceipt(r)
    if (r) {
      const remaining = Number(r.total_amount) - Number(r.paid_amount)
      setPayAmount(remaining.toFixed(2))
    }
    setIsLoading(false)
  }

  React.useEffect(() => { if (receiptId) load() }, [receiptId])

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!receipt) return
    setPaying(true)
    const res = await apiCall('/api/condo-fees/receipts/pay', {
      method: 'POST',
      body: JSON.stringify({
        receipt_id: receipt.id,
        paid_amount: payAmount,
        payment_method: payMethod,
        payment_reference: payReference || null,
      }),
    })
    if (res.ok) {
      flash('Pago registrado', 'success')
      setShowPayForm(false)
      await load()
    } else {
      flash('Error al registrar pago', 'error')
    }
    setPaying(false)
  }

  if (isLoading) return <LoadingMessage label="Cargando recibo..." />
  if (!receipt) return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/condo_fees')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Volver
        </Button>
        <p className="mt-4 text-muted-foreground">Recibo no encontrado.</p>
      </PageBody>
    </Page>
  )

  const isPaid = receipt.status === 'paid' || receipt.status === 'cancelled'
  const remaining = Math.max(0, Number(receipt.total_amount) - Number(receipt.paid_amount))
  const hasLateFee = Number(receipt.late_fee_amount) > 0

  // Calendar link for due date reminders
  const calLink = !isPaid && receipt.due_date ? (() => {
    const ev = dueDateEvent({
      title: `Cuota condominio — Unidad ${receipt.unit_number} (${receipt.period_month})`,
      dueDate: new Date(receipt.due_date),
      description: `Recibo ${receipt.receipt_number}\nMonto: $${receipt.total_amount} USD\nPropietario: ${receipt.owner_name}`,
    })
    return calendarLinks(ev)
  })() : null

  return (
    <Page>
      <PageBody>
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/condo_fees')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Recibos
        </Button>

        {/* Header */}
        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">{receipt.receipt_number}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {receipt.owner_name} · Unidad {receipt.unit_number} · Período {receipt.period_month}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANTS[receipt.status] ?? 'outline'}>
              {STATUS_LABELS[receipt.status] ?? receipt.status}
            </Badge>
            {calLink && (
              <a href={calLink.google} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline" size="sm">
                  <CalendarPlus className="mr-2 size-4" />
                  Agendar
                </Button>
              </a>
            )}
            {!isPaid && (
              <Button type="button" size="sm" onClick={() => setShowPayForm(v => !v)}>
                <DollarSign className="mr-2 size-4" />
                Registrar pago
              </Button>
            )}
            <a href={`/api/condo-fees/receipts/pdf?id=${receipt.id}`} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="outline" size="sm">
                <Download className="mr-2 size-4" />
                Descargar PDF
              </Button>
            </a>
          </div>
        </div>

        {/* Pay form */}
        {showPayForm && !isPaid && (
          <form onSubmit={handlePay} className="rounded-lg border p-4 mb-6 bg-muted/20 space-y-4">
            <h3 className="font-semibold text-sm">Registrar pago</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Monto (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remaining.toFixed(2)}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Método</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(METHOD_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Referencia</label>
                <input
                  type="text"
                  value={payReference}
                  onChange={e => setPayReference(e.target.value)}
                  placeholder="Nro. de comprobante"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPayForm(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={paying}>
                {paying ? 'Guardando...' : 'Confirmar pago'}
              </Button>
            </div>
          </form>
        )}

        {/* Amount breakdown */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Desglose del monto</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cuota base</span>
                <span>USD {Number(receipt.amount_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Alícuota</span>
                <span>{Number(receipt.aliquot_percent).toFixed(5)}%</span>
              </div>
              {hasLateFee && (
                <div className="flex justify-between text-destructive">
                  <span>Mora</span>
                  <span>USD {Number(receipt.late_fee_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-lg">USD {Number(receipt.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              {receipt.amount_ves && receipt.exchange_rate && (
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>Equivalente VES (tasa {Number(receipt.exchange_rate).toLocaleString('es-VE')})</span>
                  <span>Bs. {Number(receipt.amount_ves).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold">Estado de pago</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span>USD {Number(receipt.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pagado</span>
                <span className="text-primary font-medium">
                  USD {Number(receipt.paid_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {!isPaid && remaining > 0 && (
                <div className="flex justify-between font-bold border-t pt-2 text-destructive">
                  <span>Saldo pendiente</span>
                  <span>USD {remaining.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {isPaid && (
                <div className="flex items-center gap-2 text-primary border-t pt-2">
                  <CheckCircle2 className="size-4" />
                  <span className="font-medium">Pagado completamente</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Vencimiento</span>
                <span>{new Date(receipt.due_date).toLocaleDateString('es-VE')}</span>
              </div>
              {receipt.paid_at && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Fecha de pago</span>
                  <span>{new Date(receipt.paid_at).toLocaleDateString('es-VE')}</span>
                </div>
              )}
              {receipt.payment_method && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método</span>
                  <span>{METHOD_LABELS[receipt.payment_method] ?? receipt.payment_method}</span>
                </div>
              )}
              {receipt.payment_reference && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referencia</span>
                  <span className="font-mono text-xs">{receipt.payment_reference}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {receipt.notes && (
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-2">Notas</h3>
            <p className="text-sm text-muted-foreground">{receipt.notes}</p>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
