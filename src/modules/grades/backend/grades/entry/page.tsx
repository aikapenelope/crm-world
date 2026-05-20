'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import { Save, ArrowLeft } from 'lucide-react'

/**
 * Grade Entry Page — Grid for bulk note entry
 *
 * Flow:
 * 1. Select grade level + section + subject
 * 2. System loads all students in that section
 * 3. Grid: rows = students, column = score input
 * 4. Teacher fills scores, clicks Save
 * 5. All grades saved in bulk
 */

type StudentRow = { id: string; first_name: string; last_name: string }
type SubjectRow = { id: string; name: string; code: string; is_qualitative: boolean }

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

export default function GradeEntryPage() {
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const [gradeLevel, setGradeLevel] = React.useState('')
  const [section, setSection] = React.useState('A')
  const [subjectId, setSubjectId] = React.useState('')
  const [subjects, setSubjects] = React.useState<SubjectRow[]>([])
  const [students, setStudents] = React.useState<StudentRow[]>([])
  const [scores, setScores] = React.useState<Record<string, string>>({})
  const [observations, setObservations] = React.useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  // Load subjects
  React.useEffect(() => {
    async function load() {
      const call = await apiCall<{ items: SubjectRow[] }>(
        '/api/grades/subjects?pageSize=50&is_active=true',
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) setSubjects(call.result?.items ?? [])
    }
    load()
  }, [])

  // Load students when grade+section selected
  React.useEffect(() => {
    async function load() {
      if (!gradeLevel || !section) { setStudents([]); return }
      setIsLoading(true)
      const call = await apiCall<{ items: StudentRow[] }>(
        `/api/students/students?grade_level=${gradeLevel}&section=${section}&enrollment_status=active&pageSize=100`,
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        const sorted = (call.result?.items ?? []).sort((a, b) => a.last_name.localeCompare(b.last_name))
        setStudents(sorted)
        setScores({})
        setObservations({})
      }
      setIsLoading(false)
    }
    load()
  }, [gradeLevel, section])

  const selectedSubject = subjects.find((s) => s.id === subjectId)
  const isQualitative = selectedSubject?.is_qualitative ?? false

  // Save all grades
  const handleSave = async () => {
    if (!subjectId || students.length === 0) return
    setIsSaving(true)

    let saved = 0
    for (const student of students) {
      const score = scores[student.id]
      if (!score && !observations[student.id]) continue

      await apiCall('/api/grades/student-grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: student.id,
          subject_id: subjectId,
          period_id: null, // TODO: use active period
          score: isQualitative ? null : score || null,
          qualitative_score: isQualitative ? score || null : null,
          observations: observations[student.id] || null,
          organizationId,
          tenantId,
        }),
      })
      saved++
    }

    flash(`Guardadas ${saved} notas para ${selectedSubject?.name ?? 'materia'}`, 'success')
    setIsSaving(false)
  }

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6">
          <Button type="button" variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="mt-2 text-2xl font-bold">Cargar Notas</h1>
          <p className="text-sm text-muted-foreground">Seleccione grado, sección y materia para cargar notas</p>
        </div>

        {/* Selectors */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Grado</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
            >
              <option value="">— Seleccionar —</option>
              {GRADE_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sección</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              {['A', 'B', 'C', 'D'].map((s) => (
                <option key={s} value={s}>Sección {s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Materia</label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              <option value="">— Seleccionar —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              className="w-full"
              onClick={handleSave}
              disabled={isSaving || !subjectId || students.length === 0}
            >
              {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Notas
            </Button>
          </div>
        </div>

        {/* Info badge */}
        {selectedSubject && (
          <div className="mb-4">
            <Badge variant={isQualitative ? 'secondary' : 'outline'}>
              {isQualitative ? 'Cualitativa (A-E)' : 'Numérica (0-20)'}
            </Badge>
            <span className="ml-2 text-sm text-muted-foreground">
              {students.length} estudiantes en {GRADE_OPTIONS.find((g) => g.value === gradeLevel)?.label} - Sección {section}
            </span>
          </div>
        )}

        {/* Grade Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : students.length > 0 && subjectId ? (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-3 text-left font-medium w-8">#</th>
                  <th className="px-4 py-3 text-left font-medium">Estudiante</th>
                  <th className="px-4 py-3 text-center font-medium w-32">
                    {isQualitative ? 'Calificación' : 'Nota (0-20)'}
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <tr key={student.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-2 font-medium">{student.last_name}, {student.first_name}</td>
                    <td className="px-4 py-2 text-center">
                      {isQualitative ? (
                        <select
                          className="w-20 rounded border bg-background px-2 py-1 text-center text-sm"
                          value={scores[student.id] ?? ''}
                          onChange={(e) => setScores((prev) => ({ ...prev, [student.id]: e.target.value }))}
                        >
                          <option value="">—</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                          <option value="E">E</option>
                        </select>
                      ) : (
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          className="w-20 rounded border bg-background px-2 py-1 text-center text-sm"
                          value={scores[student.id] ?? ''}
                          onChange={(e) => setScores((prev) => ({ ...prev, [student.id]: e.target.value }))}
                          placeholder="—"
                        />
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        className="w-full rounded border bg-background px-2 py-1 text-sm"
                        value={observations[student.id] ?? ''}
                        onChange={(e) => setObservations((prev) => ({ ...prev, [student.id]: e.target.value }))}
                        placeholder="Opcional..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : gradeLevel && section && subjectId ? (
          <p className="text-center py-8 text-muted-foreground">No hay estudiantes activos en esta sección</p>
        ) : (
          <p className="text-center py-8 text-muted-foreground">Seleccione grado, sección y materia para comenzar</p>
        )}
      </PageBody>
    </Page>
  )
}
