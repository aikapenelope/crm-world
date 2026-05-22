/**
 * AGM Exception: raw <form> — multi-select checkbox group
 *
 * This form contains a multi-select checkbox group (schedule_days) that
 * lets users pick multiple values from a fixed set. CrudForm's 'select'
 * field type only supports single-value selection; a checkbox-group pattern
 * is not yet a built-in field type.
 *
 * Additionally, select options for course_id and instructor_id are loaded
 * from the API at runtime, requiring component-level async state.
 *
 * Acceptable to keep raw <form>. All other AGM rules apply.
 * Migrate when CrudForm adds 'checkbox-group' as a field type.
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

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lunes' }, { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' }, { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' }, { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
]

export default function AcademyGroupCreatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetCourseId = searchParams?.get('course_id') ?? ''

  const [courses, setCourses] = React.useState<{ id: string; name: string; max_students: number }[]>([])
  const [instructors, setInstructors] = React.useState<{ id: string; name: string }[]>([])

  const [courseId, setCourseId] = React.useState(presetCourseId)
  const [instructorId, setInstructorId] = React.useState('')
  const [groupCode, setGroupCode] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [scheduleDays, setScheduleDays] = React.useState<string[]>([])
  const [scheduleTime, setScheduleTime] = React.useState('18:00')
  const [durationMinutes, setDurationMinutes] = React.useState(90)
  const [location, setLocation] = React.useState('')
  const [onlineLink, setOnlineLink] = React.useState('')
  const [maxStudents, setMaxStudents] = React.useState(20)
  const [notes, setNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    async function load() {
      const [cRes, iRes] = await Promise.all([
        apiCall<{ items: any[] }>('/api/academy-courses/courses?pageSize=200&is_active=true', undefined, { fallback: { items: [] } }),
        apiCall<{ items: any[] }>('/api/academy-instructors/instructors?pageSize=100&is_active=true', undefined, { fallback: { items: [] } }),
      ])
      setCourses(cRes.result?.items ?? [])
      setInstructors(iRes.result?.items ?? [])
    }
    load()
  }, [])

  // Auto-generate group code when course + dates selected
  React.useEffect(() => {
    if (courseId && startDate) {
      const course = courses.find(c => c.id === courseId)
      if (course) {
        const code = course.name.substring(0, 8).toUpperCase().replace(/\s/g, '-')
        const monthYear = startDate.slice(0, 7).replace('-', '')
        setGroupCode(`${code}-${monthYear}`)
        setMaxStudents(course.max_students ?? 20)
      }
    }
  }, [courseId, startDate, courses])

  function toggleDay(day: string) {
    setScheduleDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId || !startDate || !endDate || scheduleDays.length === 0 || !scheduleTime) {
      flash('Completa todos los campos requeridos', 'error')
      return
    }
    setSaving(true)
    const res = await createCrud('academy-groups/groups', {
      group_code: groupCode,
      course_id: courseId,
      instructor_id: instructorId || null,
      start_date: startDate,
      end_date: endDate,
      schedule_days: scheduleDays,
      schedule_time: scheduleTime,
      session_duration_minutes: durationMinutes,
      location: location || null,
      online_link: onlineLink || null,
      max_students: maxStudents,
      notes: notes || null,
    })
    if (res.ok && (res.result as any)?.id) {
      const groupId = (res.result as any).id
      // Auto-generate sessions
      await apiCall('/api/academy-groups/groups/generate-sessions', {
        method: 'POST',
        body: JSON.stringify({ group_id: groupId }),
      })
      flash('Grupo creado con sesiones generadas', 'success')
      router.push(`/backend/academy_groups/${groupId}`)
    } else {
      flash('Error al crear el grupo', 'error')
    }
    setSaving(false)
  }

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_groups')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Grupos
        </Button>
        <h1 className="mt-4 mb-6 text-2xl font-bold">Nuevo grupo</h1>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {/* Course + Instructor */}
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Curso e instructor</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium block mb-1">Curso *</label>
                <select value={courseId} onChange={e => setCourseId(e.target.value)} required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Seleccionar...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Instructor</label>
                <select value={instructorId} onChange={e => setInstructorId(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                  <option value="">Sin asignar</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Código del grupo *</label>
              <input type="text" value={groupCode} onChange={e => setGroupCode(e.target.value)} required
                placeholder="Ej: ENG-B1-012027"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Fechas y horario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Fecha inicio *</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Fecha fin *</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Días de clase *</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS_OF_WEEK.map(d => (
                  <Button
                    key={d.value}
                    type="button"
                    variant={scheduleDays.includes(d.value) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleDay(d.value)}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Hora de inicio *</label>
                <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Duración por sesión (min)</label>
                <input type="number" value={durationMinutes} min={30} max={480}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold text-sm">Lugar</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium block mb-1">Aula / Salón</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Ej: Aula 3, Piso 2"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">Link online (Zoom/Meet)</label>
                <input type="text" value={onlineLink} onChange={e => setOnlineLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Capacidad máxima</label>
                <input type="number" value={maxStudents} min={1} max={500}
                  onChange={e => setMaxStudents(Number(e.target.value))}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Notas internas</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none" />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => router.push('/backend/academy_groups')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creando grupo...' : 'Crear grupo y generar sesiones'}
            </Button>
          </div>
        </form>
      </PageBody>
    </Page>
  )
}
