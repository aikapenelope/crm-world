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
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, Users } from 'lucide-react'

type Session = {
  id: string; group_id: string; session_number: number; session_date: string
  start_time: string; end_time: string; topic: string | null; session_type: string
  status: string; instructor_notes: string | null; attendance_count: number
}

type Enrollment = {
  id: string; student_name: string; status: string
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  theory: 'Teoría', practice: 'Práctica', exam: 'Examen',
  orientation: 'Orientación', makeup: 'Recuperación',
}

// Attendance status cycle: tap card to cycle through states
const STATUS_CYCLE = ['present', 'late', 'excused', 'absent']

type AttStatus = 'present' | 'late' | 'excused' | 'absent'

const STATUS_CONFIG: Record<AttStatus, {
  label: string
  bg: string
  border: string
  avatar: string
  text: string
  icon: React.ElementType
}> = {
  present: {
    label: 'Presente',
    bg: 'bg-primary/10',
    border: 'border-primary/50',
    avatar: 'bg-primary text-primary-foreground',
    text: 'text-primary',
    icon: CheckCircle2,
  },
  late: {
    label: 'Tarde',
    bg: 'bg-status-warning-bg',
    border: 'border-status-warning-border',
    avatar: 'bg-status-warning-text text-white',
    text: 'text-status-warning-text',
    icon: Clock,
  },
  excused: {
    label: 'Justificado',
    bg: 'bg-muted/40',
    border: 'border-border',
    avatar: 'bg-muted-foreground/40 text-background',
    text: 'text-muted-foreground',
    icon: AlertCircle,
  },
  absent: {
    label: 'Ausente',
    bg: 'bg-destructive/10',
    border: 'border-destructive/40',
    avatar: 'bg-destructive text-destructive-foreground',
    text: 'text-destructive',
    icon: XCircle,
  },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
}

