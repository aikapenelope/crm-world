# Sprint 2-4 — Guía de Implementación

> Referencia técnica extraída del repo de Open Mercato (v0.6.1) para los sprints pendientes.
> Consultar antes de escribir código.

---

## Sprint 2: Dashboard Widgets + Notifications + Matching Scoring

### A. Dashboard Widgets

**Estructura de archivos:**
```
src/modules/properties/widgets/dashboard/
├── properties-by-status/
│   ├── widget.ts          ← Metadata + lazy loader
│   ├── config.ts          ← Settings type + defaults + hydrate
│   └── widget.client.tsx  ← React component ('use client')
├── recent-closings/
│   ├── widget.ts
│   ├── config.ts
│   └── widget.client.tsx
└── pipeline-summary/
    ├── widget.ts
    ├── config.ts
    └── widget.client.tsx
```

**widget.ts (metadata + loader):**
```typescript
import { lazyDashboardWidget, type DashboardWidgetModule } from '@open-mercato/shared/modules/dashboard/widgets'
import { DEFAULT_SETTINGS, hydrateSettings, type WidgetSettings } from './config'

const WidgetClient = lazyDashboardWidget(() => import('./widget.client'))

const widget: DashboardWidgetModule<WidgetSettings> = {
  metadata: {
    id: 'properties.dashboard.properties_by_status',
    title: 'Propiedades por estado',
    description: 'Resumen de propiedades agrupadas por estado (activa, reservada, vendida, etc.)',
    features: ['dashboards.view', 'properties.view'],
    defaultSize: 'md',
    defaultEnabled: true,
    defaultSettings: DEFAULT_SETTINGS,
  },
  Widget: WidgetClient,
  hydrateSettings,
  dehydrateSettings: (value) => ({ ...value }),
}

export default widget
```

**config.ts:**
```typescript
export type WidgetSettings = {
  showInactive: boolean
}

export const DEFAULT_SETTINGS: WidgetSettings = {
  showInactive: false,
}

export function hydrateSettings(raw: unknown): WidgetSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  const data = raw as Partial<WidgetSettings>
  return {
    showInactive: data.showInactive ?? DEFAULT_SETTINGS.showInactive,
  }
}
```

**widget.client.tsx:**
```typescript
'use client'

import * as React from 'react'
import type { DashboardWidgetComponentProps } from '@open-mercato/shared/modules/dashboard/widgets'
import { readApiResultOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { hydrateSettings, type WidgetSettings } from './config'

const WidgetClient: React.FC<DashboardWidgetComponentProps<WidgetSettings>> = ({
  mode,
  settings,
  onSettingsChange,
  refreshToken,
  onRefreshStateChange,
}) => {
  const value = React.useMemo(() => hydrateSettings(settings), [settings])
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      onRefreshStateChange?.(true)
      setLoading(true)
      try {
        const result = await readApiResultOrThrow<{ items: any[] }>(
          '/api/properties?pageSize=100',
          undefined,
          { errorMessage: 'Error cargando propiedades', allowNullResult: true },
        )
        setData(result?.items ?? [])
      } finally {
        setLoading(false)
        onRefreshStateChange?.(false)
      }
    }
    load()
  }, [refreshToken, onRefreshStateChange])

  if (mode === 'settings') {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.showInactive}
          onChange={(e) => onSettingsChange({ ...value, showInactive: e.target.checked })}
        />
        Mostrar inactivas
      </label>
    )
  }

  if (loading) return <Spinner />

  // Render widget content...
  return <div>...</div>
}

export default WidgetClient
```

### B. Notifications

**Archivo: `src/modules/properties/notifications.ts`**
```typescript
import type { NotificationTypeDefinition } from '@open-mercato/shared/modules/notifications/types'

export const notificationTypes: NotificationTypeDefinition[] = [
  {
    type: 'properties.lead.inactive',
    module: 'properties',
    titleKey: 'properties.notifications.lead.inactive.title',
    bodyKey: 'properties.notifications.lead.inactive.body',
    icon: 'user-x',
    severity: 'warning',
    actions: [
      {
        id: 'view',
        labelKey: 'common.view',
        variant: 'outline',
        href: '/backend/customers/people/{sourceEntityId}',
        icon: 'external-link',
      },
    ],
    linkHref: '/backend/customers/people/{sourceEntityId}',
    expiresAfterHours: 168,
  },
  {
    type: 'properties.property.no_activity',
    module: 'properties',
    titleKey: 'properties.notifications.property.no_activity.title',
    bodyKey: 'properties.notifications.property.no_activity.body',
    icon: 'building-2',
    severity: 'warning',
    actions: [
      {
        id: 'view',
        labelKey: 'common.view',
        variant: 'outline',
        href: '/backend/properties/{sourceEntityId}',
        icon: 'external-link',
      },
    ],
    linkHref: '/backend/properties/{sourceEntityId}',
    expiresAfterHours: 168,
  },
]

export default notificationTypes
```

