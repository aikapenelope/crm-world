'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import { ArrowLeft, Save, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type StudentRow = { id: string; first_name: string; last_name: string }
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'half_day'

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ReactNode; color: string }> = {
  present: { label: 'Presente', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-primary' },
  absent: { label: 'Ausente', icon: <XCircle className="h-4 w-4" />, color: 'text-destructive' },
  late: { label: 'Tardanza', icon: <Clock className="h-4 w-4" />, color: 'text-status-warning-icon' },
  excused: { label: 'Justificado', icon: <AlertTriangle className="h-4 w-4" />, color: 'text-muted-foreground' },
  half_day: { label: 'Medio día', icon: <Clock className="h-4 w-4" />, color: 'text-muted-foreground' },
}

const GRADE_OPTIONS = [
  { value: 'primaria_1', label: '1er Grado' },
  { value: 'primaria_2', label: '2do Grado' },
  { value: 'primaria_3', label: '3er Grado' },
  { value: 'primaria_4', label: '4to Grado' },
  { value: 'primaria_5', label: '5to Grado' },
  { value: 'primaria_6', label: '6to Grado' },
  { value: 'bachillerato_1', label: '1er Año' },
  { value: 'bachillerato_2', label: '2do Año' },
  { value: 'bachillerato_3', label: '3er Año' },
  { value: 'bachillerato_4', label: '4to Año' },
  { value: 'bachillerato_5', label: '5to Año' },
]

export default function DailyAttendancePage() {
  const t = useT()
  const { organizationId, tenantId } = useOrganizationScopeDetail()
  const today = new Date().toISOString().split('T')[0]

  const [gradeLevel, setGradeLevel] = React.useState('')
  const [section, setSection] = React.useState('A')
  const [date, setDate] = React.useState(today)
  const [students, setStudents] = React.useState<StudentRow[]>([])
  const [attendance, setAttendance] = React.useState<Record<string, AttendanceStatus>>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Load students
  React.useEffect(() => {
    async function load() {
      if (!gradeLevel) { setStudents([]); return }
      setIsLoading(true)
      const call = await apiCall<{ items: StudentRow[] }>(
        `/api/students/students?grade_level=${gradeLevel}&section=${section}&enrollment_status=active&pageSize=100`,
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        const sorted = (call.result?.items ?? []).sort((a, b) => a.last_name.localeCompare(b.last_name))
        setStudents(sorted)
        // Default all to present
        const defaults: Record<string, AttendanceStatus> = {}
        for (const s of sorted) defaults[s.id] = 'present'
        setAttendance(defaults)
      }
      setIsLoading(false)
    }
    load()
  }, [gradeLevel, section])

  // Mark all present
  const markAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {}
    for (const s of students) updated[s.id] = 'present'
    setAttendance(updated)
  }

  // Save
  const handleSave = async () => {
    setIsSaving(true)
    let saved = 0
    for (const student of students) {
      const status = attendance[student.id] ?? 'present'
      await apiCall('/api/attendance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          date,
          status,
          organizationId,
          tenantId,
        }),
      })
      saved++
    }
    flash(t('attendance.daily.saved', 'Asistencia guardada: {count} estudiantes para {date}').replace('{count}', String(saved)).replace('{date}', new Date(date).toLocaleDateString('es-VE')), 'success')
    setIsSaving(false)
  }

  // Stats
  const stats = React.useMemo(() => {
    const counts: Record<string, number> = { present: 0, absent: 0, late: 0, excused: 0, half_day: 0 }
    for (const status of Object.values(attendance)) counts[status] = (counts[status] ?? 0) + 1
    return counts
  }, [attendance])

  return (
    <Page>
      <PageBody>
        <div className="mb-6">
          <Button type="button" variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('attendance.daily.back', 'Volver')}
          </Button>
          <h1 className="mt-2 text-2xl font-bold">{t('attendance.daily.title', 'Registro de Asistencia')}</h1>
        </div>

        {/* Selectors */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('attendance.daily.date', 'Fecha')}</label>
            <input
              type="date"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('attendance.daily.grade', 'Grado')}</label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)}>
              <option value="">— Seleccionar —</option>
              {GRADE_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('attendance.daily.section', 'Sección')}</label>
            <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={section} onChange={(e) => setSection(e.target.value)}>
              {['A', 'B', 'C', 'D'].map((s) => <option key={s} value={s}>Sección {s}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={markAllPresent} disabled={students.length === 0}>
              {t('attendance.daily.all_present', 'Todos presentes')}
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving || students.length === 0}>
              {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? t('attendance.daily.saving', 'Guardando...') : t('attendance.daily.save', 'Guardar')}
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        {students.length > 0 && (
          <div className="mb-4 flex items-center gap-4 text-sm">
            <Badge variant="default">{stats.present} presentes</Badge>
            <Badge variant="destructive">{stats.absent} ausentes</Badge>
            <Badge variant="secondary">{stats.late} tardanzas</Badge>
            <Badge variant="outline">{stats.excused} justificados</Badge>
          </div>
        )}

        {/* Attendance Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : students.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left font-medium w-8">#</th>
                  <th className="px-4 py-3 text-left font-medium">Estudiante</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium">{student.last_name}, {student.first_name}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map((status) => {
                          const config = STATUS_CONFIG[status]
                          const isSelected = attendance[student.id] === status
                          return (
                            <button
                              key={status}
                              type="button"
                              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                                isSelected
                                  ? `${config.color} bg-muted font-medium ring-1 ring-current`
                                  : 'text-muted-foreground hover:bg-muted/50'
                              }`}
                              onClick={() => setAttendance((prev) => ({ ...prev, [student.id]: status }))}
                              title={config.label}
                            >
                              {config.icon}
                              <span className="hidden md:inline">{config.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : gradeLevel ? (
          <p className="text-center py-8 text-muted-foreground">{t('attendance.daily.no_students', 'No hay estudiantes activos en esta sección')}</p>
        ) : (
          <p className="text-center py-8 text-muted-foreground">{t('attendance.daily.select_grade', 'Seleccione grado y sección para pasar lista')}</p>
        )}
      </PageBody>
    </Page>
  )
}
