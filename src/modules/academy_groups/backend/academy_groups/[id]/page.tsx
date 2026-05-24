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
import { useAppEvent } from '@open-mercato/ui/backend/injection/useAppEvent'
import {
  ArrowLeft, Calendar, Users, RefreshCw, Play, CheckCircle2, Clock, MessageCircle,
} from 'lucide-react'

type Group = {
  id: string; group_code: string; course_id: string; instructor_id: string | null
  start_date: string; end_date: string; schedule_days: string[]; schedule_time: string
  session_duration_minutes: number; location: string | null; online_link: string | null
  status: string; max_students: number; enrolled_count: number; sessions_count: number; notes: string | null
}

type Session = {
  id: string; session_number: number; session_date: string; start_time: string
  end_time: string; topic: string | null; session_type: string; status: string; attendance_count: number
}

type Enrollment = {
  id: string; student_name: string; status: string; enrollment_date: string; price_agreed: string; currency: string
}

type Tab = 'sessions' | 'students' | 'whatsapp'

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programado', in_progress: 'En curso', completed: 'Completado', cancelled: 'Cancelado',
}
const SESSION_TYPE_LABELS: Record<string, string> = {
  theory: 'Teoría', practice: 'Práctica', exam: 'Examen', orientation: 'Orientación', makeup: 'Recuperación',
}
const DAY_SHORT: Record<string, string> = {
  monday: 'L', tuesday: 'Ma', wednesday: 'Mi', thursday: 'J', friday: 'V', saturday: 'S', sunday: 'D',
}

