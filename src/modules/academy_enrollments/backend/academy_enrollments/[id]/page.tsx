/**
 * AGM Exception: raw <form> — inline action panel in detail view
 *
 * This detail page renders a small form panel for an in-place action
 * (status update / payment recording) that appears conditionally within
 * a read-only detail view. CrudForm is designed for dedicated create/edit
 * pages, not for toggleable sub-panels within detail views.
 *
 * Acceptable to keep raw <form>. All other AGM rules apply.
 * Migrate to a dedicated action page + CrudForm if the form grows.
 */
'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { updateCrud } from '@open-mercato/ui/backend/utils/crud'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { ArrowLeft, CheckCircle2, MessageCircle, UserCheck } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type Enrollment = {
  id: string; enrollment_number: string; student_name: string; student_email: string | null
  student_phone: string | null; group_id: string; enrollment_date: string; status: string
  completion_date: string | null; final_grade: string | null; certificate_id: string | null
  price_agreed: string; currency: string; notes: string | null
}

type Payment = {
  id: string; payment_number: string; amount: string; currency: string
  payment_date: string; payment_method: string; reference: string | null; status: string
}

type AttendanceSummary = { total_sessions: number; attended: number }

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pend. pago', active: 'Activo',
  completed: 'Completado', withdrawn: 'Retirado', failed: 'Reprobado',
}
const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending_payment: 'outline', active: 'default',
  completed: 'secondary', withdrawn: 'secondary', failed: 'destructive',
}
const METHOD_LABELS: Record<string, string> = {
  transfer: 'Transferencia', cash_usd: 'Efectivo USD', zelle: 'Zelle',
  binance: 'Binance', mobile_payment: 'Pago móvil', card: 'Tarjeta',
}

