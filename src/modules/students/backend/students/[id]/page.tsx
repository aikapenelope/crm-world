'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { updateCrud } from '@open-mercato/ui/backend/utils/crud'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowLeft, User, Users, Download } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

type Representative = {
  id: string
  contact_id: string
  relationship: string
  is_primary: boolean
  is_authorized_pickup: boolean
  created_at: string
}

// =============================================================================
// Tab Navigation
// =============================================================================

const TABS = [
  { id: 'general', label: 'General', icon: User },
  { id: 'representatives', label: 'Representantes', icon: Users },
] as const

type TabId = typeof TABS[number]['id']

const RELATIONSHIP_LABELS: Record<string, string> = {
  padre: 'Padre',
  madre: 'Madre',
  abuelo: 'Abuelo',
  abuela: 'Abuela',
  tio: 'Tío',
  tia: 'Tía',
  tutor_legal: 'Tutor Legal',
  otro: 'Otro',
}

const GRADE_LABELS: Record<string, string> = {
  maternal: 'Maternal',
  preescolar_1: 'Preescolar I',
  preescolar_2: 'Preescolar II',
  preescolar_3: 'Preescolar III',
  primaria_1: '1er Grado',
  primaria_2: '2do Grado',
  primaria_3: '3er Grado',
  primaria_4: '4to Grado',
  primaria_5: '5to Grado',
  primaria_6: '6to Grado',
  bachillerato_1: '1er Año',
  bachillerato_2: '2do Año',
  bachillerato_3: '3er Año',
  bachillerato_4: '4to Año',
  bachillerato_5: '5to Año',
}

// =============================================================================
// Main Component
// =============================================================================

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params?.id as string
  const { organizationId, tenantId } = useOrganizationScopeDetail()
  const [student, setStudent] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<TabId>('general')

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: any[] }>(
        `/api/students/students?id=${studentId}`,
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok && call.result?.items?.[0]) {
        setStudent(call.result.items[0])
      }
      setIsLoading(false)
    }
    if (studentId) load()
  }, [studentId])

  if (isLoading) return <LoadingMessage label="Cargando estudiante..." />
  if (!student) return <Page><PageBody><p>Estudiante no encontrado</p></PageBody></Page>

  const fullName = `${student.first_name} ${student.last_name}`

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/backend/students')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a estudiantes
          </Button>
          <h1 className="mt-2 text-2xl font-bold">{fullName}</h1>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{GRADE_LABELS[student.grade_level] ?? student.grade_level}</Badge>
            <Badge variant="secondary">Sección {student.section}</Badge>
            <Badge>{student.enrollment_status === 'active' ? 'Activo' : student.enrollment_status}</Badge>
            <div className="ml-auto flex gap-2">
              <a href={`/api/grades/boleta-pdf?student_id=${studentId}`} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline" size="sm">
                  <Download className="mr-1.5 size-3.5" />
                  Boletín PDF
                </Button>
              </a>
              <a href={`/api/enrollment/constancia-pdf?student_id=${studentId}`} target="_blank" rel="noopener noreferrer">
                <Button type="button" variant="outline" size="sm">
                  <Download className="mr-1.5 size-3.5" />
                  Constancia PDF
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b">
          <nav className="flex gap-4">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-1 pb-3 h-auto text-sm font-medium rounded-none transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {((tab as any).title ?? (tab as any).label)}
                </Button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <GeneralTab
            student={student}
            studentId={studentId}
            organizationId={organizationId ?? ''}
            tenantId={tenantId ?? ''}
            router={router}
          />
        )}
        {activeTab === 'representatives' && <RepresentativesTab studentId={studentId} />}
      </PageBody>
    </Page>
  )
}

// =============================================================================
// General Tab
// =============================================================================

