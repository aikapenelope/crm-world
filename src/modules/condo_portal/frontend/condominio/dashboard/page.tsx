'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { FileText, Wrench, Mail, Vote } from 'lucide-react'

type AccountData = {
  unit: { id: string; unit_number: string; aliquot_percent: string; owner_name: string }
  balance: { total_debt: string; pending_receipts: number; paid_receipts: number; currency: string }
  recent_receipts: { id: string; receipt_number: string; period_month: string; total_amount: string; status: string }[]
}

export default function CondoPortalDashboard() {
  const router = useRouter()
  const [data, setData] = React.useState<AccountData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      // In production, unit_id comes from the authenticated customer session
      const url = new URL(window.location.href)
      const unitId = url.searchParams.get('unit_id') ?? ''
      if (!unitId) { setIsLoading(false); return }

      const res = await apiCall<AccountData>(
        `/api/condo-portal/account?unit_id=${unitId}`,
        undefined,
        { fallback: null },
      )
      if (res.ok && res.result) setData(res.result)
      setIsLoading(false)
    }
    load()
  }, [])

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  if (!data) return <div className="p-8 text-center text-muted-foreground">Seleccione una unidad para ver su estado de cuenta.</div>

  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', partial: 'Parcial', paid: 'Pagado', overdue: 'Vencido',
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mi Condominio</h1>
        <p className="text-sm text-muted-foreground">
          Unidad {data.unit.unit_number} — {data.unit.owner_name} — Alícuota: {Number(data.unit.aliquot_percent).toFixed(5)}%
        </p>
      </div>

      {/* Balance card */}
      <div className="mb-6 rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
        <p className={`text-3xl font-bold ${Number(data.balance.total_debt) > 0 ? 'text-destructive' : ''}`}>
          {data.balance.currency} {Number(data.balance.total_debt).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {data.balance.pending_receipts} recibos pendientes — {data.balance.paid_receipts} pagados
        </p>
      </div>

      {/* Quick actions */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Button type="button" variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => router.push('/condominio/receipts')}>
          <FileText className="size-5" />
          <span className="text-xs">Recibos</span>
        </Button>
        <Button type="button" variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => router.push('/condominio/maintenance')}>
          <Wrench className="size-5" />
          <span className="text-xs">Mantenimiento</span>
        </Button>
        <Button type="button" variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => router.push('/condominio/circulars')}>
          <Mail className="size-5" />
          <span className="text-xs">Circulares</span>
        </Button>
        <Button type="button" variant="outline" className="h-auto flex-col gap-2 p-4" onClick={() => router.push('/condominio/votes')}>
          <Vote className="size-5" />
          <span className="text-xs">Votaciones</span>
        </Button>
      </div>

      {/* Recent receipts */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Últimos Recibos</h2>
        <div className="space-y-2">
          {data.recent_receipts.slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <span className="font-mono text-xs">{r.receipt_number}</span>
                <span className="ml-2 text-sm text-muted-foreground">{r.period_month}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">$ {Number(r.total_amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                <Badge variant={r.status === 'paid' ? 'default' : r.status === 'overdue' ? 'destructive' : 'outline'}>
                  {statusLabels[r.status] ?? r.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