export default function AcademySessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [session, setSession] = React.useState<Session | null>(null)
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  const [attendance, setAttendance] = React.useState<Record<string, AttStatus>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [topic, setTopic] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [sessionType, setSessionType] = React.useState('theory')

  async function load() {
    setIsLoading(true)
    const sRes = await apiCall<{ items: Session[] }>(
      `/api/academy-sessions/sessions?id=${sessionId}`, undefined, { fallback: { items: [] } })
    const s = sRes.result?.items?.[0] ?? null
    setSession(s)
    if (s) {
      setTopic(s.topic ?? '')
      setNotes(s.instructor_notes ?? '')
      setSessionType(s.session_type)

      const [eRes, aRes] = await Promise.all([
        apiCall<{ items: Enrollment[] }>(
          `/api/academy-enrollments/enrollments?group_id=${s.group_id}&pageSize=200`,
          undefined, { fallback: { items: [] } }),
        apiCall<{ items: { enrollment_id: string; status: string }[] }>(
          `/api/academy-attendance/attendance?session_id=${sessionId}&pageSize=200`,
          undefined, { fallback: { items: [] } }),
      ])
      const enrolled = (eRes.result?.items ?? []).filter(e => e.status === 'active' || e.status === 'completed')
      setEnrollments(enrolled)

      const map: Record<string, AttStatus> = {}
      for (const a of (aRes.result?.items ?? [])) {
        map[a.enrollment_id] = a.status as AttStatus
      }
      for (const e of enrolled) {
        if (!map[e.id]) map[e.id] = 'present'
      }
      setAttendance(map)
    }
    setIsLoading(false)
  }

  React.useEffect(() => { if (sessionId) load() }, [sessionId])

  function cycleStatus(enrollmentId: string) {
    setAttendance(prev => {
      const cur = prev[enrollmentId] ?? 'present'
      const idx = STATUS_CYCLE.indexOf(cur)
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] as AttStatus
      return { ...prev, [enrollmentId]: next }
    })
  }

  function markAll(status: AttStatus) {
    const updated: Record<string, AttStatus> = {}
    for (const e of enrollments) updated[e.id] = status
    setAttendance(updated)
  }

  async function handleSave() {
    if (!session) return
    setSaving(true)

    const records = enrollments.map(e => ({
      session_id: sessionId,
      enrollment_id: e.id,
      status: attendance[e.id] ?? 'present',
    }))

    const [attRes, sessRes] = await Promise.all([
      apiCall('/api/academy-attendance/attendance/bulk', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, records }),
      }),
      updateCrud('academy-sessions/sessions', {
        id: sessionId,
        status: 'completed',
        topic: topic || null,
        instructor_notes: notes || null,
        session_type: sessionType,
        attendance_count: records.filter(r => r.status === 'present' || r.status === 'late').length,
      }),
    ])

    if (attRes.ok && sessRes.ok) {
      flash('Sesión completada — asistencia guardada', 'success')
      await load()
    } else {
      flash('Error al guardar', 'error')
    }
    setSaving(false)
  }

  if (isLoading) return <LoadingMessage label="Cargando sesión..." />
  if (!session) return (
    <Page><PageBody>
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />Volver
      </Button>
      <p className="mt-4 text-muted-foreground">Sesión no encontrada.</p>
    </PageBody></Page>
  )

  const isCompleted = session.status === 'completed'
  const counts = {
    present: enrollments.filter(e => attendance[e.id] === 'present').length,
    late: enrollments.filter(e => attendance[e.id] === 'late').length,
    excused: enrollments.filter(e => attendance[e.id] === 'excused').length,
    absent: enrollments.filter(e => attendance[e.id] === 'absent').length,
  }
  const presentTotal = counts.present + counts.late
  const attendancePct = enrollments.length > 0
    ? Math.round((presentTotal / enrollments.length) * 100)
    : 0

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/backend/academy_groups/${session.group_id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Grupo
        </Button>

        {/* Session header */}
        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Sesión #{session.session_number}</h1>
              <Badge variant={isCompleted ? 'secondary' : 'outline'}>
                {isCompleted ? 'Completada' : 'Programada'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(session.session_date).toLocaleDateString('es-VE', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
              {' · '}{session.start_time} – {session.end_time}
            </p>
          </div>
          {!isCompleted && (
            <Button type="button" size="sm" onClick={handleSave} disabled={saving || enrollments.length === 0}>
              <CheckCircle2 className="mr-2 size-4" />
              {saving ? 'Guardando...' : 'Completar sesión'}
            </Button>
          )}
        </div>

        {/* Session info form */}
        <div className="rounded-lg border p-4 mb-6 space-y-4">
          <h3 className="text-sm font-semibold">Información</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tipo</label>
              <select value={sessionType} onChange={e => setSessionType(e.target.value)}
                disabled={isCompleted}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                {Object.entries(SESSION_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Tema de la clase</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                disabled={isCompleted}
                placeholder="Ej: Unit 3B — Past Perfect, Salsas madres..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notas del instructor</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              disabled={isCompleted} rows={2}
              placeholder="Observaciones, tareas, próxima clase..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
          </div>
        </div>

        {/* Attendance stats bar */}
        {enrollments.length > 0 && (
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Asistencia</span>
            </div>
            <div className="flex gap-2 flex-1 flex-wrap">
              {(Object.entries(counts) as [AttStatus, number][]).map(([s, n]) => {
                if (n === 0) return null
                const cfg = STATUS_CONFIG[s]
                const Icon = cfg.icon
                return (
                  <div key={s} className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                    <Icon className="size-3" />
                    {n} {cfg.label.toLowerCase()}{n > 1 && s === 'absent' ? 's' : ''}
                  </div>
                )
              })}
              <div className="ml-auto flex items-center gap-1.5 text-xs font-bold">
                <div
                  className="h-2 w-16 rounded-full bg-border overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full transition-all ${attendancePct >= 75 ? 'bg-primary' : 'bg-status-warning-text'}`}
                    style={{ width: `${attendancePct}%` }}
                  />
                </div>
                <span className={attendancePct < 75 ? 'text-status-warning-text' : ''}>{attendancePct}%</span>
              </div>
            </div>

            {/* Quick actions */}
            {!isCompleted && (
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2"
                  onClick={() => markAll('present')}>
                  Todos presentes
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs px-2"
                  onClick={() => markAll('absent')}>
                  Todos ausentes
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Hint for interactive mode */}
        {!isCompleted && enrollments.length > 0 && (
          <p className="text-xs text-muted-foreground mb-4">
            Toca una tarjeta para cambiar el estado: Presente → Tarde → Justificado → Ausente
          </p>
        )}

        {/* Attendance card grid */}
        {enrollments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No hay alumnos activos en este grupo.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {enrollments.map(e => {
              const status = attendance[e.id] ?? 'present'
              const cfg = STATUS_CONFIG[status]
              const Icon = cfg.icon
              const initials = getInitials(e.student_name)

              return (
                <Button
                  key={e.id}
                  type="button"
                  variant="ghost"
                  disabled={isCompleted}
                  onClick={() => cycleStatus(e.id)}
                  className={`
                    flex-col items-center gap-2 rounded-xl border-2 p-3 h-auto
                    transition-all duration-150 select-none
                    ${cfg.bg} ${cfg.border}
                    ${!isCompleted ? 'hover:scale-105 active:scale-95 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {/* Avatar with initials */}
                  <div className={`
                    flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold
                    transition-all duration-150 ${cfg.avatar}
                  `}>
                    {initials}
                  </div>

                  {/* Name */}
                  <div className="text-center">
                    <div className="text-xs font-medium leading-tight line-clamp-2">
                      {e.student_name.split(' ').slice(0, 2).join(' ')}
                    </div>
                  </div>

                  {/* Status */}
                  <div className={`flex items-center gap-1 text-xs font-semibold ${cfg.text}`}>
                    <Icon className="size-3" />
                    {cfg.label}
                  </div>
                </Button>
              )
            })}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
