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
import { ArrowLeft, Image, Link2, FileText, Users } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

type PropertyImage = {
  id: string
  attachment_id: string
  sort_order: number
  is_cover: boolean
  created_at: string
}

type PropertyLink = {
  id: string
  platform: string
  url: string
  label: string | null
  created_at: string
}

type MatchResult = {
  id: string
  contact_id: string
  score: number
  is_dismissed: boolean
  created_at: string
}

// =============================================================================
// Tab Navigation
// =============================================================================

const TABS = [
  { id: 'general', label: 'General', icon: FileText },
  { id: 'images', label: 'Imágenes', icon: Image },
  { id: 'links', label: 'Links', icon: Link2 },
  { id: 'matching', label: 'Matching', icon: Users },
] as const

type TabId = typeof TABS[number]['id']

// =============================================================================
// Main Component
// =============================================================================

export default function PropertyDetailPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params?.id as string
  const { organizationId, tenantId } = useOrganizationScopeDetail()
  const [property, setProperty] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<TabId>('general')

  // Load property data
  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: any[] }>(
        `/api/properties/properties?id=${propertyId}`,
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

  if (isLoading) return <LoadingMessage label="Cargando propiedad..." />
  if (!property) return <Page><PageBody><p>Propiedad no encontrada</p></PageBody></Page>

  return (
    <Page>
      <PageBody>
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/backend/properties')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a propiedades
          </Button>
          <h1 className="mt-2 text-2xl font-bold">{property.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">{property.property_type}</Badge>
            <Badge variant="outline">{property.operation}</Badge>
            <Badge>{property.status}</Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b">
          <nav className="flex gap-4">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <GeneralTab
            property={property}
            propertyId={propertyId}
            organizationId={organizationId ?? ''}
            tenantId={tenantId ?? ''}
            router={router}
          />
        )}
        {activeTab === 'images' && <ImagesTab propertyId={propertyId} />}
        {activeTab === 'links' && <LinksTab propertyId={propertyId} />}
        {activeTab === 'matching' && <MatchingTab propertyId={propertyId} />}
      </PageBody>
    </Page>
  )
}

// =============================================================================
// General Tab (existing edit form)
// =============================================================================

function GeneralTab({ property, propertyId, organizationId, tenantId, router }: {
  property: any
  propertyId: string
  organizationId: string
  tenantId: string
  router: any
}) {
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
    <CrudForm
      title=""
      backHref=""
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

        await updateCrud('properties/properties', payload)
        flash('Propiedad actualizada', 'success')
        router.push('/backend/properties')
      }}
    />
  )
}

// =============================================================================
// Images Tab
// =============================================================================

function ImagesTab({ propertyId }: { propertyId: string }) {
  const [images, setImages] = React.useState<PropertyImage[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: PropertyImage[] }>(
        `/api/properties/property-images?property_id=${propertyId}`,
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setImages(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [propertyId])

  const columns: ColumnDef<PropertyImage>[] = [
    {
      accessorKey: 'sort_order',
      header: 'Orden',
    },
    {
      accessorKey: 'is_cover',
      header: 'Portada',
      cell: ({ row }) => row.original.is_cover ? <Badge>Portada</Badge> : '—',
    },
    {
      accessorKey: 'attachment_id',
      header: 'Archivo',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.attachment_id.slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
    },
  ]

  return (
    <DataTable
      title="Imágenes"
      columns={columns}
      data={images}
      isLoading={isLoading}
      searchPlaceholder="Buscar imágenes..."
    />
  )
}

// =============================================================================
// Links Tab
// =============================================================================

function LinksTab({ propertyId }: { propertyId: string }) {
  const [links, setLinks] = React.useState<PropertyLink[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: PropertyLink[] }>(
        `/api/properties/property-links?property_id=${propertyId}`,
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setLinks(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [propertyId])

  const platformLabels: Record<string, string> = {
    mercadolibre: 'MercadoLibre',
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    otro: 'Otro',
  }

  const columns: ColumnDef<PropertyLink>[] = [
    {
      accessorKey: 'platform',
      header: 'Plataforma',
      cell: ({ row }) => <Badge variant="outline">{platformLabels[row.original.platform] ?? row.original.platform}</Badge>,
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <a href={row.original.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
          {row.original.url.length > 50 ? `${row.original.url.slice(0, 50)}...` : row.original.url}
        </a>
      ),
    },
    {
      accessorKey: 'label',
      header: 'Etiqueta',
      cell: ({ row }) => row.original.label ?? '—',
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
    },
  ]

  return (
    <DataTable
      title="Links externos"
      columns={columns}
      data={links}
      isLoading={isLoading}
      searchPlaceholder="Buscar links..."
    />
  )
}

// =============================================================================
// Matching Tab
// =============================================================================

function MatchingTab({ propertyId }: { propertyId: string }) {
  const [matches, setMatches] = React.useState<MatchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      const call = await apiCall<{ items: MatchResult[] }>(
        `/api/matching/matches?property_id=${propertyId}`,
        undefined,
        { fallback: { items: [] } },
      )
      if (call.ok) {
        setMatches(call.result?.items ?? [])
      }
      setIsLoading(false)
    }
    load()
  }, [propertyId])

  const columns: ColumnDef<MatchResult>[] = [
    {
      accessorKey: 'contact_id',
      header: 'Contacto',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.contact_id.slice(0, 8)}...</span>,
    },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }) => (
        <Badge variant={row.original.score >= 70 ? 'default' : row.original.score >= 40 ? 'secondary' : 'outline'}>
          {row.original.score}%
        </Badge>
      ),
    },
    {
      accessorKey: 'is_dismissed',
      header: 'Estado',
      cell: ({ row }) => row.original.is_dismissed ? <Badge variant="destructive">Descartado</Badge> : <Badge variant="secondary">Activo</Badge>,
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString('es-VE'),
    },
  ]

  return (
    <DataTable
      title="Contactos compatibles"
      columns={columns}
      data={matches}
      isLoading={isLoading}
      searchPlaceholder="Buscar matches..."
    />
  )
}
