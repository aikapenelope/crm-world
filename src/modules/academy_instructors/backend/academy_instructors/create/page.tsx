'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { Button } from '@open-mercato/ui/primitives/button'
import { ArrowLeft } from 'lucide-react'

export default function AcademyInstructorCreatePage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'personal',
      title: 'Datos del instructor',
      fields: [
        { id: 'name', title: 'Nombre completo', type: 'text', required: true },
        { id: 'email', title: 'Email', type: 'text', placeholder: 'instructor@email.com' },
        { id: 'phone', title: 'Teléfono / WhatsApp', type: 'text', placeholder: '+58 412 000 0000' },
        { id: 'specialty', title: 'Especialidad', type: 'text',
          placeholder: 'Ej: Inglés americano, Repostería francesa' },
        { id: 'bio', title: 'Biografía corta', type: 'textarea',
          placeholder: 'Resumen de experiencia y certificaciones...' },
      ],
    },
    {
      id: 'work',
      title: 'Condiciones de trabajo',
      fields: [
        { id: 'hourly_rate_usd', title: 'Tarifa por hora (USD)', type: 'number',
          placeholder: '15.00' },
        { id: 'modalities', title: 'Modalidades que puede enseñar', type: 'multiselect',
          options: [
            { value: 'in_person', label: 'Presencial' },
            { value: 'online', label: 'Online' },
            { value: 'hybrid', label: 'Híbrida' },
          ] },
        { id: 'is_active', title: 'Activo', type: 'checkbox', defaultValue: true },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <Button variant="ghost" size="sm" onClick={() => router.push('/backend/academy_instructors')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Instructores
        </Button>

        <h1 className="mt-4 mb-6 text-2xl font-bold">Nuevo instructor</h1>

        <CrudForm
          groups={groups}
          onSubmit={async (values) => {
            const res = await createCrud('academy-instructors/instructors', values)
            if (res.ok) {
              flash('Instructor creado', 'success')
              router.push('/backend/academy_instructors')
            } else {
              flash('Error al crear el instructor', 'error')
            }
          }}
          onCancel={() => router.push('/backend/academy_instructors')}
        />
      </PageBody>
    </Page>
  )
}
