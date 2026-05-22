'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Button } from '@open-mercato/ui/primitives/button'
import { BookOpen, Calendar, DollarSign, Award, MessageCircle } from 'lucide-react'

type Props = { params: { orgSlug: string } }


type EnrollmentData = {
  enrollment_id: string; enrollment_number: string; student_name: string
  course_name: string; group_code: string; schedule_days: string[]
  schedule_time: string; location: string | null; online_link: string | null
  start_date: string | null; end_date: string | null; status: string
  price_agreed: string; currency: string; paid_total: string; remaining: string
  final_grade: string | null; certificate_id: string | null
  next_session: { session_number: number; session_date: string; start_time: string; end_time: string; topic: string | null } | null
}

const DAY_SHORT: Record<string, string> = {
  monday: 'L', tuesday: 'Ma', wednesday: 'Mi', thursday: 'J', friday: 'V', saturday: 'S', sunday: 'D',
}

export default function AcademyPortalDashboard({ params }: Props) {
  const router = useRouter()
  const [enrollments, setEnrollments] = React.useState<EnrollmentData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [phone, setPhone] = React.useState<string | null>(null)

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const p = url.searchParams.get('phone') ?? url.searchParams.get('enrollment_id') ?? ''
    setPhone(p)
    if (!p) { setIsLoading(false); return }

    const paramKey = url.searchParams.get('enrollment_id') ? 'enrollment_id' : 'phone'

    async function load() {
      setIsLoading(true)
      const res = await apiCall<{ items: EnrollmentData[] }>(
        `/api/academy-portal/student?${paramKey}=${encodeURIComponent(p)}`,
        undefined, { fallback: { items: [] } })
      setEnrollments(res.result?.items ?? [])
      setIsLoading(false)
    }
    load()
  }, [])

  function portalUrl(page: string) {
    const url = new URL(window.location.href)
    const p = url.searchParams.get('phone') ?? ''
    const eid = url.searchParams.get('enrollment_id') ?? ''
    const param = eid ? `enrollment_id=${eid}` : `phone=${encodeURIComponent(p)}`
    return `/${params.orgSlug}/portal/${page}?${param}`
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>

  if (!phone || enrollments.length === 0) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <BookOpen className="size-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-bold mb-2">Portal del Estudiante</h2>
        <p className="text-muted-foreground text-sm">
          Accede con el link que te envió la academia.
        </p>
      </div>
    )
  }

  const student = enrollments[0]
  const activeEnrollments = enrollments.filter(e => e.status === 'active')
  const totalRemaining = enrollments.reduce((s, e) => s + Number(e.remaining), 0)
  const nextSession = enrollments.flatMap(e => e.next_session ? [{ ...e.next_session, course_name: e.course_name }] : [])
    .sort((a, b) => a.session_date.localeCompare(b.session_date))[0]

  return (
    <div className="mx-auto max-w-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{student.student_name}</h1>
        <p className="text-sm text-muted-foreground">Portal del estudiante</p>
      </div>

      {/* Next session card */}
      {nextSession && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 mb-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Próxima clase</div>
          <div className="font-bold text-lg">
            {new Date(nextSession.session_date).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="text-sm text-muted-foreground">
            {nextSession.start_time} · {nextSession.course_name}
            {nextSession.topic && <span className="ml-2">— {nextSession.topic}</span>}
          </div>
        </div>
      )}

      {/* Quick nav */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button type="button" variant="outline" className="h-auto flex-col gap-2 p-4"
          onClick={() => router.push(portalUrl('courses'))}>
          <BookOpen className="size-5" />
          <span className="text-xs">Mis cursos ({activeEnrollments.length})</span>
        </Button>
        <Button type="button" variant="outline" className="h-auto flex-col gap-2 p-4"
          onClick={() => router.push(portalUrl('schedule'))}>
          <Calendar className="size-5" />
          <span className="text-xs">Próximas clases</span>
        </Button>
        <Button type="button" variant="outline" className={`h-auto flex-col gap-2 p-4 ${totalRemaining > 0 ? 'border-destructive/40' : ''}`}
          onClick={() => router.push(portalUrl('payments'))}>
          <DollarSign className="size-5" />
          <span className="text-xs">
            {totalRemaining > 0 ? `Saldo: $${totalRemaining.toFixed(2)}` : 'Pagos al día'}
          </span>
        </Button>
        <Button type="button" variant="outline" className="h-auto flex-col gap-2 p-4"
          onClick={() => router.push(portalUrl('certificates'))}>
          <Award className="size-5" />
          <span className="text-xs">Mis certificados</span>
        </Button>
      </div>

      {/* Enrollments summary */}
      <h2 className="text-sm font-semibold mb-3">Mis inscripciones</h2>
      <div className="space-y-3">
        {enrollments.map(e => (
          <div key={e.enrollment_id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{e.course_name}</div>
                <div className="text-sm text-muted-foreground">
                  {e.group_code}
                  {e.schedule_days.length > 0 && ` · ${e.schedule_days.map(d => DAY_SHORT[d] ?? d).join('/')} ${e.schedule_time}`}
                </div>
                {e.next_session && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Clase #{e.next_session.session_number}: {new Date(e.next_session.session_date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
              <Badge variant={e.status === 'active' ? 'default' : e.status === 'completed' ? 'secondary' : 'outline'}>
                {e.status === 'active' ? 'Activo' : e.status === 'completed' ? 'Completado' : 'Pend. pago'}
              </Badge>
            </div>
            {e.online_link && (
              <a href={e.online_link} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-2 block">
                Unirse a la clase online →
              </a>
            )}
            {Number(e.remaining) > 0 && (
              <div className="mt-2 text-xs text-destructive font-medium">
                Saldo pendiente: {e.currency} {Number(e.remaining).toFixed(2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