export default function AcademyEnrollmentDetailPage() {
  const t = useT()
  const params = useParams()
  const router = useRouter()
  const enrollmentId = params?.id as string

  const [enrollment, setEnrollment] = React.useState<Enrollment | null>(null)
  const [groupCode, setGroupCode] = React.useState('')
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [attendance, setAttendance] = React.useState<AttendanceSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const [showCompleteForm, setShowCompleteForm] = React.useState(false)
  const [finalGrade, setFinalGrade] = React.useState('Aprobado')
  const [completing, setCompleting] = React.useState(false)
  const [activating, setActivating] = React.useState(false)

  async function load() {
    setIsLoading(true)
    const eRes = await apiCall<{ items: Enrollment[] }>(
      `/api/academy-enrollments/enrollments?id=${enrollmentId}`, undefined, { fallback: { items: [] } })
    const e = eRes.result?.items?.[0] ?? null
    setEnrollment(e)

    if (e) {
      const [gRes, pRes] = await Promise.all([
        apiCall<{ items: any[] }>(`/api/academy-groups/groups?id=${e.group_id}`, undefined, { fallback: { items: [] } }),
        apiCall<{ items: Payment[] }>(`/api/academy-payments/payments?enrollment_id=${enrollmentId}&pageSize=50`, undefined, { fallback: { items: [] } }),
      ])
      setGroupCode(gRes.result?.items?.[0]?.group_code ?? '')
      setPayments(pRes.result?.items ?? [])

      // Calculate attendance
      const sessionsRes = await apiCall<{ items: any[] }>(
        `/api/academy-sessions/sessions?group_id=${e.group_id}&pageSize=200&status=completed`,
        undefined, { fallback: { items: [] } })
      const sessions = sessionsRes.result?.items ?? []
      if (sessions.length > 0) {
        const attendRes = await apiCall<{ items: any[] }>(
          `/api/academy-attendance/attendance?enrollment_id=${enrollmentId}&pageSize=200`,
          undefined, { fallback: { items: [] } })
        const attended = (attendRes.result?.items ?? []).filter(a => ['present', 'late'].includes(a.status))
        setAttendance({ total_sessions: sessions.length, attended: attended.length })
      }
    }
    setIsLoading(false)
  }

  React.useEffect(() => { if (enrollmentId) load() }, [enrollmentId])

  async function handleActivate() {
    setActivating(true)
    const res = await updateCrud('academy-enrollments/enrollments', { id: enrollmentId, status: 'active' })
    if (res.ok) { flash(t('academy_enrollments.detail.activated', 'Inscripción activada'), 'success'); await load() }
    setActivating(false)
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault()
    setCompleting(true)
    const res = await apiCall('/api/academy-enrollments/enrollments/complete', {
      method: 'POST',
      body: JSON.stringify({ enrollment_id: enrollmentId, final_grade: finalGrade }),
    })
    if (res.ok) {
      flash(t('academy_enrollments.detail.completed', 'Inscripción completada — certificado generado'), 'success')
      setShowCompleteForm(false)
      await load()
    } else {
      flash(t('academy_enrollments.detail.complete_error', 'Error al completar'), 'error')
    }
    setCompleting(false)
  }

  if (isLoading) return <LoadingMessage label={t('academy_enrollments.detail.loading', 'Cargando inscripción...')} />
  if (!enrollment) return (
    <Page><PageBody>
      <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_enrollments')}>
        <ArrowLeft className="mr-2 h-4 w-4" />Volver
      </Button>
      <p className="mt-4 text-muted-foreground">{t('academy_enrollments.detail.not_found', 'Inscripción no encontrada.')}</p>
    </PageBody></Page>
  )

  const paidTotal = payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + Number(p.amount), 0)
  const remaining = Math.max(0, Number(enrollment.price_agreed) - paidTotal)
  const attendancePercent = attendance ? Math.round((attendance.attended / attendance.total_sessions) * 100) : null

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_enrollments')}>
          <ArrowLeft className="mr-2 h-4 w-4" />{t('academy_enrollments.detail.back', 'Inscripciones')}
        </Button>

        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="size-6 text-muted-foreground" />
              <h1 className="text-xl font-bold">{enrollment.student_name}</h1>
              <Badge variant={STATUS_VARIANTS[enrollment.status] ?? 'outline'}>
                {STATUS_LABELS[enrollment.status] ?? enrollment.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {enrollment.enrollment_number}
              {groupCode && ` · ${groupCode}`}
              {enrollment.student_phone && ` · ${enrollment.student_phone}`}
            </p>
            {enrollment.student_email && (
              <p className="text-xs text-muted-foreground">{enrollment.student_email}</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {enrollment.status === 'pending_payment' && (
              <Button type="button" size="sm" variant="outline" onClick={handleActivate} disabled={activating}>
                Activar inscripción
              </Button>
            )}
            {enrollment.status === 'active' && (
              <Button type="button" size="sm" onClick={() => setShowCompleteForm(v => !v)}>
                <CheckCircle2 className="mr-2 size-4" />
                Completar y certificar
              </Button>
            )}
            {enrollment.student_phone && (
              <a href={`https://wa.me/${enrollment.student_phone.replace(/\D/g, '')}?text=Hola ${encodeURIComponent(enrollment.student_name)}, `}
                target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline" size="sm" style={{ backgroundColor: 'rgba(37,211,102,0.1)', borderColor: 'rgba(37,211,102,0.3)' }}>
                  <MessageCircle className="mr-2 size-4" />WhatsApp
                </Button>
              </a>
            )}
            <Button type="button" variant="outline" size="sm"
              onClick={() => router.push(`/backend/academy_payments/create?enrollment_id=${enrollmentId}`)}>
              Registrar pago
            </Button>
          </div>
        </div>

        {/* Complete form */}
        {showCompleteForm && (
          <form onSubmit={handleComplete} className="rounded-lg border p-4 mb-6 bg-muted/20 space-y-3">
            <h3 className="font-semibold text-sm">Completar inscripción</h3>
            <div>
              <label className="text-sm font-medium block mb-1">Calificación final</label>
              <select value={finalGrade} onChange={e => setFinalGrade(e.target.value)}
                className="rounded-md border bg-background px-3 py-2 text-sm">
                <option>Aprobado</option>
                <option>Distinguido</option>
                <option>Sobresaliente</option>
                <option>Reprobado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCompleteForm(false)}>Cancelar</Button>
              <Button type="submit" size="sm" disabled={completing}>
                {completing ? 'Generando certificado...' : 'Confirmar y generar certificado'}
              </Button>
            </div>
          </form>
        )}

        {/* Progress rings */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Attendance ring */}
          <ProgressRing
            value={attendancePercent ?? 0}
            max={100}
            label="Asistencia"
            sublabel={attendance ? `${attendance.attended}/${attendance.total_sessions} clases` : '—'}
            color={attendancePercent !== null && attendancePercent < 75 ? 'warning' : 'primary'}
            suffix="%"
          />
          {/* Payment ring */}
          <ProgressRing
            value={paidTotal}
            max={Number(enrollment.price_agreed)}
            label="Cobrado"
            sublabel={remaining > 0 ? `Saldo: ${enrollment.currency} ${remaining.toFixed(2)}` : 'Al día ✓'}
            color={remaining > 0 ? 'destructive' : 'primary'}
            prefix={enrollment.currency + ' '}
            formatValue={(v) => v.toLocaleString('es-VE', { minimumFractionDigits: 0 })}
          />
          {/* Enrollment date card */}
          <div className="rounded-xl border p-4 flex flex-col items-center justify-center text-center gap-1">
            <div className="text-3xl font-black text-primary leading-none">
              {enrollment.status === 'completed' ? '✓' : enrollment.status === 'active' ? '▶' : '⏳'}
            </div>
            <div className="text-sm font-semibold mt-1">
              {STATUS_LABELS[enrollment.status] ?? enrollment.status}
            </div>
            <div className="text-xs text-muted-foreground">
              Desde {new Date(enrollment.enrollment_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Certificate info */}
        {enrollment.status === 'completed' && (
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <CheckCircle2 className="size-4" />
                Completado el {enrollment.completion_date ? new Date(enrollment.completion_date).toLocaleDateString('es-VE') : '—'}
              </div>
              {enrollment.final_grade && <p className="text-sm text-muted-foreground mt-0.5">Calificación: {enrollment.final_grade}</p>}
            </div>
            {enrollment.certificate_id && (
              <Button type="button" variant="outline" size="sm"
                onClick={() => router.push(`/backend/academy_certificates`)}>
                Ver certificado
              </Button>
            )}
          </div>
        )}

        {/* Payments */}
        <h3 className="font-semibold text-sm mb-3">Pagos ({payments.length})</h3>
        {payments.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            No hay pagos registrados.
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden divide-y mb-4">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">{p.payment_number}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.payment_date).toLocaleDateString('es-VE')} · {METHOD_LABELS[p.payment_method] ?? p.payment_method}
                    {p.reference && ` · ${p.reference}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{p.currency} {Number(p.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                  <Badge variant={p.status === 'confirmed' ? 'secondary' : 'outline'} className="text-xs">
                    {p.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {enrollment.notes && (
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-semibold mb-2">Notas</h3>
            <p className="text-sm text-muted-foreground">{enrollment.notes}</p>
          </div>
        )}
      </PageBody>
    </Page>
  )
}

// ─── SVG Progress Ring ────────────────────────────────────────────────────────
function ProgressRing({
  value, max, label, sublabel, color = 'primary', suffix = '', prefix = '', formatValue,
}: {
  value: number; max: number; label: string; sublabel: string
  color?: 'primary' | 'warning' | 'destructive'
  suffix?: string; prefix?: string; formatValue?: (v: number) => string
}) {
  const SIZE = 88; const STROKE = 7; const RADIUS = (SIZE - STROKE) / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const offset = CIRCUMFERENCE * (1 - pct)
  const COLOR = { primary: 'text-primary', warning: 'text-status-warning-text', destructive: 'text-destructive' }
  const TRACK = { primary: 'text-primary/15', warning: 'text-status-warning-text/20', destructive: 'text-destructive/15' }
  const displayValue = formatValue ? formatValue(value) : Math.round(value).toString()

  return (
    <div className="rounded-xl border p-4 flex flex-col items-center text-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width={SIZE} height={SIZE} className="-rotate-90">
          <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" strokeWidth={STROKE}
            className={`stroke-current ${TRACK[color] ?? TRACK.primary}`} />
          <circle cx={SIZE/2} cy={SIZE/2} r={RADIUS} fill="none" strokeWidth={STROKE}
            strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
            className={`stroke-current transition-all duration-700 ${COLOR[color] ?? COLOR.primary}`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-base font-black leading-none ${COLOR[color] ?? ''}`}>
            {prefix}{displayValue}{suffix}
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground leading-tight mt-0.5">{sublabel}</div>
      </div>
    </div>
  )
}
