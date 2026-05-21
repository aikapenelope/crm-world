'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { Button } from '@open-mercato/ui/primitives/button'
import { StatusBadge } from '@open-mercato/ui/primitives/status-badge'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { ArrowLeft, DollarSign } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
  paid: 'success', partial: 'info', pending: 'warning', overdue: 'error', cancelled: 'neutral',
}
const STATUS_LABEL: Record<string, string> = {
  paid: 'Pagada', partial: 'Parcial', pending: 'Pendiente',
  overdue: 'Vencida', cancelled: 'Cancelada',
}

type PageState = 'loading' | 'notFound' | 'error' | 'ready'

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [state, setState] = React.useState<PageState>('loading')
  const [invoice, setInvoice] = React.useState<any>(null)
  const [showPaymentForm, setShowPaymentForm] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)

  const load = React.useCallback(async () => {
    setState('loading')
    const res = await apiCall<{ items: any[] }>(`/api/isp-billing/invoices?id=${params.id}`)
    const item = res.result?.items?.[0] ?? null
    if (!item) { setState('notFound'); return }
    setInvoice(item)
    setState('ready')
  }, [params.id])

  React.useEffect(() => { load() }, [load])

  if (state === 'loading') return <Page><PageBody><LoadingMessage label="Cargando factura..." /></PageBody></Page>
  if (state === 'notFound') return <Page><PageBody><ErrorMessage message="Factura no encontrada." /></PageBody></Page>

  const isPending = ['pending', 'partial', 'overdue'].includes(invoice.status)

  const paymentGroups: CrudFormGroup[] = [
    {
      id: 'payment', title: 'Cobro',
      fields: [
        { id: 'payment_date', label: 'Fecha del pago', type: 'date', required: true },
        { id: 'amount_usd', label: 'Monto (USD)', type: 'text', required: true, placeholder: invoice.balance_usd },
        {
          id: 'payment_method', label: 'Método de pago', type: 'select', required: true,
          options: [
            { value: 'zelle', label: 'Zelle' },
            { value: 'pago_movil', label: 'Pago Móvil' },
            { value: 'efectivo_usd', label: 'Efectivo USD' },
            { value: 'efectivo_ves', label: 'Efectivo VES' },
            { value: 'transferencia', label: 'Transferencia bancaria' },
            { value: 'binance', label: 'Binance / USDT' },
            { value: 'otro', label: 'Otro' },
          ],
        },
        { id: 'reference_number', label: 'Referencia / confirmación', type: 'text' },
        { id: 'igtf_applies', label: 'Aplica IGTF 3% (pago en divisas)', type: 'checkbox', defaultValue: false },
        { id: 'notes', label: 'Notas', type: 'textarea' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/backend/isp-billing')} className="mb-4">
          <ArrowLeft className="mr-2 size-4" /> Facturas
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-2xl font-bold">Factura {invoice.invoice_number}</h1>
          <div className="flex items-center gap-2">
            <StatusBadge variant={STATUS_VARIANT[invoice.status] ?? 'neutral'} dot>
              {STATUS_LABEL[invoice.status] ?? invoice.status}
            </StatusBadge>
            {isPending && (
              <Button type="button" onClick={() => setShowPaymentForm(!showPaymentForm)}>
                <DollarSign className="size-4 mr-2" /> Registrar pago
              </Button>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Período</div>
            <div className="font-semibold mt-1">{invoice.period_month}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Total</div>
            <div className="font-bold text-lg mt-1">USD {invoice.total_usd}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Pagado</div>
            <div className="font-semibold text-status-success-text mt-1">USD {invoice.paid_amount_usd}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Saldo</div>
            <div className={`font-bold text-lg mt-1 ${parseFloat(invoice.balance_usd) > 0 ? 'text-status-error-text' : 'text-status-success-text'}`}>
              USD {invoice.balance_usd}
            </div>
          </div>
        </div>

        {/* Payment form */}
        {showPaymentForm && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-background">
            <h3 className="text-sm font-semibold mb-4">Registrar cobro</h3>
            <CrudForm
              fields={[]}
              groups={paymentGroups}
              onSubmit={async (values) => {
                if (submitting) return
                setSubmitting(true)
                try {
                  await apiCallOrThrow('/api/isp-billing/invoices/register-payment', {
                    method: 'POST',
                    body: JSON.stringify({
                      invoice_id: params.id,
                      subscriber_id: invoice.subscriber_id,
                      ...values,
                    }),
                  })
                  flash('Pago registrado exitosamente', 'success')
                  setShowPaymentForm(false)
                  load()
                } catch {
                  flash('Error al registrar el pago', 'error')
                } finally {
                  setSubmitting(false)
                }
              }}
            />
          </div>
        )}

        {invoice.status === 'paid' && (
          <div className="p-4 bg-status-success-bg border border-status-success-border rounded-lg text-status-success-text text-sm">
            ✓ Factura pagada el {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString('es-VE') : '—'}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