### C. Matching Scoring Engine

**Archivo: `src/modules/matching/services/scoring.ts`**

El scoring se implementa como un servicio registrado en DI. No importa entidades cross-module — usa Kysely para leer datos.

```typescript
import type { EntityManager } from '@mikro-orm/core'

export type MatchScore = {
  contactId: string
  propertyId: string
  score: number
  breakdown: Record<string, number>
}

const WEIGHTS = {
  property_type: 30,
  city: 25,
  budget: 25,
  operation: 20,
} as const

export class ScoringEngine {
  constructor(private readonly em: EntityManager) {}

  async scoreForProperty(propertyId: string, tenantId: string): Promise<MatchScore[]> {
    const kysely = (this.em as any).getKysely()

    // Load property
    const property = await kysely
      .selectFrom('properties')
      .selectAll()
      .where('id', '=', propertyId)
      .where('tenant_id', '=', tenantId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!property) return []

    // Load active preferences
    const preferences = await kysely
      .selectFrom('contact_preferences')
      .selectAll()
      .where('tenant_id', '=', tenantId)
      .where('is_active', '=', true)
      .where('deleted_at', 'is', null)
      .execute()

    return preferences.map((pref: any) => this.calculateScore(property, pref))
  }

  private calculateScore(property: any, pref: any): MatchScore {
    const breakdown: Record<string, number> = {}
    let total = 0

    // Type match
    if (pref.preferred_type && pref.preferred_type === property.property_type) {
      breakdown.property_type = WEIGHTS.property_type
      total += WEIGHTS.property_type
    }

    // City match
    if (pref.preferred_city && property.city?.toLowerCase().includes(pref.preferred_city.toLowerCase())) {
      breakdown.city = WEIGHTS.city
      total += WEIGHTS.city
    }

    // Budget match
    if (pref.max_budget && property.price) {
      const budget = parseFloat(pref.max_budget)
      const price = parseFloat(property.price)
      if (price <= budget) {
        breakdown.budget = WEIGHTS.budget
        total += WEIGHTS.budget
      } else if (price <= budget * 1.1) {
        breakdown.budget = Math.round(WEIGHTS.budget * 0.5)
        total += breakdown.budget
      }
    }

    // Operation match
    if (pref.preferred_operation && (
      pref.preferred_operation === property.operation ||
      property.operation === 'venta_alquiler'
    )) {
      breakdown.operation = WEIGHTS.operation
      total += WEIGHTS.operation
    }

    return {
      contactId: pref.contact_id,
      propertyId: property.id,
      score: total,
      breakdown,
    }
  }
}
```

---

## Sprint 3: Portal + PDF

### A. Agent Portal (frontend page)

**Estructura:**
```
src/modules/properties/frontend/agente/[id]/
├── page.tsx       ← Server component (public, no auth)
└── page.meta.ts   ← No requireAuth
```

Patrón: igual que `property_portal/frontend/p/[id]/page.tsx` — página pública sin auth.

### B. PDF Renderer

Usar `@napi-rs/canvas` (ya en package.json) o generar HTML y convertir. El data layer ya existe en `property_docs/api/property-pdf/route.ts`.

### C. Monthly Report

Nuevo endpoint API que agrega datos del mes: transacciones completadas, propiedades por status, pipeline.

---

## Sprint 4: Import + Polish

### A. CSV/vCard Import

Open Mercato tiene `data_sync` module. El patrón es crear un adapter:
```
src/modules/properties/data-sync/csv-contacts-adapter.ts
```

### B. Settings Pages

Páginas backend normales con CrudForm para guardar configuración.

---

## Reglas de producción (recordatorio)

1. **Entidades**: `@Property({ columnType: 'text' })` — SIEMPRE con columnType
2. **CRUD routes**: SIEMPRE `mapToEntity` + `applyToEntity`
3. **Events**: `moduleId:` (no `module:`)
4. **Kysely**: `(em as any).getKysely()`
5. **Seeds**: `em.create(Entity, {...} as any)`
6. **Widgets**: exportar `default widget` con metadata.id único
7. **Notifications**: exportar `notificationTypes` array
8. **Null handling**: `useOrganizationScopeDetail()` retorna `string | null`
9. **i18n**: Strings visibles en `i18n/es.json`, keys en código
10. **No cross-module imports**: Usar Kysely o API calls
