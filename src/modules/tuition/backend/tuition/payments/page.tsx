'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import { DollarSign, Receipt, MessageCircle } from 'lucide-react'

type PendingCharge = {
  id: string
  period_month: string
  concept: string
  amount: string
  currency: string
  status: string
  due_date: string
}

type StudentOption = {
  id: string
  first_name: string
  last_name: string
  grade_level: string
  section: string
}

export default function RegisterPaymentPage() {
  const router = useRouter()
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const [students, setStudents] = React.useState<StudentOption[]>([])
  const [selectedStudent, setSelectedStudent] = React.useState<string>('')
  const [pendingCharges, setPendingCharges] = React.useState<PendingCharge[]>([])
  const [selectedCharge, setSelectedCharge] = React.useState<string>('')
  const [lastPaymentId, setLastPaymentId] = React.useState<string | null>(null)

  // Load students
  React.useEffect(() => {
    async function load() {
      const call = await apiCall<{ items: StudentOption[] }>(
        '/api/students/students?pageSize=500&enrollment_status=active',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setStudents(call.result?.items ?? [])
      }
    }
    load()
  }, [])

  // Load pending charges when student selected
  React.useEffect(() => {
    async function load() {
      if (!selectedStudent) {
        setPendingCharges([])
        return
      }
      const call = await apiCall<{ items: PendingCharge[] }>(
        `/api/tuition/charges?student_id=${selectedStudent}&status=pending,overdue&pageSize=50`,
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setPendingCharges(call.result?.items ?? [])
        // Auto-select first charge
        if (call.result?.items?.[0]) {
          setSelectedCharge(call.result.items[0].id)
        }
      }
    }
    load()
  }, [selectedStudent])

  const selectedChargeData = pendingCharges.find((c) => c.id === selectedCharge)

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'payment',
        column: 1,
        title: 'Datos del pago',
        fields: [
          { id: 'amount', type: 'text', label: 'Monto pagado', required: true, placeholder: '150.00', defaultValue: selectedChargeData?.amount ?? '' },
          {
            id: 'currency', type: 'select', label: 'Moneda', defaultValue: 'USD',
            options: [
              { label: 'USD', value: 'USD' },
              { label: 'VES (Bolívares)', value: 'VES' },
              { label: 'EUR', value: 'EUR' },
              { label: 'USDT', value: 'USDT' },
            ],
          },
          {
            id: 'payment_method_code', type: 'select', label: 'Método de pago', required: true,
            options: [
              { label: 'Pago Móvil', value: 'pago_movil' },
              { label: 'Zelle', value: 'zelle' },
              { label: 'Binance (USDT)', value: 'binance' },
              { label: 'Transferencia', value: 'transferencia' },
              { label: 'Efectivo USD', value: 'efectivo_usd' },
              { label: 'Efectivo Bs.', value: 'efectivo_ves' },
              { label: 'Punto de Venta', value: 'debito' },
            ],
          },
          { id: 'reference', type: 'text', label: 'Referencia / Comprobante', placeholder: 'Número de referencia' },
          { id: 'payment_date', type: 'text', label: 'Fecha de pago', required: true, defaultValue: new Date().toISOString().split('T')[0], placeholder: 'YYYY-MM-DD' },
        ],
      },
      {
        id: 'exchange',
        column: 2,
        title: 'Tasa de cambio (si paga en VES)',
        fields: [
          { id: 'exchange_rate', type: 'text', label: 'Tasa USD/VES', placeholder: 'Ej: 36.50 (se llena automáticamente)' },
          { id: 'notes', type: 'textarea', label: 'Notas', placeholder: 'Observaciones del pago...' },
        ],
      },
    ],
    [selectedChargeData],
  )

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Registrar Pago</h1>
            <p className="text-sm text-muted-foreground">Seleccione el estudiante y registre el pago recibido</p>
          </div>
        </div>

        {/* Step 1: Select Student */}
        <div className="mb-6 rounded-lg border p-4">
          <label className="block text-sm font-medium mb-2">1. Seleccionar estudiante</label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={selectedStudent}
            onChange={(e) => { setSelectedStudent(e.target.value); setSelectedCharge('') }}
          >
            <option value="">— Buscar estudiante —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.last_name}, {s.first_name} — {s.grade_level} {s.section}
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Select Charge */}
        {selectedStudent && (
          <div className="mb-6 rounded-lg border p-4">
            <label className="block text-sm font-medium mb-2">2. Seleccionar cargo a pagar</label>
            {pendingCharges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Este estudiante no tiene cargos pendientes.</p>
            ) : (
              <div className="space-y-2">
                {pendingCharges.map((charge) => (
                  <label
                    key={charge.id}
                    className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
                      selectedCharge === charge.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="charge"
                      value={charge.id}
                      checked={selectedCharge === charge.id}
                      onChange={(e) => setSelectedCharge(e.target.value)}
                      className="accent-primary"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{charge.period_month}</span>
                      <span className="text-muted-foreground ml-2">— {charge.concept === 'mensualidad' ? 'Mensualidad' : charge.concept}</span>
                    </div>
                    <Badge variant={charge.status === 'overdue' ? 'destructive' : 'secondary'}>
                      {charge.status === 'overdue' ? 'Vencido' : 'Pendiente'}
                    </Badge>
                    <span className="font-bold">{charge.currency} {Number(charge.amount).toLocaleString('es-VE')}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Payment Form */}
        {selectedCharge && (
          <CrudForm
            title="3. Datos del pago"
            backHref="/backend/tuition"
            fields={[]}
            groups={groups}
            submitLabel="Registrar Pago"
            cancelHref="/backend/tuition"
            onSubmit={async (values) => {
              const payload = {
                organizationId,
                tenantId,
                charge_id: selectedCharge,
                student_id: selectedStudent,
                amount: String(values.amount),
                currency: String(values.currency || 'USD'),
                payment_method_code: String(values.payment_method_code),
                reference: values.reference ? String(values.reference).trim() : null,
                payment_date: String(values.payment_date),
                exchange_rate: values.exchange_rate ? String(values.exchange_rate) : null,
                notes: values.notes ? String(values.notes).trim() : null,
              }

              const result = await createCrud('tuition/payments', payload)
              const paymentId = (result as any)?.id ?? null
              setLastPaymentId(paymentId)
              flash('Pago registrado exitosamente', 'success')
            }}
          />
        )}

        {/* Post-payment actions */}
        {lastPaymentId && (
          <div className="mt-6 rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Receipt className="h-5 w-5 text-primary" />
              <span className="font-medium">Pago registrado correctamente</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/backend/tuition/receipt?payment_id=${lastPaymentId}`)}
              >
                <Receipt className="mr-2 h-4 w-4" />
                Ver Recibo
              </Button>
              <Button
                type="button"
                className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                onClick={() => router.push(`/backend/tuition/receipt?payment_id=${lastPaymentId}`)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar Recibo por WhatsApp
              </Button>
            </div>
          </div>
        )}
      </PageBody>
    </Page>
  )
}
