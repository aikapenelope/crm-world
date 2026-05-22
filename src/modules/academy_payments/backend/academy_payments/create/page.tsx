/**
 * AGM Exception: raw <form> — dynamic options + computed values from API
 *
 * This form loads select options from one or more API endpoints at runtime
 * and computes derived values (e.g. remaining balance, enriched labels).
 * CrudForm supports dynamic options arrays, but the pre-processing logic
 * (cross-joining multiple API results, computing derived fields) would require
 * a custom CrudFormGroupComponent that duplicates significant non-form logic.
 *
 * Acceptable to keep raw <form> here. All other AGM rules apply:
 * - Button / input components from @open-mercato/ui
 * - apiCall / createCrud for HTTP calls
 * - flash for feedback
 * Migrate when CrudForm adds an onBeforeRender hook for option enrichment.
 */
'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

const METHODS = [
  { value: 'transfer', label: 'Transferencia bancaria' },
  { value: 'zelle', label: 'Zelle' },
  { value: 'binance', label: 'Binance / USDT' },
  { value: 'cash_usd', label: 'Efectivo USD' },
  { value: 'cash_ves', label: 'Efectivo VES' },
  { value: 'mobile_payment', label: 'Pago móvil' },
  { value: 'card', label: 'Tarjeta de débito/crédito' },
]

export default function AcademyPaymentCreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetEnrollmentId = searchParams?.get('enrollment_id') ?? ''

  const [enrollments, setEnrollments] = React.useState<{ id: string; student_name: string; enrollment_number: string; remaining?: number }[]>([])
  const [enrollmentId, setEnrollmentId] = React.useState(presetEnrollmentId)
  const [amount, setAmount] = React.useState('')
  const [method, setMethod] = React.useState('transfer')
  const [reference, setReference] = React.useState('')
  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      const [eRes, pRes] = await Promise.all([
        apiCall<{ items: any[] }>('/api/academy-enrollments/enrollments?pageSize=200&status=active', undefined, { fallback: { items: [] } }),
        apiCall<{ items: any[] }>('/api/academy-payments/payments?pageSize=500', undefined, { fallback: { items: [] } }),
      ])
      const payments = pRes.result?.items ?? []
      const enriched = (eRes.result?.items ?? []).map((e: any) => {
        const paid = payments.filter((p: any) => p.enrollment_id === e.id && p.status === 'confirmed').reduce((s: number, p: any) => s + Number(p.amount), 0)
        return { ...e, remaining: Math.max(0, Number(e.price_agreed) - paid) }
      })
      setEnrollments(enriched)

      if (presetEnrollmentId) {
        const found = enriched.find((e: any) => e.id === presetEnrollmentId)
        if (found?.remaining) setAmount(found.remaining.toFixed(2))
      }
    }
    load()
  }, [presetEnrollmentId])

  function handleEnrollmentChange(id: string) {
    setEnrollmentId(id)
    const e = enrollments.find(e => e.id === id)
    if (e?.remaining !== undefined) setAmount(e.remaining.toFixed(2))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!enrollmentId || !amount || !method || !paymentDate) {
      flash('Completa todos los campos requeridos', 'error')
      return
    }
    setSaving(true)
    const res = await createCrud('academy-payments/payments', {
      enrollment_id: enrollmentId,
      amount,
      currency: 'USD',
      payment_method: method,
      reference: reference || null,
      payment_date: paymentDate,
      status: 'confirmed',
      notes: notes || null,
    })
    if (res.ok) {
      flash('Pago registrado', 'success')
      if (presetEnrollmentId) {
        router.push(`/backend/academy_enrollments/${presetEnrollmentId}`)
      } else {
        router.push('/backend/academy_payments')
      }
    } else {
      flash('Error al registrar el pago', 'error')
    }
    setSaving(false)
  }

  const selectedEnrollment = enrollments.find(e => e.id === enrollmentId)

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_payments')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Pagos
        </Button>
        <h1 className="mt-4 mb-6 text-2xl font-bold">Registrar pago</h1>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Alumno e inscripción</h3>
            <div>
              <label className="text-sm font-medium block mb-1">Inscripción *</label>
              <select value={enrollmentId} onChange={e => handleEnrollmentChange(e.target.value)} required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Seleccionar alumno...</option>
                {enrollments.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.student_name} — {e.enrollment_number}{e.remaining !== undefined ? ` (saldo: $${e.remaining.toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Detalles del pago</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Monto (USD) *</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  min="0.01" step="0.01" required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Fecha *</label>
                <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Método de pago *</label>
              <select value={method} onChange={e => setMethod(e.target.value)} required
                className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Referencia / Comprobante</label>
              <input type="text" value={reference} onChange={e => setReference(e.target.value)}
                placeholder="Número de referencia o confirmación"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Notas</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/academy_payments')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Confirmar pago'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