function GeneralTab({ student, studentId, organizationId, tenantId, router }: {
  student: any
  studentId: string
  organizationId: string
  tenantId: string
  router: any
}) {
  const groups: CrudFormGroup[] = [
    {
      id: 'personal',
      column: 1,
      title: 'Datos personales',
      fields: [
        { id: 'first_name', type: 'text', label: 'Nombre', required: true, defaultValue: student.first_name },
        { id: 'last_name', type: 'text', label: 'Apellido', required: true, defaultValue: student.last_name },
        { id: 'cedula', type: 'text', label: 'Cédula', defaultValue: student.cedula },
        { id: 'birth_date', type: 'text', label: 'Fecha de nacimiento', defaultValue: student.birth_date },
        {
          id: 'gender', type: 'select', label: 'Género', defaultValue: student.gender,
          options: [
            { label: '— Seleccionar —', value: '' },
            { label: 'Masculino', value: 'masculino' },
            { label: 'Femenino', value: 'femenino' },
          ],
        },
        { id: 'blood_type', type: 'text', label: 'Tipo de sangre', defaultValue: student.blood_type },
      ],
    },
    {
      id: 'academic',
      column: 2,
      title: 'Datos académicos',
      fields: [
        {
          id: 'grade_level', type: 'select', label: 'Grado', required: true, defaultValue: student.grade_level,
          options: [
            { label: 'Maternal', value: 'maternal' },
            { label: 'Preescolar I', value: 'preescolar_1' },
            { label: 'Preescolar II', value: 'preescolar_2' },
            { label: 'Preescolar III', value: 'preescolar_3' },
            { label: '1er Grado', value: 'primaria_1' },
            { label: '2do Grado', value: 'primaria_2' },
            { label: '3er Grado', value: 'primaria_3' },
            { label: '4to Grado', value: 'primaria_4' },
            { label: '5to Grado', value: 'primaria_5' },
            { label: '6to Grado', value: 'primaria_6' },
            { label: '1er Año', value: 'bachillerato_1' },
            { label: '2do Año', value: 'bachillerato_2' },
            { label: '3er Año', value: 'bachillerato_3' },
            { label: '4to Año', value: 'bachillerato_4' },
            { label: '5to Año', value: 'bachillerato_5' },
          ],
        },
        {
          id: 'section', type: 'select', label: 'Sección', defaultValue: student.section,
          options: [
            { label: 'A', value: 'A' },
            { label: 'B', value: 'B' },
            { label: 'C', value: 'C' },
            { label: 'D', value: 'D' },
          ],
        },
        {
          id: 'enrollment_status', type: 'select', label: 'Estado', defaultValue: student.enrollment_status,
          options: [
            { label: 'Activo', value: 'active' },
            { label: 'Graduado', value: 'graduated' },
            { label: 'Retirado', value: 'withdrawn' },
            { label: 'Suspendido', value: 'suspended' },
            { label: 'Transferido', value: 'transferred' },
          ],
        },
        { id: 'previous_school', type: 'text', label: 'Colegio anterior', defaultValue: student.previous_school },
      ],
    },
    {
      id: 'emergency',
      column: 1,
      title: 'Emergencia y salud',
      fields: [
        { id: 'emergency_contact_name', type: 'text', label: 'Contacto de emergencia', defaultValue: student.emergency_contact_name },
        { id: 'emergency_contact_phone', type: 'text', label: 'Teléfono de emergencia', defaultValue: student.emergency_contact_phone },
        { id: 'medical_notes', type: 'textarea', label: 'Notas médicas', defaultValue: student.medical_notes },
        { id: 'allergies', type: 'textarea', label: 'Alergias', defaultValue: student.allergies },
      ],
    },
    {
      id: 'notes_group',
      column: 2,
      title: 'Notas',
      fields: [
        { id: 'notes', type: 'textarea', label: 'Observaciones', defaultValue: student.notes },
      ],
    },
  ]

  return (
    <CrudForm
      title=""
      backHref=""
      fields={[]}
      groups={groups}
      submitLabel="Guardar cambios"
      cancelHref="/backend/students"
      onSubmit={async (values) => {
        const payload = {
          id: studentId,
          organizationId,
          tenantId,
          first_name: String(values.first_name || '').trim(),
          last_name: String(values.last_name || '').trim(),
          cedula: values.cedula ? String(values.cedula).trim() : null,
          birth_date: values.birth_date ? String(values.birth_date).trim() : null,
          gender: values.gender || null,
          blood_type: values.blood_type ? String(values.blood_type).trim() : null,
          grade_level: String(values.grade_level),
          section: String(values.section || 'A'),
          enrollment_status: String(values.enrollment_status || 'active'),
          previous_school: values.previous_school ? String(values.previous_school).trim() : null,
          emergency_contact_name: values.emergency_contact_name ? String(values.emergency_contact_name).trim() : null,
          emergency_contact_phone: values.emergency_contact_phone ? String(values.emergency_contact_phone).trim() : null,
          medical_notes: values.medical_notes ? String(values.medical_notes).trim() : null,
          allergies: values.allergies ? String(values.allergies).trim() : null,
          notes: values.notes ? String(values.notes).trim() : null,
        }

        await updateCrud('students/students', payload)
        flash('Estudiante actualizado', 'success')
        router.push('/backend/students')
      }}
    />
  )
}

// =============================================================================
// Representatives Tab
// =============================================================================

function RepresentativesTab({ studentId }: { studentId: string }) {
  const [reps, setReps] = React.useState<Representative[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: Representative[] }>(
        `/api/students/student-representatives?student_id=${studentId}`,
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setReps(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [studentId])

  const columns: ColumnDef<Representative>[] = [
    {
      accessorKey: 'contact_id',
      header: 'Contacto',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.contact_id.slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'relationship',
      header: 'Parentesco',
      cell: ({ row }) => (
        <Badge variant="outline">
          {RELATIONSHIP_LABELS[row.original.relationship] ?? row.original.relationship}
        </Badge>
      ),
    },
    {
      accessorKey: 'is_primary',
      header: 'Principal',
      cell: ({ row }) => row.original.is_primary ? <Badge>Principal</Badge> : '—',
    },
    {
      accessorKey: 'is_authorized_pickup',
      header: 'Retiro',
      cell: ({ row }) => row.original.is_authorized_pickup ? <Badge variant="secondary">Autorizado</Badge> : '—',
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
    },
  ]

  return (
    <DataTable
      title="Representantes vinculados"
      columns={columns}
      data={reps}
      isLoading={isLoading}
      searchPlaceholder="Buscar representantes..."
    />
  )
}
