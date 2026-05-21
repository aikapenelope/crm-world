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
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

type Session = {
  id: string; group_id: string; session_number: number; session_date: string
  start_time: string; end_time: string; topic: string | null; session_type: string
  status: string; instructor_notes: string | null; attendance_count: number
}

type Enrollment = {
  id: string; student_name: string; status: string
}

type AttendanceRecord = {
  enrollment_id: string; status: string
}

const ATTENDANCE_STATUS = [
  { value: 'present', label: 'Presente', icon: CheckCircle2, color: 'text-primary' },
  { value: 'late', label: 'Tarde', icon: Clock, color: 'text-status-warning-icon' },
  { value: 'excused', label: 'Justificado', icon: AlertCircle, color: 'text-muted-foreground' },
  { value: 'absent', label: 'Ausente', icon: XCircle, color: 'text-destructive' },
]

const SESSION_TYPE_LABELS: Record<string, string> = {
  theory: 'Teoría', practice: 'Práctica', exam: 'Examen', orientation: 'Orientación', makeup: 'Recuperación',
}

export default function AcademySessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [session, setSession] = React.useState<Session | null>(null)
  const [enrollments, setEnrollments] = React.useState<Enrollment[]>([])
  const [attendance, setAttendance] = React.useState<Record<string, string>>({}) // enrollment_id → status
  const [existingAttendance, setExistingAttendance] = React.useState<AttendanceRecord[]>([])
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
        apiCall<{ items: AttendanceRecord[] }>(
          `/api/academy-attendance/attendance?session_id=${sessionId}&pageSize=200`,
          undefined, { fallback: { items: [] } }),
      ])
      const enrolled = (eRes.result?.items ?? []).filter(e => e.status === 'active' || e.status === 'completed')
      setEnrollments(enrolled)
      setExistingAttendance(aRes.result?.items ?? [])

      // Pre-fill attendance map
      const map: Record<string, string> = {}
      for (const a of (aRes.result?.items ?? [])) map[a.enrollment_id] = a.status
      // Default: present for everyone not yet recorded
      for (const e of enrolled) {
        if (!map[e.id]) map[e.id] = 'present'
      }
      setAttendance(map)
    }
    setIsLoading(false)
  }

  React.useEffect(() => { if (sessionId) load() }, [sessionId])

  async function handleSave() {
    if (!session) return
    setSaving(true)

    // Bulk save attendance
    const records = enrollments.map(e => ({
      session_id: sessionId,
      enrollment_id: e.id,
      status: attendance[e.id] ?? 'present',
    }))

    const attendanceRes = await apiCall('/api/academy-attendance/attendance/bulk', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, records }),
    })

    // Update session status + topic + notes
    const sessionRes = await updateCrud('academy-sessions/sessions', {
      id: sessionId,
      status: 'completed',
      topic: topic || null,
      instructor_notes: notes || null,
      session_type: sessionType,
      attendance_count: records.filter(r => r.status === 'present' || r.status === 'late').length,
    })

    if (attendanceRes.ok && sessionRes.ok) {
      flash('Asistencia guardada y sesión completada', 'success')
      await load()
    } else {
      flash('Error al guardar asistencia', 'error')
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

  const presentCount = enrollments.filter(e => ['present', 'late'].includes(attendance[e.id] ?? 'present')).length
  const isCompleted = session.status === 'completed'

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push(`/backend/academy_groups/${session.group_id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Grupo
        </Button>

        <div className="mt-4 mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Sesión #{session.session_number}</h1>
              <Badge variant={isCompleted ? 'secondary' : 'outline'}>
                {isCompleted ? 'Completada' : 'Programada'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(session.session_date).toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}{session.start_time} – {session.end_time}
            </p>
          </div>
          {!isCompleted && (
            <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
              <CheckCircle2 className="mr-2 size-4" />
              {saving ? 'Guardando...' : 'Completar sesión'}
            </Button>
          )}
        </div>

        {/* Session metadata */}
        <div className="rounded-lg border p-4 mb-6 space-y-4">
          <h3 className="text-sm font-semibold">Información de la sesión</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tipo de sesión</label>
              <select
                value={sessionType}
                onChange={e => setSessionType(e.target.value)}
                disabled={isCompleted}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(SESSION_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Tema de la clase</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                disabled={isCompleted}
                placeholder="Ej: Unit 3B — Past Perfect, Técnicas de decoración..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Notas del instructor</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={isCompleted}
              rows={2}
              placeholder="Observaciones de la clase, tareas asignadas, próxima clase..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
        </div>

        {/* Attendance */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">
            Asistencia ({presentCount}/{enrollments.length} presentes)
          </h3>
          {!isCompleted && enrollments.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const allPresent: Record<string, string> = {}
                for (const e of enrollments) allPresent[e.id] = 'present'
                setAttendance(allPresent)
              }}
            >
              Todos presentes
            </Button>
          )}
        </div>

        {enrollments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No hay alumnos activos en este grupo.
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden divide-y">
            {enrollments.map(e => {
              const status = attendance[e.id] ?? 'present'
              return (
                <div key={e.id} className="flex items-center justify-between px-4 py-3">
                  <div className="font-medium text-sm">{e.student_name}</div>
                  <div className="flex gap-1">
                    {ATTENDANCE_STATUS.map(opt => {
                      const Icon = opt.icon
                      return (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={status === opt.value ? 'default' : 'ghost'}
                          size="sm"
                          disabled={isCompleted}
                          onClick={() => setAttendance(prev => ({ ...prev, [e.id]: opt.value }))}
                          className={`h-8 px-2 text-xs ${status !== opt.value ? 'text-muted-foreground' : ''}`}
                        >
                          <Icon className={`size-3 mr-1 ${status === opt.value ? '' : opt.color}`} />
                          {opt.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageBody>
    </Page>
  )
}
