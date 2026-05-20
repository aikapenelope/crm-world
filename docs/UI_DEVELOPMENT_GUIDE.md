# Guía de Desarrollo UI — Open Mercato Patterns

> Referencia para construir interfaces en módulos custom siguiendo las prácticas de Open Mercato.
> Consultar ANTES de crear cualquier página o componente.

---

## Principios Fundamentales

1. **Nunca HTML raw** — usar siempre primitivas de `@open-mercato/ui`
2. **CrudForm para formularios** — nunca `<form>` manual
3. **DataTable para listados** — nunca `<table>` manual
4. **Tokens semánticos** — nunca colores hardcodeados (text-red-500, bg-green-100)
5. **lucide-react para iconos** — nunca SVG inline en body pages
6. **i18n para strings** — nunca texto hardcodeado visible al usuario
7. **apiCall para fetch** — nunca `fetch()` raw

---

## Imports Esenciales

```typescript
// Páginas
import { Page, PageBody } from '@open-mercato/ui/backend/Page'

// Formularios
import { CrudForm, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud, updateCrud, deleteCrud } from '@open-mercato/ui/backend/utils/crud'
import { createCrudFormError } from '@open-mercato/ui/backend/utils/serverErrors'

// Tablas
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

// API
import { apiCall, readApiResultOrThrow } from '@open-mercato/ui/backend/utils/apiCall'

// Feedback
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { LoadingMessage } from '@open-mercato/ui/backend/detail'

// Primitivas
import { Button } from '@open-mercato/ui/primitives/button'
import { Badge } from '@open-mercato/ui/primitives/badge'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { Avatar } from '@open-mercato/ui/primitives/avatar'
import { Tag } from '@open-mercato/ui/primitives/tag'
import { Input } from '@open-mercato/ui/primitives/input'
import { Checkbox } from '@open-mercato/ui/primitives/checkbox'

// Scope
import { useOrganizationScopeDetail } from '@open-mercato/shared/lib/frontend/useOrganizationScope'

// i18n
import { useT } from '@open-mercato/shared/lib/i18n/context'

// Icons (lucide-react para body pages)
import { Plus, ArrowLeft, Send, FileText, Users } from 'lucide-react'
```

---

## Estructura de Página Backend

```tsx
'use client'

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'

export default function MyPage() {
  return (
    <Page>
      <PageBody>
        {/* Header con título + acciones */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Título</h1>
          <div className="flex gap-2">
            <Button variant="outline">Acción secundaria</Button>
            <Button><Plus className="mr-2 h-4 w-4" />Acción principal</Button>
          </div>
        </div>

        {/* Contenido */}
        <DataTable ... />
      </PageBody>
    </Page>
  )
}
```

---

## page.meta.ts — Sidebar y Navegación

```typescript
import React from 'react'

// Iconos en page.meta.ts DEBEN ser React.createElement (NO lucide-react import)
const myIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: '...' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['my_module.view'],
  pageTitle: 'Mi Página',
  pageTitleKey: 'my_module.nav.title',
  icon: myIcon,
  pageGroup: 'MyGroup',        // Grupo en sidebar
  pageGroupKey: 'my_group',
  pageOrder: 10,               // Orden dentro del grupo
}
```

---

## DataTable — Patrón Completo

```tsx
const columns: ColumnDef<MyRow>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
    cell: ({ row }) => (
      <button
        className="font-medium text-primary hover:underline"
        onClick={() => router.push(`/backend/my-module/${row.original.id}`)}
      >
        {row.original.name}
      </button>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANTS[row.original.status]}>
        {STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ row }) => `${row.original.currency} ${Number(row.original.amount).toLocaleString('es-VE')}`,
  },
]

<DataTable
  columns={columns}
  data={items}
  isLoading={isLoading}
  searchPlaceholder="Buscar..."
/>
```

---

## CrudForm — Patrón con Grupos

