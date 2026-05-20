'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { MessageCircle, Phone } from 'lucide-react'

type CobroItem = {
  customerId: string
  customerName: string
  phone: string | null
  balance: string
  currency: string
  creditLimit: string
  invoiceCount: number
  daysOverdue: number
  oldestDueDate: string | null
  status: string
  message: string
  waLink: string | null
}

export default function CobroWhatsAppPage() {
  const [items, setItems] = React.useState<CobroItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [stats, setStats] = React.useState({ total: 0, withPhone: 0, withoutPhone: 0 })

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: CobroItem[]; total: number; withPhone: number; withoutPhone: number }>(
        '/api/dist-credit/whatsapp-cobro?min_days_overdue=1',
        undefined,
        { fallback: { items: [], total: 0, withPhone: 0, withoutPhone: 0 } },
      )
      if (call.ok && call.result) {
        setItems(call.result.items ?? [])
        setStats({ total: call.result.total, withPhone: call.result.withPhone, withoutPhone: call.result.withoutPhone })
      }
      setIsLoading(false)
    }
    load()
  }, [])

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/10">
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cobro por WhatsApp</h1>
            <p className="text-sm text-muted-foreground">Enviar recordatorios de pago a clientes con saldo vencido</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Clientes morosos</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Con teléfono</p>
            <p className="text-lg font-bold text-primary">{stats.withPhone}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Sin teléfono</p>
            <p className="text-lg font-bold text-muted-foreground">{stats.withoutPhone}</p>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando...</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">No hay clientes con saldo vencido.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.customerId} className="rounded-lg border p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{item.customerName}</span>
                    <Badge variant={item.daysOverdue > 60 ? 'destructive' : item.daysOverdue > 30 ? 'secondary' : 'outline'}>
                      {item.daysOverdue} días
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Saldo: <span className="font-bold text-foreground">{item.currency} {Number(item.balance).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                    {' · '}{item.invoiceCount} factura{item.invoiceCount > 1 ? 's' : ''}
                    {item.phone && <span> · <Phone className="inline size-3" /> {item.phone}</span>}
                  </div>
                </div>
                <div>
                  {item.waLink ? (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                      onClick={() => window.open(item.waLink!, '_blank')}
                    >
                      <MessageCircle className="mr-1 size-4" />
                      Enviar
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin teléfono</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
