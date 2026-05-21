'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { ArrowLeft, MessageCircle, DollarSign, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

type ChargeRow = {
  id: string
  period_month: string
  concept: string
  amount: string
  currency: string
  status: string
  due_date: string
  amount_paid: string
  late_fee_applied: string
}

type StudentInfo = {
  id: string
  first_name: string
  last_name: string
  grade_level: string
  section: string
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  paid: <CheckCircle2 className="h-4 w-4 text-primary" />,
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  overdue: <AlertTriangle className="h-4 w-4 text-destructive" />,
  partial: <DollarSign className="h-4 w-4 text-status-warning-icon" />,
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
  overdue: 'Vencido',
  waived: 'Condonado',
}

const GRADE_LABELS: Record<string, string> = {
  maternal: 'Maternal', preescolar_1: 'Preescolar I', preescolar_2: 'Preescolar II',
  preescolar_3: 'Preescolar III', primaria_1: '1er Grado', primaria_2: '2do Grado',
  primaria_3: '3er Grado', primaria_4: '4to Grado', primaria_5: '5to Grado',
  primaria_6: '6to Grado', bachillerato_1: '1er Año', bachillerato_2: '2do Año',
  bachillerato_3: '3er Año', bachillerato_4: '4to Año', bachillerato_5: '5to Año',
}

export default function AccountStatementPage() {
  const searchParams = useSearchParams()
  const studentId = searchParams?.get('student_id')

  const [student, setStudent] = React.useState<StudentInfo | null>(null)
  const [charges, setCharges] = React.useState<ChargeRow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      if (!studentId) return
      setIsLoading(true)

      // Load student info
      const studentCall = await apiCall<{ items: StudentInfo[] }>(
        `/api/students/students?id=${studentId}`,
        undefined,
        { fallback: { items: [] } },
      )
      if (studentCall.ok && studentCall.result?.items?.[0]) {
        setStudent(studentCall.result.items[0])
      }

      // Load charges
      const chargesCall = await apiCall<{ items: ChargeRow[] }>(
        `/api/tuition/charges?student_id=${studentId}&pageSize=100`,
        undefined,
        { fallback: { items: [] } },
      )
      if (chargesCall.ok) {
        setCharges(chargesCall.result?.items ?? [])
      }

      setIsLoading(false)
    }
    load()
  }, [studentId])

  if (!studentId) {
    return <Page><PageBody><p>Especifique student_id en la URL</p></PageBody></Page>
  }

  if (isLoading) {
    return <Page><PageBody><div className="flex min-h-[300px] items-center justify-center"><Spinner /></div></PageBody></Page>
  }

  // Calculate totals
  const totalCharged = charges.reduce((s, c) => s + Number(c.amount), 0)
  const totalPaid = charges.reduce((s, c) => s + Number(c.amount_paid), 0)
  const totalOverdue = charges.filter((c) => c.status === 'overdue').reduce((s, c) => s + Number(c.amount) + Number(c.late_fee_applied), 0)
  const balance = totalCharged - totalPaid

  const fullName = student ? `${student.first_name} ${student.last_name}` : 'Estudiante'
  const gradeLabel = student ? (GRADE_LABELS[student.grade_level] ?? student.grade_level) : ''

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6">
          <Button type="button" variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{gradeLabel}</Badge>
                <Badge variant="secondary">Sección {student?.section ?? ''}</Badge>
              </div>
            </div>
            <Button
              type="button"
              className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
              onClick={() => {
                const text = `Estado de cuenta de ${fullName} (${gradeLabel}):\n\n` +
                  `Total cargado: USD ${totalCharged.toLocaleString('es-VE')}\n` +
                  `Total pagado: USD ${totalPaid.toLocaleString('es-VE')}\n` +
                  `Saldo pendiente: USD ${balance.toLocaleString('es-VE')}`
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
              }}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Enviar estado de cuenta
            </Button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-lg border p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Total cargado</div>
            <div className="text-xl font-bold">USD {totalCharged.toLocaleString('es-VE')}</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Total pagado</div>
            <div className="text-xl font-bold text-primary">USD {totalPaid.toLocaleString('es-VE')}</div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Saldo pendiente</div>
            <div className={`text-xl font-bold ${balance > 0 ? 'text-destructive' : 'text-primary'}`}>
              USD {balance.toLocaleString('es-VE')}
            </div>
          </div>
          <div className="rounded-lg border p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Vencido</div>
            <div className="text-xl font-bold text-destructive">
              USD {totalOverdue.toLocaleString('es-VE')}
            </div>
          </div>
        </div>

        {/* Charges Timeline */}
        <h2 className="text-lg font-semibold mb-3">Historial de cargos</h2>
        <div className="space-y-2">
          {charges.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin cargos registrados</p>
          ) : (
            charges.map((charge) => (
              <div
                key={charge.id}
                className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="shrink-0">
                  {STATUS_ICONS[charge.status] ?? STATUS_ICONS.pending}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{charge.period_month}</span>
                    <span className="text-sm text-muted-foreground">— {charge.concept === 'mensualidad' ? 'Mensualidad' : charge.concept}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Vence: {new Date(charge.due_date).toLocaleDateString('es-VE')}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-medium">
                    {charge.currency} {Number(charge.amount).toLocaleString('es-VE')}
                  </div>
                  {Number(charge.amount_paid) > 0 && (
                    <div className="text-xs text-primary">
                      Pagado: {charge.currency} {Number(charge.amount_paid).toLocaleString('es-VE')}
                    </div>
                  )}
                </div>
                <Badge
                  variant={charge.status === 'paid' ? 'default' : charge.status === 'overdue' ? 'destructive' : 'secondary'}
                  className="shrink-0"
                >
                  {STATUS_LABELS[charge.status] ?? charge.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </PageBody>
    </Page>
  )
}
