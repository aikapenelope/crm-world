'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

// Default course categories — configurable by academy type in setup.ts
const COURSE_CATEGORIES = [
  'Idiomas', 'Cocina', 'Repostería', 'Negocios / MBA', 'Tecnología',
  'Arte', 'Música', 'Fitness', 'Otro',
]

const COURSE_LEVELS = [
  'A1 – Principiante', 'A2 – Básico', 'B1 – Pre-intermedio', 'B2 – Intermedio',
  'C1 – Avanzado', 'C2 – Maestría', 'Nivel I', 'Nivel II', 'Nivel III', 'Profesional',
]

export default function AcademyCourseCreatePage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'basic',
      title: 'Información del curso',
      fields: [
        { id: 'name', label: 'Nombre del curso', type: 'text', required: true,
          placeholder: 'Ej: Inglés B1, Cocina Italiana Avanzada' },
        { id: 'description', label: 'Descripción', type: 'textarea',
          placeholder: 'Describe el contenido y objetivos del curso...' },
        { id: 'category', label: 'Categoría', type: 'select', required: true,
          options: COURSE_CATEGORIES.map(c => ({ value: c, label: c })) },
        { id: 'level', label: 'Nivel', type: 'select', required: true,
          options: COURSE_LEVELS.map(l => ({ value: l, label: l })) },
        { id: 'prerequisites', label: 'Prerequisitos', type: 'text',
          placeholder: 'Ej: Inglés A2 aprobado' },
      ],
    },
    {
      id: 'logistics',
      title: 'Logística',
      fields: [
        { id: 'duration_hours', label: 'Duración total (horas)', type: 'number',
          required: true, placeholder: '40' },
        { id: 'modality', label: 'Modalidad', type: 'select', required: true,
          options: [
            { value: 'in_person', label: 'Presencial' },
            { value: 'online', label: 'Online' },
            { value: 'hybrid', label: 'Híbrida' },
          ] },
        { id: 'max_students', label: 'Capacidad máxima por grupo', type: 'number',
          placeholder: '20' },
      ],
    },
    {
      id: 'pricing',
      title: 'Precio',
      fields: [
        { id: 'price_usd', label: 'Precio (USD)', type: 'number', required: true,
          placeholder: '150.00' },
        { id: 'is_active', label: 'Activo en catálogo', type: 'checkbox',
          defaultValue: true },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cursos
        </Button>

        <h1 className="mt-4 mb-6 text-2xl font-bold">Nuevo curso</h1>

        <CrudForm
          fields={[] as import("@open-mercato/ui/backend/CrudForm").CrudField[]}
          groups={groups}
          onSubmit={async (values) => {
            const res = await createCrud('academy-courses/courses', {
              ...values,
              currency: 'USD',
            })
            if (res.ok) {
              flash('Curso creado', 'success')
              router.push('/backend/academy_courses')
            } else {
              flash('Error al crear el curso', 'error')
            }
          }}
          onCancel={() => router.push('/backend/academy_courses')}
        />
      </PageBody>
    </Page>
  )
}
