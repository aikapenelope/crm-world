'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

type Payment = {
  id: string
  payment_date: string
  amount_usd: string
  currency: string
  payment_method: string
  reference_number: string | null
  igtf_applies: boolean
  igtf_amount_usd: string
  confirmed_at: string | null
}

const METHOD_LABELS: Record<string, string> = {
  zelle: 'Zelle', pago_movil: 'Pago Móvil', efectivo_usd: 'Efectivo USD',
  efectivo_ves: 'Efectivo VES', transferencia: 'Transferencia', binance: 'Binance/USDT', otro: 'Otro',
}

export default function IspPortalPagos() {
  const router = useRouter()
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [totalUsd, setTotalUsd] = React.useState(0)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ payments: Payment[] }>('/api/isp-portal/payments', undefined, { fallback: { payments: [] } })
      if (res.ok) {
        const p = res.result?.payments ?? []
        setPayments(p)
        setTotalUsd(p.reduce((s, pay) => s + parseFloat(pay.amount_usd), 0))
      }
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/abonado/home')}>
          <ArrowLeft className="size-4 mr-1" />
        </Button>
        <h1 className="text-2xl font-bold">Mis Pagos</h1>
      </div>

      {payments.length > 0 && (
        <div className="rounded-lg border border-border p-4 mb-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total pagado (historial)</span>
          <span className="font-bold">USD {totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
        </div>
      )}

      {payments.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No tienes pagos registrados aún.</p>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">USD {parseFloat(p.amount_usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-muted-foreground">{METHOD_LABELS[p.payment_method] ?? p.payment_method}</p>
                </div>
                <p className="text-sm text-muted-foreground">{new Date(p.payment_date).toLocaleDateString('es-VE')}</p>
              </div>
              {p.reference_number && (
                <p className="text-xs text-muted-foreground mt-1">Ref: <span className="font-mono">{p.reference_number}</span></p>
              )}
              {p.igtf_applies && parseFloat(p.igtf_amount_usd) > 0 && (
                <p className="text-xs text-status-warning-text mt-1">IGTF: USD {p.igtf_amount_usd}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
