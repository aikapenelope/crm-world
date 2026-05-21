'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { DollarSign, MessageCircle, Plus } from 'lucide-react'

type PaymentRow = {
  id: string
  payment_number: string
  enrollment_id: string
  amount: string
  currency: string
  payment_method: string
  payment_date: string
  reference: string | null
  status: string
}

type DebtorRow = {
  enrollment_id: string
  enrollment_number: string
  student_name: string
  student_phone: string | null
  group_code: string
  price_agreed: string
  paid_total: string
  remaining: string
  currency: string
  wa_link: string | null
}

const METHOD_LABELS: Record<string, string> = {
  transfer: 'Transferencia', cash_usd: 'Efectivo USD', zelle: 'Zelle',
  binance: 'Binance', mobile_payment: 'Pago móvil', card: 'Tarjeta', cash_ves: 'Efectivo VES',
}

export default function AcademyPaymentsPage() {
  const router = useRouter()
  const [tab, setTab] = React.useState<'payments' | 'cobro'>('payments')
  const [payments, setPayments] = React.useState<PaymentRow[]>([])
  const [debtors, setDebtors] = React.useState<DebtorRow[]>([])
  const [enrollmentNames, setEnrollmentNames] = React.useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const [pRes, dRes, eRes] = await Promise.all([
        apiCall<{ items: PaymentRow[] }>('/api/academy-payments/payments?pageSize=200', undefined, { fallback: { items: [] } }),
        apiCall<{ items: DebtorRow[] }>('/api/academy-payments/whatsapp-cobro', undefined, { fallback: { items: [] } }),
        apiCall<{ items: any[] }>('/api/academy-enrollments/enrollments?pageSize=200', undefined, { fallback: { items: [] } }),
      ])
      setPayments(pRes.result?.items ?? [])
      setDebtors(dRes.result?.items ?? [])
      const map: Record<string, string> = {}
      for (const e of (eRes.result?.items ?? [])) map[e.id] = e.student_name
      setEnrollmentNames(map)
      setIsLoading(false)
    }
    load()
  }, [])

  const totalConfirmed = payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0)
  const totalPending = debtors.reduce((s, d) => s + Number(d.remaining), 0)

  const paymentColumns: ColumnDef<PaymentRow>[] = [
    {
      header: 'Pago',
      accessorKey: 'payment_number',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.payment_number}</div>
          <div className="text-xs text-muted-foreground">{enrollmentNames[row.original.enrollment_id] ?? '—'}</div>
        </div>
      ),
    },
    { header: 'Fecha', accessorKey: 'payment_date', cell: ({ row }) => new Date(row.original.payment_date).toLocaleDateString('es-VE') },
    { header: 'Método', accessorKey: 'payment_method', cell: ({ row }) => METHOD_LABELS[row.original.payment_method] ?? row.original.payment_method },
    { header: 'Referencia', accessorKey: 'reference', cell: ({ row }) => row.original.reference ?? <span className="text-muted-foreground">—</span> },
    {
      header: 'Monto',
      accessorKey: 'amount',
      cell: ({ row }) => <span className="font-bold">{row.original.currency} {Number(row.original.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>,
    },
    {
      header: 'Estado',
      accessorKey: 'status',
      cell: ({ row }) => <Badge variant={row.original.status === 'confirmed' ? 'secondary' : 'outline'} className="text-xs">{row.original.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}</Badge>,
    },
  ]

  return (
    <Page>
      <PageBody>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="size-6" />Pagos
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              USD {totalConfirmed.toLocaleString('es-VE', { minimumFractionDigits: 2 })} cobrado · {debtors.length} alumnos con saldo
            </p>
          </div>
          <Button type="button" onClick={() => router.push('/backend/academy_payments/create')}>
            <Plus className="mr-2 size-4" />Registrar pago
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground mb-1">Total cobrado (confirmados)</div>
            <div className="text-2xl font-bold text-primary">USD {totalConfirmed.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-xs text-muted-foreground mb-1">Saldo pendiente ({debtors.length} alumnos)</div>
            <div className={`text-2xl font-bold ${totalPending > 0 ? 'text-destructive' : ''}`}>
              USD {totalPending.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-0">
            {[
              { id: 'payments', label: `Historial (${payments.length})` },
              { id: 'cobro', label: `WhatsApp Cobro (${debtors.length})` },
            ].map(t => (
              <Button
                key={t.id}
                type="button"
                variant="ghost"
                onClick={() => setTab(t.id as typeof tab)}
                className={`px-4 py-2.5 text-sm border-b-2 rounded-none h-auto font-normal
                  ${tab === t.id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground'}`}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        {tab === 'payments' && (
          <DataTable
            columns={paymentColumns}
            data={payments}
            isLoading={isLoading}
            searchPlaceholder="Buscar pago..."
          />
        )}

        {tab === 'cobro' && (
          <div>
            {isLoading && <div className="text-center py-8 text-muted-foreground">Cargando...</div>}
            {!isLoading && debtors.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">Todos los alumnos están al día.</div>
            )}
            <div className="space-y-3">
              {debtors.map(d => (
                <div key={d.enrollment_id} className="rounded-lg border p-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-medium">{d.student_name}</div>
                    <div className="text-sm text-muted-foreground">{d.group_code} · {d.enrollment_number}</div>
                    {d.student_phone && <div className="text-xs text-muted-foreground">{d.student_phone}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-destructive font-bold">{d.currency} {Number(d.remaining).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground">de {Number(d.price_agreed).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                    </div>
                    {d.wa_link && (
                      <a href={d.wa_link} target="_blank" rel="noopener noreferrer">
                        <Button type="button" size="sm" className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                          <MessageCircle className="mr-2 size-4" />WhatsApp
                        </Button>
                      </a>
                    )}
                    <Button type="button" variant="outline" size="sm"
                      onClick={() => router.push(`/backend/academy_payments/create?enrollment_id=${d.enrollment_id}`)}>
                      Registrar pago
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
