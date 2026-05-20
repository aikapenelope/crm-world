'use client'

import * as React from 'react'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'

type AccountData = {
  credit_limit: string
  current_balance: string
  currency: string
  payment_terms_days: number
  status: string
  pending_invoices: number
}

export default function PortalDashboardPage({ params }: { params: { orgSlug: string } }) {
  const [account, setAccount] = React.useState<AccountData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      // In production, customer_id comes from the authenticated customer session
      const call = await apiCall<AccountData>(
        '/api/dist-portal/account?customer_id=self',
        undefined,
        { fallback: null as any },
      )
      if (call.ok && call.result) {
        setAccount(call.result)
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const fmt = (val: string) => Number(val).toLocaleString('es-VE', { minimumFractionDigits: 2 })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Mi Cuenta</h1>

      {account ? (
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Estado de Cuenta</h2>
              <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                {account.status === 'active' ? 'Activo' : account.status === 'suspended' ? 'Suspendido' : 'Bloqueado'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                <p className="text-2xl font-bold">{account.currency} {fmt(account.current_balance)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Límite de Crédito</p>
                <p className="text-2xl font-bold text-muted-foreground">{account.currency} {fmt(account.credit_limit)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Plazo de Pago</p>
                <p className="text-2xl font-bold">{account.payment_terms_days} días</p>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Facturas Pendientes</p>
              <p className="text-lg font-bold">{account.pending_invoices}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Crédito Disponible</p>
              <p className="text-lg font-bold text-primary">
                {account.currency} {fmt(String(Number(account.credit_limit) - Number(account.current_balance)))}
              </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-lg border p-4 bg-muted/30">
            <h3 className="text-sm font-semibold mb-2">Métodos de Pago Aceptados</h3>
            <p className="text-sm text-muted-foreground">
              Pago Móvil, Zelle, Binance (USDT), Transferencia Bancaria, Efectivo USD/VES.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Envíe su comprobante de pago por WhatsApp para acreditar su cuenta.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">No se encontró información de cuenta.</p>
        </div>
      )}
    </div>
  )
}
