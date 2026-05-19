'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { updateCrud } from '@open-mercato/ui/backend/utils/crud'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params?.id as string
  const { organizationId, tenantId } = useOrganizationScopeDetail()
  const [property, setProperty] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: any[] }>(
        `/api/properties?id=${propertyId}`,
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok && call.result?.items?.[0]) {
        setProperty(call.result.items[0])
      }
      setIsLoading(false)
    }
    if (propertyId) load()
  }, [propertyId])

  if (isLoading) return <LoadingMessage />
  if (!property) return <Page><PageBody><p>Propiedad no encontrada</p></PageBody></Page>

  const groups: CrudFormGroup[] = [
    {
      id: 'basic',
      column: 1,
      title: 'Información básica',
      fields: [
        { id: 'title', type: 'text', label: 'Título', required: true, defaultValue: property.title },
        { id: 'description', type: 'textarea', label: 'Descripción', defaultValue: property.description },
        {
          id: 'property_type', type: 'select', label: 'Tipo', required: true, defaultValue: property.property_type,
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
          id: 'operation', type: 'select', label: 'Operación', required: true, defaultValue: property.operation,
          options: [
            { label: 'Venta', value: 'venta' },
            { label: 'Alquiler', value: 'alquiler' },
            { label: 'Venta / Alquiler', value: 'venta_alquiler' },
          ],
        },
        {
          id: 'status', type: 'select', label: 'Estado', defaultValue: property.status,
          options: [
            { label: 'Borrador', value: 'draft' },
            { label: 'Activa', value: 'active' },
            { label: 'Reservada', value: 'reserved' },
            { label: 'Vendida', value: 'sold' },
            { label: 'Alquilada', value: 'rented' },
            { label: 'Inactiva', value: 'inactive' },
          ],
        },
      ],
    },
    {
      id: 'pricing',
      column: 2,
      title: 'Precio y comisión',
      fields: [
        { id: 'price', type: 'text', label: 'Precio', required: true, defaultValue: property.price },
        {
          id: 'currency', type: 'select', label: 'Moneda', defaultValue: property.currency,
          options: [
            { label: 'USD', value: 'USD' },
            { label: 'EUR', value: 'EUR' },
            { label: 'VES', value: 'VES' },
          ],
        },
        { id: 'commission_rate', type: 'text', label: 'Comisión (%)', defaultValue: property.commission_rate },
      ],
    },
    {
      id: 'specs',
      column: 2,
      title: 'Características',
      fields: [
        { id: 'area_m2', type: 'text', label: 'Área (m²)', defaultValue: property.area_m2 },
        { id: 'bedrooms', type: 'number', label: 'Habitaciones', defaultValue: property.bedrooms },
        { id: 'bathrooms', type: 'number', label: 'Baños', defaultValue: property.bathrooms },
        { id: 'parking', type: 'number', label: 'Estacionamientos', defaultValue: property.parking },
      ],
    },
    {
      id: 'location',
      column: 1,
      title: 'Ubicación',
      fields: [
        { id: 'address_line', type: 'text', label: 'Dirección', defaultValue: property.address_line },
        { id: 'city', type: 'text', label: 'Ciudad', required: true, defaultValue: property.city },
        { id: 'state', type: 'text', label: 'Estado', defaultValue: property.state },
        { id: 'country', type: 'text', label: 'País', defaultValue: property.country },
      ],
    },
    {
      id: 'notes',
      column: 1,
      title: 'Notas internas',
      fields: [
        { id: 'notes', type: 'textarea', label: 'Notas', defaultValue: property.notes },
      ],
    },
  ]

  return (
    <Page>
      <PageBody>
        <CrudForm
          title={property.title}
          backHref="/backend/properties"
          fields={[]}
          groups={groups}
          submitLabel="Guardar cambios"
          cancelHref="/backend/properties"
          onSubmit={async (values) => {
            const payload = {
              id: propertyId,
              organizationId,
              tenantId,
              title: String(values.title || '').trim(),
              description: values.description ? String(values.description).trim() : null,
              property_type: String(values.property_type),
              operation: String(values.operation),
              status: String(values.status),
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
              notes: values.notes ? String(values.notes).trim() : null,
            }

            await updateCrud('properties', payload)
            flash('Propiedad actualizada', 'success')
            router.push('/backend/properties')
          }}
        />
      </PageBody>
    </Page>
  )
}
