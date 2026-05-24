'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

export default function CreatePropertyPage() {
  const router = useRouter()
  const { organizationId, tenantId } = useOrganizationScopeDetail()

  const groups = React.useMemo<CrudFormGroup[]>(
    () => [
      {
        id: 'basic',
        column: 1,
        label: 'Información básica',
        fields: [
          { id: 'title', type: 'text', label: 'Título', required: true, placeholder: 'Ej: Apartamento en Las Mercedes' },
          { id: 'description', type: 'textarea', label: 'Descripción', placeholder: 'Descripción detallada de la propiedad...' },
          {
            id: 'property_type', type: 'select', label: 'Tipo', required: true,
            options: [
              { label: 'Apartamento', value: 'apartamento' },
              { label: 'Casa', value: 'casa' },
              { label: 'Terreno', value: 'terreno' },
              { label: 'Local Comercial', value: 'comercial' },
              { label: 'Oficina', value: 'oficina' },
              { label: 'Galpón', value: 'galpon' },
              { label: 'Otro', value: 'otro' },
            ],
          },
          {
            id: 'operation', type: 'select', label: 'Operación', required: true,
            options: [
              { label: 'Venta', value: 'venta' },
              { label: 'Alquiler', value: 'alquiler' },
              { label: 'Venta / Alquiler', value: 'venta_alquiler' },
            ],
          },
          {
            id: 'status', type: 'select', label: 'Estado', defaultValue: 'draft',
            options: [
              { label: 'Borrador', value: 'draft' },
              { label: 'Activa', value: 'active' },
            ],
          },
        ],
      },
      {
        id: 'pricing',
        column: 2,
        label: 'Precio y comisión',
        fields: [
          { id: 'price', type: 'text', label: 'Precio', required: true, placeholder: '150000' },
          {
            id: 'currency', type: 'select', label: 'Moneda', defaultValue: 'USD',
            options: [
              { label: 'USD', value: 'USD' },
              { label: 'EUR', value: 'EUR' },
              { label: 'VES', value: 'VES' },
            ],
          },
          { id: 'commission_rate', type: 'text', label: 'Comisión (%)', defaultValue: '5.00', placeholder: '5.00' },
        ],
      },
      {
        id: 'specs',
        column: 2,
        label: 'Características',
        fields: [
          { id: 'area_m2', type: 'text', label: 'Área (m²)', placeholder: '120' },
          { id: 'bedrooms', type: 'number', label: 'Habitaciones', min: 0, max: 50 },
          { id: 'bathrooms', type: 'number', label: 'Baños', min: 0, max: 30 },
          { id: 'parking', type: 'number', label: 'Estacionamientos', min: 0, max: 20 },
        ],
      },
      {
        id: 'location',
        column: 1,
        label: 'Ubicación',
        fields: [
          { id: 'address_line', type: 'text', label: 'Dirección', placeholder: 'Av. Principal, Edificio Torre Norte' },
          { id: 'city', type: 'text', label: 'Ciudad', required: true, placeholder: 'Caracas' },
          { id: 'state', type: 'text', label: 'Estado', placeholder: 'Distrito Capital' },
          { id: 'country', type: 'text', label: 'País', defaultValue: 'VE' },
        ],
      },
    ],
    [],
  )

  return (
    <Page>
      <PageBody>
        <CrudForm
          title="Nueva Propiedad"
          backHref="/backend/properties"
          fields={[]}
          groups={groups}
          submitLabel="Crear Propiedad"
          cancelHref="/backend/properties"
          onSubmit={async (values) => {
            const payload = {
              organizationId,
              tenantId,
              title: String(values.title || '').trim(),
              description: values.description ? String(values.description).trim() : null,
              property_type: String(values.property_type),
              operation: String(values.operation),
              status: String(values.status || 'draft'),
              price: String(values.price || '0'),
              currency: String(values.currency || 'USD'),
              commission_rate: String(values.commission_rate || '5.00'),
              area_m2: values.area_m2 ? String(values.area_m2) : null,
              bedrooms: values.bedrooms ? Number(values.bedrooms) : null,
              bathrooms: values.bathrooms ? Number(values.bathrooms) : null,
              parking: values.parking ? Number(values.parking) : null,
              address_line: values.address_line ? String(values.address_line).trim() : null,
              city: String(values.city || '').trim(),
              state: values.state ? String(values.state).trim() : null,
              country: String(values.country || 'VE'),
            }

            await createCrud('properties/properties', payload)
            flash('Propiedad creada exitosamente', 'success')
            router.push('/backend/properties')
          }}
        />
      </PageBody>
    </Page>
  )
}