```tsx
const groups: CrudFormGroup[] = [
  {
    id: 'basic',
    column: 1,
    title: 'Datos básicos',
    fields: [
      { id: 'name', type: 'text', label: 'Nombre', required: true },
      { id: 'email', type: 'text', label: 'Email' },
      {
        id: 'status', type: 'select', label: 'Estado',
        options: [
          { label: 'Activo', value: 'active' },
          { label: 'Inactivo', value: 'inactive' },
        ],
      },
    ],
  },
  {
    id: 'details',
    column: 2,
    title: 'Detalles',
    fields: [
      { id: 'notes', type: 'textarea', label: 'Notas' },
    ],
  },
]

<CrudForm
  title="Crear Registro"
  backHref="/backend/my-module"
  fields={[]}
  groups={groups}
  submitLabel="Guardar"
  cancelHref="/backend/my-module"
  onSubmit={async (values) => {
    await createCrud('my-module/items', { ...values, organizationId, tenantId })
    flash('Registro creado', 'success')
    router.push('/backend/my-module')
  }}
/>
```

---

## Dashboard Widgets

```
src/modules/<module>/widgets/dashboard/<widget-name>/
├── widget.ts          ← Metadata + lazy loader
├── config.ts          ← Settings type + defaults + hydrate
└── widget.client.tsx  ← React component ('use client')
```

**widget.ts:**
```typescript
import { lazyDashboardWidget, type DashboardWidgetModule } from '@open-mercato/shared/modules/dashboard/widgets'
import { DEFAULT_SETTINGS, hydrateSettings, type MySettings } from './config'

const WidgetClient = lazyDashboardWidget(() => import('./widget.client'))

const widget: DashboardWidgetModule<MySettings> = {
  metadata: {
    id: 'my_module.dashboard.my_widget',
    title: 'Mi Widget',
    description: 'Descripción corta.',
    features: ['dashboards.view', 'my_module.view'],
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

---

## Colores y Status — Tokens Semánticos

| Necesito... | Usar |
|---|---|
| Error/destructivo | `text-destructive`, `bg-destructive` |
| Éxito | `text-status-success-text`, `bg-status-success-bg` |
| Warning | `text-status-warning-text`, `bg-status-warning-bg` |
| Info | `text-status-info-text`, `bg-status-info-bg` |
| Muted/secundario | `text-muted-foreground`, `bg-muted` |
| Primary | `text-primary`, `bg-primary` |
| Borde | `border-border`, `border-input` |

**NUNCA usar:** `text-red-500`, `bg-green-100`, `text-amber-*`, `bg-blue-*`

---

## Botones de Acción con Iconos

```tsx
// Botón principal
<Button onClick={handleAction}>
  <Plus className="mr-2 h-4 w-4" />
  Crear
</Button>

// Botón secundario
<Button variant="outline" onClick={handleAction}>
  <FileText className="mr-2 h-4 w-4" />
  Ver Reporte
</Button>

// Botón destructivo
<Button variant="destructive" onClick={handleDelete}>
  <Trash2 className="mr-2 h-4 w-4" />
  Eliminar
</Button>

// Botón WhatsApp (verde con icono)
<Button
  variant="outline"
  className="border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
  onClick={() => window.open(waLink, '_blank')}
>
  <MessageCircle className="mr-2 h-4 w-4" />
  Enviar por WhatsApp
</Button>
```

---

## Checklist antes de cada PR con UI

- [ ] Todas las páginas usan `Page` + `PageBody`
- [ ] Formularios usan `CrudForm` (no `<form>`)
- [ ] Tablas usan `DataTable` (no `<table>`)
- [ ] Iconos de lucide-react en body, React.createElement en page.meta.ts
- [ ] Colores usan tokens semánticos (no hardcoded)
- [ ] Strings visibles en i18n JSON (no hardcoded)
- [ ] API calls usan `apiCall` / `readApiResultOrThrow` (no `fetch`)
- [ ] Botones tienen `type="button"` si no son submit
- [ ] Diálogos soportan Cmd+Enter y Escape
- [ ] `flash()` para feedback de éxito/error
- [ ] `LoadingMessage` con label para estados de carga
