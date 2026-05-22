'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { ArrowLeft } from 'lucide-react'

type Props = { params: { orgSlug: string } }

type Invoice = {
  id: string
  invoice_number: string
  period_month: string
  due_date: string
  status: string
  total_usd: string
  paid_amount_usd: string
  balance_usd: string
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  paid: 'success', partial: 'info', pending: 'warning', overdue: 'error', cancelled: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  paid: 'Pagada', partial: 'Parcial', pending: 'Pendiente', overdue: 'Vencida', cancelled: 'Cancelada',
}

export default function IspPortalFacturas({ params }: Props) {
  const { orgSlug } = params
  const router = useRouter()
  const [invoices, setInvoices] = React.useState<Invoice[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [reportingId, setReportingId] = React.useState<string | null>(null)
  const [payMethod, setPayMethod] = React.useState('zelle')
  const [payRef, setPayRef] = React.useState('')
  const [payAmount, setPayAmount] = React.useState('')
  const [payDate, setPayDate] = React.useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ invoices: Invoice[] }>('/api/isp-portal/invoices', undefined, { fallback: { invoices: [] } })
      if (res.ok) setInvoices(res.result?.invoices ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  const reportPayment = async (invoiceId: string) => {
    if (!payAmount || submitting) return
    setSubmitting(true)
    try {
      await apiCallOrThrow('/api/isp-portal/report-payment', {
        method: 'POST',
        body: JSON.stringify({
          invoice_id: invoiceId,
          payment_method: payMethod,
          reference_number: payRef || null,
          payment_date: payDate,
          amount_usd: payAmount,
        }),
      })
      flash('Pago reportado. El equipo lo verificará pronto.', 'success')
      setReportingId(null)
      setPayRef('')
      setPayAmount('')
    } catch { flash('Error al reportar el pago', 'error') }
    finally { setSubmitting(false) }
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando facturas...</div>

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(`/${orgSlug}/portal/home`)}>
          <ArrowLeft className="size-4 mr-1" />
        </Button>
        <h1 className="text-2xl font-bold">Mis Facturas</h1>
      </div>

      {invoices.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No tienes facturas registradas aún.</p>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-mono font-semibold">{inv.invoice_number}</p>
                  <p className="text-sm text-muted-foreground">{inv.period_month} · Vence {new Date(inv.due_date).toLocaleDateString('es-VE')}</p>
                </div>
                <StatusBadge variant={STATUS_VARIANT[inv.status] ?? 'neutral'} dot>
                  {STATUS_LABEL[inv.status] ?? inv.status}
                </StatusBadge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">USD {inv.total_usd}</p>
                  {parseFloat(inv.balance_usd) > 0 && (
                    <p className="text-sm text-status-error-text">Pendiente: USD {inv.balance_usd}</p>
                  )}
                </div>
                {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                  <Button type="button" size="sm" onClick={() => { setReportingId(inv.id); setPayAmount(inv.balance_usd) }}>
                    Reportar pago
                  </Button>
                )}
              </div>

              {reportingId === inv.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <p className="text-sm font-semibold">Reportar pago para esta factura</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Método</label>
                      <select className="w-full mt-1 text-sm border border-input rounded-md px-2 py-1.5 bg-background"
                        value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                        <option value="zelle">Zelle</option>
                        <option value="pago_movil">Pago Móvil</option>
                        <option value="efectivo_usd">Efectivo USD</option>
                        <option value="efectivo_ves">Efectivo VES</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="binance">Binance / USDT</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Monto (USD)</label>
                      <input type="text" className="w-full mt-1 text-sm border border-input rounded-md px-2 py-1.5 bg-background"
                        value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Fecha del pago</label>
                      <input type="date" className="w-full mt-1 text-sm border border-input rounded-md px-2 py-1.5 bg-background"
                        value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Referencia (opcional)</label>
                      <input type="text" className="w-full mt-1 text-sm border border-input rounded-md px-2 py-1.5 bg-background"
                        value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Opcional" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => setReportingId(null)}>Cancelar</Button>
                    <Button type="button" size="sm" disabled={!payAmount || submitting} onClick={() => reportPayment(inv.id)}>
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
