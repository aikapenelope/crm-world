'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

export default function CreateProjectPage() {
  const router = useRouter()

  const groups: CrudFormGroup[] = [
    {
      id: 'identity',
      title: 'Identificación del proyecto',
      fields: [
        { id: 'name', label: 'Nombre del proyecto', type: 'text', required: true },
        { id: 'code', label: 'Código', type: 'text', required: true, placeholder: 'PRO-001' },
        {
          id: 'project_type', label: 'Tipo', type: 'select', defaultValue: 'residential',
          options: [
            { value: 'residential', label: 'Residencial' },
            { value: 'commercial', label: 'Comercial' },
            { value: 'industrial', label: 'Industrial' },
            { value: 'infrastructure', label: 'Infraestructura' },
            { value: 'other', label: 'Otro' },
          ],
        },
        {
          id: 'status', label: 'Estado inicial', type: 'select', defaultValue: 'prospect',
          options: [
            { value: 'prospect', label: 'Prospecto' },
            { value: 'bidding', label: 'En licitación' },
            { value: 'active', label: 'Activo' },
            { value: 'on_hold', label: 'En espera' },
          ],
        },
      ],
    },
    {
      id: 'client',
      title: 'Cliente',
      fields: [
        { id: 'client_name', label: 'Nombre del cliente', type: 'text', required: true },
        {
          id: 'client_type', label: 'Tipo de cliente', type: 'select', defaultValue: 'private',
          options: [
            { value: 'private', label: 'Privado' },
            { value: 'public', label: 'Público / Gobierno' },
            { value: 'mixed', label: 'Mixto' },
          ],
        },
      ],
    },
    {
      id: 'location',
      title: 'Ubicación',
      fields: [
        { id: 'city', label: 'Ciudad', type: 'text' },
        { id: 'state', label: 'Estado', type: 'text' },
        { id: 'location', label: 'Dirección / sector', type: 'text' },
      ],
    },
    {
      id: 'contract',
      title: 'Contrato',
      fields: [
        { id: 'contract_number', label: 'Número de contrato', type: 'text' },
        {
          id: 'contract_type', label: 'Tipo de contrato', type: 'select', defaultValue: 'fixed_price',
          options: [
            { value: 'fixed_price', label: 'Precio fijo' },
            { value: 'cost_plus', label: 'Costo más margen' },
            { value: 'unit_price', label: 'Precio unitario' },
            { value: 'time_materials', label: 'Tiempo y materiales' },
          ],
        },
        { id: 'contract_amount', label: 'Monto del contrato', type: 'text', placeholder: '0.00' },
        {
          id: 'currency', label: 'Moneda', type: 'select', defaultValue: 'USD',
          options: [{ value: 'USD', label: 'USD' }, { value: 'VES', label: 'VES' }],
        },
        { id: 'advance_percent', label: 'Anticipo (%)', type: 'number', defaultValue: '0' },
        { id: 'retention_percent', label: 'Retención (%)', type: 'number', defaultValue: '10' },
      ],
    },
    {
      id: 'schedule',
      title: 'Cronograma y equipo',
      fields: [
        { id: 'start_date', label: 'Fecha de inicio', type: 'date' },
        { id: 'planned_end_date', label: 'Fecha de fin planificada', type: 'date' },
        { id: 'project_manager', label: 'Gerente de proyecto', type: 'text' },
        { id: 'site_supervisor', label: 'Residente de obra', type: 'text' },
        { id: 'description', label: 'Descripción', type: 'textarea' },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <h1 className="text-2xl font-bold mb-6">Nuevo Proyecto</h1>
        <CrudForm
          fields={[]}
          groups={groups}
          cancelHref="/backend/const_projects"
          onSubmit={async (values) => {
            await createCrud('const-projects/projects', {
              ...values,
              start_date: values.start_date || null,
              planned_end_date: values.planned_end_date || null,
              contract_number: values.contract_number || null,
              location: values.location || null,
              description: values.description || null,
              project_manager: values.project_manager || null,
              site_supervisor: values.site_supervisor || null,
              advance_percent: values.advance_percent || '0',
              retention_percent: values.retention_percent || '10',
            })
            flash('Proyecto creado exitosamente', 'success')
            router.push('/backend/const_projects')
          }}
        />
      </PageBody>
    </Page>
  )
}
