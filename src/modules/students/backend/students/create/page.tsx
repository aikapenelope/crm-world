'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

export default function CreateStudentPage() {
  const router = useRouter()
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'personal',
        column: 1,
        title: 'Datos personales',
        fields: [
          { id: 'first_name', type: 'text', label: 'Nombre', required: true },
          { id: 'last_name', type: 'text', label: 'Apellido', required: true },
          { id: 'cedula', type: 'text', label: 'Cédula (si aplica)', placeholder: 'V-12345678' },
          { id: 'birth_date', type: 'text', label: 'Fecha de nacimiento', placeholder: 'YYYY-MM-DD' },
          {
            id: 'gender', type: 'select', label: 'Género',
            options: [
              { label: '— Seleccionar —', value: '' },
              { label: 'Masculino', value: 'masculino' },
              { label: 'Femenino', value: 'femenino' },
            ],
          },
          { id: 'blood_type', type: 'text', label: 'Tipo de sangre', placeholder: 'A+, O-, etc.' },
        ],
      },
      {
        id: 'academic',
        column: 2,
        title: 'Datos académicos',
        fields: [
          {
            id: 'grade_level', type: 'select', label: 'Grado', required: true,
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
            id: 'section', type: 'select', label: 'Sección', defaultValue: 'A',
            options: [
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
              { label: 'C', value: 'C' },
              { label: 'D', value: 'D' },
            ],
          },
          { id: 'enrollment_date', type: 'text', label: 'Fecha de inscripción', placeholder: 'YYYY-MM-DD' },
          { id: 'previous_school', type: 'text', label: 'Colegio anterior' },
        ],
      },
      {
        id: 'emergency',
        column: 1,
        title: 'Emergencia y salud',
        fields: [
          { id: 'emergency_contact_name', type: 'text', label: 'Contacto de emergencia' },
          { id: 'emergency_contact_phone', type: 'text', label: 'Teléfono de emergencia', placeholder: '+58 4XX-XXX-XXXX' },
          { id: 'medical_notes', type: 'textarea', label: 'Notas médicas' },
          { id: 'allergies', type: 'textarea', label: 'Alergias' },
        ],
      },
      {
        id: 'notes_group',
        column: 2,
        title: 'Notas',
        fields: [
          { id: 'notes', type: 'textarea', label: 'Observaciones generales' },
        ],
      },
    ],
    [],
  )

  return (
    <Page>
      <PageBody>
        <CrudForm
          title="Registrar Estudiante"
          backHref="/backend/students"
          fields={[] as import("@open-mercato/ui/backend/CrudForm").CrudField[]}
          groups={groups}
          submitLabel="Registrar"
          cancelHref="/backend/students"
          onSubmit={async (values) => {
            const payload: Record<string, unknown> = {
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
              enrollment_date: values.enrollment_date ? String(values.enrollment_date).trim() : null,
              previous_school: values.previous_school ? String(values.previous_school).trim() : null,
              emergency_contact_name: values.emergency_contact_name ? String(values.emergency_contact_name).trim() : null,
              emergency_contact_phone: values.emergency_contact_phone ? String(values.emergency_contact_phone).trim() : null,
              medical_notes: values.medical_notes ? String(values.medical_notes).trim() : null,
              allergies: values.allergies ? String(values.allergies).trim() : null,
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await createCrud('students/students', payload)
            flash('Estudiante registrado exitosamente', 'success')
            router.push('/backend/students')
          }}
        />
      </PageBody>
    </Page>
  )
}