export default function AcademyGroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params?.id as string
  const [tab, setTab] = React.useState<Tab>('sessions')
  const [group, setGroup] = React.useState<Group | null>(null)
  const [courseName, setCourseName] = React.useState('')
  const [instructorName, setInstructorName] = React.useState('')
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [advancing, setAdvancing] = React.useState(false)

  async function load() {
    setIsLoading(true)
    const [gRes, sRes, eRes] = await Promise.all([
      apiCall<{ items: Group[] }>(`/api/academy-groups/groups?id=${groupId}`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: Session[] }>(`/api/academy-sessions/sessions?group_id=${groupId}&pageSize=200`, undefined, { fallback: { items: [] } }),
      apiCall<{ items: Enrollment[] }>(`/api/academy-enrollments/enrollments?group_id=${groupId}&pageSize=200`, undefined, { fallback: { items: [] } }),
    ])
    const g = gRes.result?.items?.[0] ?? null
    setGroup(g)
    setSessions((sRes.result?.items ?? []).sort((a, b) => a.session_number - b.session_number))
    setEnrollments(eRes.result?.items ?? [])

    if (g) {
      const [cRes, iRes] = await Promise.all([
        g.course_id ? apiCall<{ items: any[] }>(`/api/academy-courses/courses?id=${g.course_id}`, undefined, { fallback: { items: [] } }) : Promise.resolve({ result: { items: [] } }),
        g.instructor_id ? apiCall<{ items: any[] }>(`/api/academy-instructors/instructors?id=${g.instructor_id}`, undefined, { fallback: { items: [] } }) : Promise.resolve({ result: { items: [] } }),
      ])
      setCourseName((cRes as any).result?.items?.[0]?.name ?? '')
      setInstructorName((iRes as any).result?.items?.[0]?.name ?? '')
    }
    setIsLoading(false)
  }

  React.useEffect(() => { if (groupId) load() }, [groupId])

  // Real-time: update enrolled count when a new enrollment is created in this group
  useAppEvent('academy_enrollments.enrollment.created', (event: any) => {
    if (event.payload?.group_id === groupId) {
      setGroup(prev => prev ? { ...prev, enrolled_count: prev.enrolled_count + 1 } : prev)
      setEnrollments(prev => {
        // Reload to get the new enrollment's full data
        void load()
        return prev
      })
    }
  }, [groupId])

  async function handleGenerateSessions() {
    setGenerating(true)
    const res = await apiCall('/api/academy-groups/groups/generate-sessions', {
      method: 'POST',
      body: JSON.stringify({ group_id: groupId }),
    })
    if (res.ok) {
      flash(`Sesiones generadas: ${(res.result as any)?.generated ?? 0} nuevas`, 'success')
      await load()
    } else {
      flash('Error al generar sesiones', 'error')
    }
    setGenerating(false)
  }

  async function handleAdvanceStatus() {
    if (!group) return
    const nextStatus: Record<string, string> = {
      scheduled: 'in_progress', in_progress: 'completed',
    }
    const next = nextStatus[group.status]
    if (!next) return
    setAdvancing(true)
    const res = await updateCrud('academy-groups/groups', { id: group.id, status: next })
    if (res.ok) {
      flash(`Grupo marcado como ${STATUS_LABELS[next]}`, 'success')
      await load()
    }
    setAdvancing(false)
  }

  if (isLoading) return <LoadingMessage label="Cargando grupo..." />
  if (!group) return (
    <Page><PageBody>
      <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_groups')}>
        <ArrowLeft className="mr-2 h-4 w-4" />Volver
      </Button>
      <p className="mt-4 text-muted-foreground">Grupo no encontrado.</p>
    </PageBody></Page>
  )

  const days = (group.schedule_days ?? []).map(d => DAY_SHORT[d] ?? d).join('/')
  const completedSessions = sessions.filter(s => s.status === 'completed').length
  const nextSession = sessions.find(s => s.status === 'scheduled')
  const nextStatus: Record<string, string> = { scheduled: 'in_progress', in_progress: 'completed' }

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_groups')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Grupos
        </Button>

        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{group.group_code}</h1>
              <Badge variant={group.status === 'in_progress' ? 'default' : 'outline'}>
                {STATUS_LABELS[group.status] ?? group.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {courseName && <span className="font-medium">{courseName} · </span>}
              {instructorName && <span>{instructorName} · </span>}
              {days} {group.schedule_time} · {group.session_duration_minutes} min
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(group.start_date).toLocaleDateString('es-VE')} → {new Date(group.end_date).toLocaleDateString('es-VE')}
              {group.location && ` · ${group.location}`}
            </p>
            {group.online_link && (
              <a href={group.online_link} target="_blank" rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-0.5 block">
                {group.online_link}
              </a>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {sessions.length === 0 && (
              <Button type="button" variant="outline" size="sm" onClick={handleGenerateSessions} disabled={generating}>
                <RefreshCw className="mr-2 size-4" />
                {generating ? 'Generando...' : 'Generar sesiones'}
              </Button>
            )}
            {nextStatus[group.status] && (
              <Button type="button" size="sm" onClick={handleAdvanceStatus} disabled={advancing}>
                <Play className="mr-2 size-4" />
                {group.status === 'scheduled' ? 'Iniciar grupo' : 'Completar grupo'}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm"
              onClick={() => router.push(`/backend/academy_enrollments/create?group_id=${group.id}`)}>
              <Users className="mr-2 size-4" />Inscribir alumno
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Alumnos</div>
            <div className="font-bold">{group.enrolled_count}/{group.max_students}</div>
            {group.enrolled_count >= group.max_students && (
              <div className="text-xs text-destructive">Lleno</div>
            )}
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Sesiones</div>
            <div className="font-bold">{completedSessions}/{sessions.length}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Próxima clase</div>
            <div className="text-sm font-medium">
              {nextSession ? new Date(nextSession.session_date).toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
            </div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Avance</div>
            <div className="font-bold">
              {sessions.length > 0 ? `${Math.round((completedSessions / sessions.length) * 100)}%` : '—'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-0">
            {([
              { id: 'sessions', title: `Sesiones (${sessions.length})` },
              { id: 'students', title: `Alumnos (${enrollments.length})` },
              { id: 'whatsapp', title: '💬 WhatsApp' },
            ] as const).map(t => (
              <Button
                key={t.id}
                type="button"
                variant="ghost"
                onClick={() => setTab(t.id as Tab)}
                className={`px-4 py-2.5 text-sm border-b-2 rounded-none h-auto font-normal transition-colors
                  ${tab === t.id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground'}`}
              >
                {t.title}
              </Button>
            ))}
          </div>
        </div>

        {/* Sessions */}
        {tab === 'sessions' && (
          <div>
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay sesiones. Usa el botón "Generar sesiones" para crearlas automáticamente.
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden divide-y">
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30"
                    onClick={() => router.push(`/backend/academy_sessions/${s.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
                        ${s.status === 'completed' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {s.session_number}
                      </span>
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(s.session_date).toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' '}· {s.start_time} – {s.end_time}
                        </div>
                        {s.topic && <div className="text-xs text-muted-foreground">{s.topic}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Badge variant="secondary" className="text-xs">{SESSION_TYPE_LABELS[s.session_type] ?? s.session_type}</Badge>
                      {s.status === 'completed' ? (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="size-3" />
                          {s.attendance_count} pres.
                        </span>
                      ) : s.status === 'cancelled' ? (
                        <Badge variant="destructive" className="text-xs">Cancelada</Badge>
                      ) : (
                        <Clock className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Students */}
        {tab === 'students' && (
          <div>
            {enrollments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No hay alumnos inscritos en este grupo.
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden divide-y">
                {enrollments.map(e => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="font-medium text-sm">{e.student_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Inscrito {new Date(e.enrollment_date).toLocaleDateString('es-VE')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-sm font-medium">
                        {e.currency} {Number(e.price_agreed).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </span>
                      <Badge variant={e.status === 'active' ? 'default' : e.status === 'completed' ? 'secondary' : 'outline'} className="text-xs">
                        {e.status === 'active' ? 'Activo' : e.status === 'completed' ? 'Completado' : e.status === 'pending_payment' ? 'Pend. pago' : e.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WHATSAPP TAB ──────────────────────────────────── */}
        {tab === 'whatsapp' && (
          <WhatsAppSection
            group={group}
            courseName={courseName}
            enrollments={enrollments}
            nextSession={nextSession ?? null}
          />
        )}
      </PageBody>
    </Page>
  )
}

// ─── WhatsApp section (separate component for clarity) ───────────────────────
function WhatsAppSection({
  group,
  courseName,
  enrollments,
  nextSession,
}: {
  group: { group_code: string; schedule_time: string; location: string | null; online_link: string | null }
  courseName: string
  enrollments: Enrollment[]
  nextSession: { session_date: string; start_time: string; session_number: number } | null
}) {
  const activeStudents = enrollments.filter(e => e.status === 'active')

  function buildClassReminderMsg(studentName: string): string {
    const parts = [`Hola ${studentName} 👋`]
    if (nextSession) {
      const dateStr = new Date(nextSession.session_date).toLocaleDateString('es-VE', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
      parts.push(`Te recordamos que tu clase de *${courseName}* (Sesión #${nextSession.session_number}) es *mañana ${dateStr}* a las *${nextSession.start_time}*.`)
    } else {
      parts.push(`Te recordamos que tienes clases de *${courseName}* (${group.group_code}).`)
    }
    if (group.location) parts.push(`📍 Ubicación: ${group.location}`)
    if (group.online_link) parts.push(`💻 Link: ${group.online_link}`)
    parts.push('¡Nos vemos! 🎓')
    return parts.join('\n')
  }

  function buildPaymentMsg(studentName: string): string {
    return [
      `Hola ${studentName} 👋`,
      `Te contactamos de *${courseName}* (${group.group_code}).`,
      `Notamos que tienes un pago pendiente en tu inscripción.`,
      `Por favor, escríbenos para coordinar tu pago o aclarar cualquier duda.`,
      `¡Gracias! 🙏`,
    ].join('\n')
  }

  function waLink(phone: string | null | undefined, message: string): string | null {
    if (!phone) return null
    const digits = phone.replace(/\D/g, '')
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="space-y-6">
      {/* Next class reminders */}
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-[#25D366]/10 border-b px-4 py-3 flex items-center gap-2">
          <MessageCircle className="size-4 text-[#25D366]" />
          <h3 className="font-semibold text-sm">Recordatorio de clase</h3>
          {nextSession && (
            <span className="ml-auto text-xs text-muted-foreground">
              Sesión #{nextSession.session_number} · {new Date(nextSession.session_date).toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        {activeStudents.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No hay alumnos activos en este grupo.
          </div>
        ) : (
          <div className="divide-y">
            {activeStudents.map(e => {
              const msg = buildClassReminderMsg(e.student_name)
              const phone = (e as any).student_phone
              const link = waLink(phone, msg)
              return (
                <div key={e.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">{e.student_name}</div>
                    {phone && <div className="text-xs text-muted-foreground">{phone}</div>}
                  </div>
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <Button type="button" size="sm"
                        className="bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                        <MessageCircle className="mr-2 size-3" />WhatsApp
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin teléfono</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Payment reminders */}
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-amber-50 dark:bg-status-warning-bg border-b px-4 py-3 flex items-center gap-2">
          <MessageCircle className="size-4 text-status-warning-icon" />
          <h3 className="font-semibold text-sm">Recordatorio de cobro</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            Para alumnos con saldo pendiente
          </span>
        </div>
        {activeStudents.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No hay alumnos activos.
          </div>
        ) : (
          <div className="divide-y">
            {enrollments.filter(e => e.status === 'pending_payment').map(e => {
              const msg = buildPaymentMsg(e.student_name)
              const phone = (e as any).student_phone
              const link = waLink(phone, msg)
              return (
                <div key={e.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-sm">{e.student_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.currency} {Number(e.price_agreed).toLocaleString('es-VE', { minimumFractionDigits: 2 })} pendiente
                    </div>
                  </div>
                  {link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <Button type="button" size="sm" variant="outline"
                        className="border-status-warning-border text-status-warning-text hover:bg-status-warning-bg">
                        <MessageCircle className="mr-2 size-3" />WhatsApp
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin teléfono</span>
                  )}
                </div>
              )
            })}
            {enrollments.filter(e => e.status === 'pending_payment').length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Sin alumnos con pago pendiente. ✅
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
