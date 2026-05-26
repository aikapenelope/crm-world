/**
 * Agent Portal — Public page /agente/[id]
 *
 * Displays a list of active properties assigned to an agent.
 * No authentication required — this is a shareable public page.
 */
'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type PortalProperty = {
  id: string
  title: string
  description: string | null
  property_type: string
  operation: string
  status: string
  price: string
  currency: string
  area_m2: string | null
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  city: string
  state: string | null
  portal_url: string
}

const TYPE_LABELS: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Local Comercial',
  oficina: 'Oficina',
  galpon: 'Galpón',
  otro: 'Otro',
}

const OP_LABELS: Record<string, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  venta_alquiler: 'Venta/Alquiler',
}

export default function AgentPortalPage() {
  const t = useT()
  const params = useParams()
  const agentId = params?.id as string
  const [properties, setProperties] = React.useState<PortalProperty[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await apiCall<{ properties: PortalProperty[] }>(`/api/agent-portal?agentId=${agentId}`)
        setProperties(res.result?.properties ?? [])
      } finally {
        setLoading(false)
      }
    }
    if (agentId) load()
  }, [agentId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">
          {t('properties.portal.agent.loading', 'Cargando propiedades...')}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">
          {t('properties.portal.agent.available', 'Propiedades disponibles')}
        </h1>
        <p className="text-muted-foreground mb-6">
          {t('properties.portal.agent.count', '{count} propiedades activas').replace('{count}', String(properties.length))}
        </p>

        {properties.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground">
              {t('properties.portal.agent.empty', 'No hay propiedades disponibles en este momento.')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {properties.map((prop) => (
              <a
                key={prop.id}
                href={prop.portal_url}
                className="block bg-card rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-semibold text-lg leading-tight">{prop.title}</h2>
                  <Badge variant="secondary">{OP_LABELS[prop.operation] ?? prop.operation}</Badge>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{TYPE_LABELS[prop.property_type] ?? prop.property_type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {prop.city}{prop.state ? `, ${prop.state}` : ''}
                  </span>
                </div>

                <div className="text-xl font-bold text-primary mb-2">
                  {prop.currency} {Number(prop.price).toLocaleString('es-VE')}
                </div>

                {(prop.area_m2 || prop.bedrooms || prop.bathrooms) && (
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    {prop.area_m2 && <span>{prop.area_m2} m²</span>}
                    {prop.bedrooms && <span>{prop.bedrooms} hab.</span>}
                    {prop.bathrooms && <span>{prop.bathrooms} baños</span>}
                    {prop.parking && <span>{prop.parking} est.</span>}
                  </div>
                )}

                {prop.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{prop.description}</p>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
