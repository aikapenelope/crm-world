# AGM — Aika Agents Manual

> **Fuente de verdad única para agentes de IA (y humanos) trabajando en crm-world.**
> Consultar ANTES de escribir cualquier línea de código.
> Combina: open-mercato AGENTS.md · .ai/ds-rules.md · .ai/ui-components.md · packages/*/AGENTS.md · .ai/lessons.md · PATTERNS.md · COOKBOOK.md · GUIDELINES.md
>
> Stack: Open Mercato v0.6.1 · Next.js 16 · MikroORM v7 · Zod v4 · Tailwind CSS v4

---

## 1. Antes de escribir cualquier código

### Protocolo obligatorio

```
1. Leer la sección del Task Router que aplica al cambio
2. Revisar .ai/specs/ — ¿ya existe un spec aprobado?
3. Si no hay spec → crear spec → obtener aprobación → implementar
4. Identificar el módulo de referencia (customers para CRUD)
5. Correr yarn typecheck localmente antes de commitear
```

### Regla maestra: SPEC → aprobación → implementar → verificar

**Nunca** escribir código sin spec aprobado para cambios de +3 pasos o decisiones de arquitectura.
El spec vive en `.ai/specs/YYYY-MM-DD-titulo-kebab.md`.

---

## 2. Task Router

| Tarea | Dónde buscar en este AGM |
|-------|--------------------------|
| Crear módulo nuevo | §4 Estructura de módulo |
| Entidades MikroORM | §5 Base de datos |
| API CRUD route | §6 API Routes |
| API interceptors | §6.4 Interceptors |
| Backend page (list/create/edit/detail) | §7 Backend UI |
| Formulario (CrudForm) | §7.2 CrudForm |
| Tabla (DataTable) | §7.3 DataTable |
| Colores / tokens | §8.1 Colores |
| Tipografía / tamaños | §8.2 Tipografía |
| Botones / inputs | §8.3 Componentes UI |
| Iconos | §8.4 Iconos |
| Spacing | §8.5 Espaciado |
| Eventos entre módulos | §9 Eventos |
| Real-time (clientBroadcast) | §9.2 clientBroadcast |
| RBAC / permisos | §10 Seguridad |
| Portal del cliente | §11 Portal |
| Queries cross-module | §12.1 Kysely |
| Venezuela / regional | §12.2 Regional VE |
| PDF generation | §12.3 PDFs |
| Testing | §13 Tests |
| Deploy / build errors | §14 Deploy |
| Checklists | §15 Checklists |

---

## 3. Principios de arquitectura

```
Open Mercato core (npm packages, no modificar)
    ↓ consumido por
src/modules/<vertical>/<módulo>/  ← NUESTRO CÓDIGO
    ↓ registrado en
src/modules.ts
    ↓ generado por
yarn generate → .mercato/generated/
    ↓ construido por
next build → .mercato/next/
    ↓ desplegado en
Coolify → Hetzner CX33 → mercato.novaincs.com
```

### Reglas arquitectónicas absolutas

1. **NO modificar Open Mercato core** — todo es aditivo
2. **NO importar entidades entre módulos** — usar Kysely queries: `(em as any).getKysely()`
3. **NO imports cross-module** — comunicación via event bus o Kysely
4. **NO ORM relationships entre módulos** — usar FKs (UUIDs) y fetch por separado
5. **NO custom queues, Redis, SQLite** — usar `container.resolve('cache')`
6. **NO `fetch()` raw** — usar `apiCall`/`apiCallOrThrow` de `@open-mercato/ui/backend/utils/apiCall`
7. **NO `<form>` raw** — usar `CrudForm`
8. **NO `<button>` raw** — usar `Button` o `IconButton`
9. **NO `<table>` raw** — usar `DataTable`
10. **NO `window.confirm()`** — usar `useConfirmDialog()`

---

## 4. Estructura de módulo

### Estructura mínima obligatoria

```
src/modules/<modulo>/
├── index.ts          ← ModuleInfo (OBLIGATORIO)
├── di.ts             ← export function register(_ : AppContainer) {} (OBLIGATORIO)
├── acl.ts            ← features RBAC (si tiene páginas protegidas)
├── setup.ts          ← defaultRoleFeatures + seedDefaults (si tiene ACL)
├── events.ts         ← createModuleEvents con moduleId: (si emite eventos)
├── data/
│   ├── entities.ts   ← @Entity con @Property({ type: '...' }) SIEMPRE
│   └── validators.ts ← Zod schemas
├── api/
│   └── <recurso>/route.ts
├── backend/
│   └── <pagina>/
│       ├── page.meta.ts
│       └── page.tsx  ← 'use client' siempre
├── i18n/
│   ├── es.json
│   └── en.json
└── migrations/
    └── .snapshot-open-mercato.json
```

### index.ts — metadata obligatorio

```typescript
import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'mi_modulo',
  title: 'Mi Módulo',
  version: '0.1.0',
  description: 'Una línea que describe qué hace.',
}
export default metadata
```

### di.ts — export register SIEMPRE

```typescript
import type { AppContainer } from '@open-mercato/shared/lib/di/container'

// Aunque no registre servicios, el generador requiere esta función.
// Ref: PATTERNS.md §13
export function register(_: AppContainer) {
  // services aquí si los hay
}
```

### Archivos opcionales

| Archivo | Export | Cuándo crear |
|---------|--------|--------------|
| `acl.ts` | `features` | Páginas con requireFeatures |
| `setup.ts` | `setup: ModuleSetupConfig` | ACL, seed data, tenant init |
| `events.ts` | `eventsConfig` | Módulo emite eventos |
| `search.ts` | `searchConfig` | Búsqueda Cmd+K |
| `notifications.ts` | `notificationTypes` | Notificaciones in-app |
| `ai-agents.ts` | `aiAgents` | Asistente IA del módulo |
| `ai-tools.ts` | `aiTools` | Tools del asistente |
| `api/interceptors.ts` | `interceptors` | Hooks before/after en CRUD routes |
| `data/extensions.ts` | `extensions` | Links cross-módulo (sin import directo) |

### Registrar en modules.ts

```typescript
// src/modules.ts
{ id: 'mi_modulo', from: '@app' },
```

### Después de cualquier cambio estructural

```bash
yarn generate
yarn mercato configs cache structural --all-tenants
# Si Turbopack sirve chunks viejos:
yarn dev:reset
```

---

## 5. Base de datos — MikroORM v7

### Importaciones correctas

```typescript
import { Entity, PrimaryKey, Property, Enum, ManyToOne, OneToMany, Collection } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'
```

### Regla crítica: @Property SIEMPRE con type explícito

Turbopack en producción NO emite decorator metadata. Sin `type:`, crashea en runtime.

```typescript
// ❌ INCORRECTO — crashea en producción
@Property()
tenant_id!: string

// ✅ CORRECTO
@Property({ type: 'text' })
tenant_id!: string
```

### Tabla de tipos MikroORM

| TypeScript | `type:` en @Property |
|---|---|
| `string` (texto libre) | `'text'` |
| `string` (UUID) | `'uuid'` |
| `string` (decimal/dinero) | `'decimal'` + precision/scale |
| `number` entero | `'int'` |
| `number` entero pequeño | `'smallint'` |
| `boolean` | `'boolean'` |
| `Date` con hora | `'timestamptz'` |
| `Date` solo fecha | `'date'` |
| `string[]` / `any[]` / `object` | `'json'` |

### Entidad completa de referencia

```typescript
@Entity({ tableName: 'mi_modulo_items' })
export class MiModuloItemEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text', length: 255 })
  name!: string

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true

  @Property({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  amount?: string | null

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
```

### Migraciones

```bash
# Después de cambiar entities.ts:
yarn db:generate   # genera SQL + actualiza .snapshot-open-mercato.json
# REVISAR antes de commitear — eliminar SQL no relacionado

# Nunca commitear migrations de módulos ajenos
# Nunca correr yarn db:migrate sin pedir primero
```

### em.create() y em.find() en seeds — usar as any

```typescript
// MikroORM v7 strict types — SIEMPRE as any en seeds
const entry = em.create(MyEntity, {
  tenant_id: scope.tenantId,
  organization_id: scope.organizationId,
  name: 'valor',
} as any)
em.persist(entry)
await em.flush()

// em.find también necesita as any en filters
const rows = await em.find(MyEntity, {
  tenant_id: scope.tenantId,
  deleted_at: null,
} as any)
```

### Flush antes de relation syncs

Si un comando muta campos escalares y luego hace queries de relaciones en el mismo EM, hacer flush primero para evitar que el identity map devuelva datos viejos.

---

## 6. API Routes

### Estructura obligatoria de un route.ts

```typescript
// src/modules/<modulo>/api/<recurso>/route.ts

// 1. metadata por método HTTP (OBLIGATORIO — sin esto auth defaultea a required)
export const metadata = {
  GET:    { requireAuth: true, requireFeatures: ['mi_modulo.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mi_modulo.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['mi_modulo.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['mi_modulo.delete'] },
}

// 2. openApi (OBLIGATORIO para docs automáticos)
export const openApi = {}

// 3. Handlers
export const GET = crud.GET
export const POST = crud.POST
```

Para endpoints públicos sin auth:
```typescript
export const metadata = {
  GET: { requireAuth: false },
}
```

### makeCrudRoute — patrón estándar

```typescript
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { z } from 'zod'
import { MyEntity } from '../../data/entities'
import { createSchema, updateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['mi_modulo.view'] },
  POST:   { requireAuth: true, requireFeatures: ['mi_modulo.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['mi_modulo.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['mi_modulo.delete'] },
}
export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: MyEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  indexer: { entityType: 'mi_modulo:item' }, // OBLIGATORIO para Cmd+K
  list: { schema: listSchema },
  create: {
    schema: createSchema,
    mapToEntity: (input: any) => ({ ...input }), // OBLIGATORIO en v0.6.1
  },
  update: {
    schema: updateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) }, // OBLIGATORIO
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE
export const openApi = {}
```

### Handler custom con auth

```typescript
// SIEMPRE (request: Request, ctx: any) — ctx da DI y scope del tenant
export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope // { tenantId, organizationId }
  const kysely = (em as any).getKysely() // as any SIEMPRE

  const url = new URL(request.url)
  const id = url.searchParams.get('id')

  const row = await kysely
    .selectFrom('mi_tabla')
    .selectAll()
    .where('id', '=', id)
    .where('tenant_id', '=', scope.tenantId)
    .executeTakeFirst()

  if (!row) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ data: row as any })
}
```

### Kysely — reglas de tipado estricto

`yarn build` usa TypeScript strict. Kysely no infiere tipos de columnas. **SIEMPRE** castear:

```typescript
// ❌ FALLA en build de producción
const item = await kysely.selectFrom('t').selectAll().executeTakeFirst()
console.log(item.name) // Property 'name' does not exist on type '{}'

// ✅ CORRECTO
const item = await kysely.selectFrom('t').selectAll().executeTakeFirst()
const name = (item as any)?.name

// ❌ FALLA
const map = new Map(rows.map(r => [r.id, r]))

// ✅ CORRECTO
const map = new Map<string, any>(rows.map((r: any) => [r.id, r]))
const val = map.get(someId) as any
```

### 6.4 API Interceptors — hooks before/after en CRUD routes

```typescript
// src/modules/mi_modulo/api/interceptors.ts
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'mi_modulo.resource-broadcast',
    targetRoute: 'mi-modulo/resource', // path sin /api/, guiones en vez de _
    methods: ['POST'],
    priority: 10,
    async before() {
      return { ok: true }
    },
    async after(_request, _response, context) {
      await emitLifecycle(eventsConfig, 'mi_modulo.resource.created', {
        tenantId: context.tenantId,
        organizationId: context.organizationId,
      })
      return {} // {} = sin modificar el response body
    },
  },
]
```

---

## 7. Backend UI

### Reglas MUST del backend UI

1. **MUST stable `id` values en RowActions** — usar `'edit'`, `'open'`, `'delete'`
2. **MUST `apiCall`/`apiCallOrThrow`** — nunca `fetch()` raw
3. **MUST `LoadingMessage`/`ErrorMessage`** de `@open-mercato/ui/backend/detail`
4. **MUST `useGuardedMutation`** cuando no uses CrudForm para escrituras
5. **MUST `Button`/`IconButton`** — nunca `<button>` raw
6. **MUST `type="button"` explícito** en botones no-submit
7. **MUST separar estado `notFound` de `error`** — no colapsar en el mismo branch

### State flow para páginas de detalle [id]

```typescript
// Patrón correcto para páginas /backend/<modulo>/[id]
type PageState = 'loading' | 'notFound' | 'error' | 'ready'

// loading → notFound: registrar "not found" como estado dedicado,
// renderizar ErrorMessage + "Volver al listado"
// loading → error: error genérico de red/servidor
// loading → ready: renderizar CrudForm o secciones de detalle
```

### Importaciones clave del backend

```typescript
import { Button } from '@open-mercato/ui/primitives/button'
import { IconButton } from '@open-mercato/ui/primitives/icon-button'
import { apiCall, apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { createCrud, updateCrud, deleteCrud } from '@open-mercato/ui/backend/utils/crud'
import { LoadingMessage, ErrorMessage } from '@open-mercato/ui/backend/detail'
import { FormHeader, FormFooter } from '@open-mercato/ui/backend/forms'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { createCrudFormError } from '@open-mercato/ui/backend/utils/serverErrors'
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { useAppEvent } from '@open-mercato/ui/backend/injection/useAppEvent'
import { useT } from '@open-mercato/shared/lib/i18n/context'
```

### Estructura de page.meta.ts

```typescript
// src/modules/mi_modulo/backend/mi_modulo/page.meta.ts
import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

// OBLIGATORIO: usar React.createElement para iconos en page.meta.ts
// NO importar de lucide-react directamente — rompe serialización de sidebar
const myIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2' }),
  React.createElement('circle', { cx: 9, cy: 7, r: 4 }),
)

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['mi_modulo.view'],
  pageTitle: 'Mi Módulo',
  pageTitleKey: 'mi_modulo.nav.title',
  pageGroup: 'Operations',
  pageGroupKey: 'nav.group.operations',
  pageOrder: 50,
  icon: myIcon,
}
```

### 7.2 CrudForm

```typescript
'use client'
import * as React from 'react'
import { CrudForm } from '@open-mercato/ui/backend/CrudForm'
import { createCrud, updateCrud } from '@open-mercato/ui/backend/utils/crud'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useT } from '@open-mercato/shared/lib/i18n/context'

// Patrón create/edit
export default function MiModuloForm({ initial }: { initial?: any }) {
  const t = useT()
  const isEdit = !!initial?.id

  return (
    <CrudForm
      entityId="mi_modulo.item"       // stable, para inyección de widgets
      apiPath="/api/mi-modulo/items"
      mode={isEdit ? 'edit' : 'create'}
      initial={initial}
      fields={[
        { type: 'text', name: 'name', label: t('mi_modulo.fields.name'), required: true },
        { type: 'textarea', name: 'description', label: t('mi_modulo.fields.description') },
      ]}
      groups={[
        { id: 'general', label: 'General', fields: ['name', 'description'] },
      ]}
      onSuccess={() => flash(t('mi_modulo.saved'), 'success')}
    />
  )
}
```

### 7.3 DataTable

```typescript
'use client'
import * as React from 'react'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { RowActions } from '@open-mercato/ui/backend/RowActions'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import type { ColumnDef } from '@open-mercato/ui/backend/DataTable'

type Row = { id: string; name: string; status: string }

export default function MiModuloList() {
  const [rows, setRows] = React.useState<Row[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    apiCall<{ data: Row[] }>('/api/mi-modulo/items')
      .then((res) => { if (!cancelled) setRows(res.data?.data ?? []) })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const columns: ColumnDef<Row>[] = [
    { accessorKey: 'name', header: 'Nombre', meta: { truncate: true, maxWidth: 300 } },
    { accessorKey: 'status', header: 'Estado' },
    {
      id: 'actions',
      cell: ({ row }) => (
        <RowActions
          items={[
            { id: 'edit', label: 'Editar', href: `/backend/mi-modulo/${row.original.id}` },
            { id: 'delete', label: 'Eliminar', variant: 'destructive', onClick: () => {} },
          ]}
        />
      ),
    },
  ]

  return (
    <DataTable
      entityId="mi_modulo.item"          // stable — para inyección de widgets
      extensionTableId="mi-modulo-list"  // stable — NO cambiar una vez en producción
      data={rows}
      columns={columns}
      isLoading={isLoading}
      emptyState={{ title: 'Sin registros', description: 'Crea el primero.' }}
      stickyActionsColumn
    />
  )
}
```

### useGuardedMutation — cuando NO usas CrudForm

```typescript
import { useGuardedMutation } from '@open-mercato/ui/backend/injection/useGuardedMutation'
import { apiCallOrThrow } from '@open-mercato/ui/backend/utils/apiCall'
import { flash } from '@open-mercato/ui/backend/FlashMessages'

const { runMutation } = useGuardedMutation()

const handleAction = async () => {
  await runMutation({
    operation: 'update',
    context: { entityId: 'mi_modulo.item', recordId: id },
    mutationPayload: async () => {
      await apiCallOrThrow('/api/mi-modulo/items', {
        method: 'PUT',
        body: JSON.stringify({ ...data }),
      })
      flash('Actualizado', 'success')
    },
  })
}
```

### useAppEvent — real-time en páginas

```typescript
import { useAppEvent } from '@open-mercato/ui/backend/injection/useAppEvent'

// Suscribirse a eventos del servidor (SSE via DOM Event Bridge)
// Wildcards soportados: 'modulo.*', 'modulo.entidad.*', '*'
useAppEvent('mi_modulo.item.*', (event) => {
  // event.id, event.payload, event.timestamp, event.organizationId
  refetch() // recargar datos cuando algo cambia
}, [refetch])
```

---

## 8. Design System

> **Regla del Boy Scout**: al tocar un archivo con colores hardcoded o tamaños arbitrarios,
> migrar MÍNIMO las líneas que tocaste a tokens semánticos.

### 8.1 Colores — árbol de decisión

**Pregunta**: ¿qué color necesito?

| Caso | Token | NUNCA |
|------|-------|-------|
| Estado: error / destructivo | `text-status-error-text` · `bg-status-error-bg` · `border-status-error-border` | `text-red-*` · `text-destructive` (solo en botones) |
| Estado: éxito / confirmado | `text-status-success-text` · `bg-status-success-bg` | `text-green-*` · `text-emerald-*` |
| Estado: warning / pendiente | `text-status-warning-text` · `bg-status-warning-bg` | `text-amber-*` · `text-yellow-*` |
| Estado: info / informativo | `text-status-info-text` · `bg-status-info-bg` | `text-blue-*` |
| Estado: neutral / inactivo | `text-status-neutral-text` · `bg-status-neutral-bg` | `text-gray-*` (en semántico) |
| Texto primario | `text-foreground` | `text-black` · `text-gray-900` |
| Texto secundario / placeholder | `text-muted-foreground` | `text-gray-500` |
| Acción primaria (botón, link) | `bg-primary` · `text-primary-foreground` | |
| Fondo sutil (hover, accent) | `bg-secondary` · `bg-accent` · `bg-muted` | |
| Bordes | `border-border` · `border-input` | `border-gray-300` |
| Cards / popovers | `bg-card` · `bg-popover` | `bg-white` hardcoded |
| Acción destructiva (botón) | `text-destructive` · `bg-destructive` | |
| IA / AI features | `brand-violet` | colores personalizados |

**Estructura de tokens de estado**: `{propiedad}-status-{estado}-{rol}`
- `estado`: `error` · `success` · `warning` · `info` · `neutral`
- `rol`: `bg` · `text` · `border` · `icon`

**Todos los tokens semánticos tienen valor dark mode integrado — NUNCA agregar `dark:` overrides.**

### 8.2 Tipografía — escala Tailwind

```
NUNCA: text-[10px], text-[11px], text-[13px], text-[15px]
NUNCA: tracking arbitrario

SIEMPRE usar la escala:
text-xs    = 12px  → timestamps, hints secundarios
text-sm    = 14px  → texto por defecto en el backend
text-base  = 16px  → texto énfasis
text-lg    = 18px  → subtítulos de sección
text-xl    = 20px  → títulos de sección
text-2xl   = 24px  → título principal de página (uno por página)
text-overline     → labels de 11px en MAYÚSCULAS (token custom)
```

| Contexto | Clases |
|----------|--------|
| Título principal (uno por página) | `text-2xl font-bold tracking-tight` |
| Título de sección mayor | `text-xl font-semibold` |
| Título de card / subsección | `text-sm font-semibold` |
| Label de formulario | `text-sm font-medium` (usar componente `Label`) |
| Texto body por defecto | `text-sm` |
| Info secundaria, timestamps | `text-xs text-muted-foreground` |
| Label categoría MAYÚSCULAS | `text-overline font-semibold uppercase tracking-widest` |

### 8.3 Componentes UI — referencia rápida

**NUNCA usar HTML raw. SIEMPRE usar los primitivos de `@open-mercato/ui`.**

| Necesito | Componente | Import |
|----------|------------|--------|
| Botón con texto | `Button` | `@open-mercato/ui/primitives/button` |
| Botón solo icono | `IconButton` | `@open-mercato/ui/primitives/icon-button` |
| Link styled como botón | `LinkButton` | `@open-mercato/ui/primitives/link-button` |
| Input texto / número | `Input` | `@open-mercato/ui/primitives/input` |
| Input email | `EmailInput` | `@open-mercato/ui/primitives/email-input` |
| Input búsqueda | `SearchInput` | `@open-mercato/ui/primitives/search-input` |
| Input contraseña | `PasswordInput` | `@open-mercato/ui/primitives/password-input` |
| Input monto+moneda | `AmountInput` | `@open-mercato/ui/primitives/amount-input` |
| Input teléfono | `PhoneNumberField` | `@open-mercato/ui/backend/inputs/PhoneNumberField` |
| Textarea | `Textarea` | `@open-mercato/ui/primitives/textarea` |
| Select / dropdown | `Select` + `SelectContent` + `SelectItem` | `@open-mercato/ui/primitives/select` |
| Checkbox | `Checkbox` | `@open-mercato/ui/primitives/checkbox` |
| Switch on/off | `Switch` | `@open-mercato/ui/primitives/switch` |
| Radio | `Radio` + `RadioGroup` | `@open-mercato/ui/primitives/radio` |
| Tooltip | `SimpleTooltip` | `@open-mercato/ui/primitives/tooltip` |
| Avatar | `Avatar`, `AvatarStack` | `@open-mercato/ui/primitives/avatar` |
| Tag / pill de estado | `Tag` (usuario) / `StatusBadge` (sistema) | `@open-mercato/ui/primitives/tag` |
| Alerta inline | `Alert variant="destructive\|success\|warning\|info"` | `@open-mercato/ui/primitives/alert` |
| Toast/flash | `flash('msg', 'success\|error\|warning\|info')` | `@open-mercato/ui/backend/FlashMessages` |
| Confirmación destructiva | `useConfirmDialog()` | `@open-mercato/ui/backend/confirm-dialog` |
| Estado vacío | `EmptyState` o prop `emptyState` en DataTable | |
| Loading | `Spinner` · `LoadingMessage` · `DataLoader` | |
| Error | `ErrorMessage` | `@open-mercato/ui/backend/detail` |
| Teclado shortcut | `Kbd`, `KbdShortcut` | `@open-mercato/ui/primitives/kbd` |

#### Button — reglas

```typescript
// Variantes: default · destructive · destructive-outline · destructive-soft ·
//            destructive-ghost · outline · secondary · ghost · muted · link
// Tamaños:   2xs · sm · default · lg · icon

// SIEMPRE type="button" en botones no-submit
<Button type="button" variant="outline" size="default">Cancelar</Button>
<Button type="submit" variant="default">Guardar</Button>

// Para acciones destructivas
<Button type="button" variant="destructive">Eliminar</Button>

// Para icon-only: usar IconButton, NO Button size="icon"
<IconButton type="button" size="default" aria-label="Eliminar">
  <Trash2 className="size-4" />
</IconButton>

// Botones en la misma fila DEBEN tener el mismo size
// ❌ <Button size="sm"> junto a <Button size="default">
// ✅ Ambos con size="default"
```

#### Tag vs StatusBadge

| | `Tag` | `StatusBadge` |
|---|---|---|
| Uso | Label aplicado por el usuario | Estado del sistema (activo, pendiente...) |
| Variantes | `success · warning · error · info · neutral · brand` | Igual |
| `brand` | Solo para vistas custom / perspectivas | ❌ No disponible |

### 8.4 Iconos

```typescript
// En páginas y componentes del body → lucide-react
import { Trash2, Edit, Plus, Search } from 'lucide-react'
<Trash2 className="size-4" />  // Tamaños: size-3 · size-4 · size-5 · size-6

// En page.meta.ts (sidebar) → React.createElement (ver §7 page.meta.ts)
// NO importar lucide-react directamente en page.meta.ts — rompe serialización

// Icon-only buttons DEBEN tener aria-label
<IconButton type="button" aria-label="Eliminar registro">
  <Trash2 className="size-4" />
</IconButton>
```

### 8.5 Espaciado — grid de 4px

```
NUNCA: p-[13px], gap-[10px], mt-[7px]
NUNCA: valores medios innecesarios (0.5, 1.5, 2.5)

SIEMPRE usar la escala:
gap-1  = 4px   → icono↔texto, internos de chip
gap-2  = 8px   → default entre items inline (DEFAULT)
gap-3  = 12px  → entre items de lista
gap-4  = 16px  → entre secciones distintas
gap-6  = 24px  → secciones de página
p-3    = 12px  → padding en contenedores compactos
p-4    = 16px  → padding en cards/secciones (DEFAULT)
p-6    = 24px  → padding en dialogs/panels grandes
space-y-2 = 8px  → stack de campos de formulario
space-y-4 = 16px → stack de secciones
py-8   = 32px  → separación de secciones a nivel de página
```

### 8.6 Border radius

```
NUNCA: rounded-[24px], rounded-2xl, rounded-3xl

rounded-full   → pills, badges, avatars
rounded-xl     → cards grandes, hero sections (16px)
rounded-lg     → cards, dialogs, alerts (10px)
rounded-md     → botones, inputs, selects (8px — DEFAULT)
rounded-sm     → checkboxes, dots pequeños (6px)
rounded-none   → celdas de tabla, bordes flush
```

---

## 9. Eventos y Real-time

### Declarar eventos del módulo

```typescript
// src/modules/mi_modulo/events.ts
import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'mi_modulo',  // SIEMPRE moduleId, NUNCA module
  events: [
    // clientBroadcast: true → SSE al browser del mismo tenant
    { id: 'mi_modulo.item.created', label: 'Item creado', entity: 'item', category: 'crud', clientBroadcast: true },
    { id: 'mi_modulo.item.updated', label: 'Item actualizado', entity: 'item', category: 'crud', clientBroadcast: true },
    { id: 'mi_modulo.item.deleted', label: 'Item eliminado', entity: 'item', category: 'crud' },
    // excludeFromTriggers: true → eventos internos no disponibles en Workflows UI
    { id: 'mi_modulo.process.before', label: 'Antes del proceso', category: 'lifecycle', excludeFromTriggers: true },
  ],
} as const)
```

```bash
yarn generate  # SIEMPRE después de crear/modificar events.ts
```

### Emitir eventos desde routes / workers

```typescript
// Desde route handler custom:
import { emitLifecycle } from '@app/lib/emit-lifecycle'
import { eventsConfig } from '../events'  // solo importar del MISMO módulo

await emitLifecycle(eventsConfig, 'mi_modulo.item.created', scope, {
  id: newItem.id,
  name: newItem.name,
})

// Desde worker (ctx.resolve):
const eventBus = ctx.resolve('eventBus')
if (eventBus) {
  eventBus.emit('mi_modulo.item.updated', { tenantId, organizationId, id })
}
```

### 9.2 Cross-module events — NUNCA importar eventsConfig ajeno

```typescript
// ❌ INCORRECTO — cross-module import (build failure en Turbopack)
import { eventsConfig } from '../../../otro_modulo/events'

// ✅ CORRECTO — via DI event bus
const eventBus = ctx.container.resolve('eventBus') as {
  emitEvent: (id: string, payload: Record<string, unknown>, opts?: { persistent?: boolean }) => Promise<void>
} | null
if (eventBus) {
  await eventBus.emitEvent('otro_modulo.entity.action', {
    tenantId: scope.tenantId,
    organizationId: scope.organizationId,
    id: entityId,
  })
}
```

### Suscriptores (subscribers)

```typescript
// src/modules/mi_modulo/subscribers/on-otro-evento.ts
export const metadata = {
  event: 'sales.order.completed',
  persistent: true,
  id: 'mi_modulo.on-order-completed',
}

export default async function handler(payload: any, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = { tenantId: payload.tenantId, organizationId: payload.organizationId }
  // ... lógica reactiva
}
```

---

## 10. Seguridad y RBAC

### Declarar features en acl.ts

```typescript
// src/modules/mi_modulo/acl.ts
export const features = [
  { id: 'mi_modulo.view',   title: 'Ver registros',    module: 'mi_modulo' },
  { id: 'mi_modulo.create', title: 'Crear registros',  module: 'mi_modulo' },
  { id: 'mi_modulo.edit',   title: 'Editar registros', module: 'mi_modulo' },
  { id: 'mi_modulo.delete', title: 'Eliminar registros', module: 'mi_modulo' },
]
export default features
```

**Feature IDs son INMUTABLES una vez en producción** (se almacenan en DB como `role_features.feature_id`).
Si renombras, mantén el viejo como alias hasta completar la migración.

### Asignar roles en setup.ts

```typescript
// src/modules/mi_modulo/setup.ts
import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['mi_modulo.*'],      // wildcard: todos los permisos
    employee: ['mi_modulo.view'],   // solo ver
  },
  async seedDefaults({ em, tenantId, organizationId }) {
    // datos iniciales siempre presentes (idempotente)
  },
  async onTenantCreated({ em, tenantId, organizationId }) {
    // config inicial del tenant
  },
}
export default setup
```

```bash
# Después de agregar features, sincronizar tenants existentes:
yarn mercato auth sync-role-acls
# Con --tenant <id> para un tenant específico
```

### RBAC en páginas

```typescript
// Declarativo en page.meta.ts (preferido)
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['mi_modulo.view'],  // NUNCA requireRoles
  // requireRoles está deprecated — nombres de roles son mutables
}
```

### Wildcard-aware feature matching

```typescript
// NUNCA comparar features con includes/Set.has directamente
// ❌ features.includes('mi_modulo.view')
// ❌ grantedSet.has('mi_modulo.view')

// ✅ CORRECTO — soporta wildcards como 'mi_modulo.*'
import { hasFeature, hasAllFeatures } from '@open-mercato/shared/security/features'
if (hasFeature(grantedFeatures, 'mi_modulo.view')) { ... }
```

### Encriptación de datos sensibles (PII / GDPR)

```typescript
// src/modules/mi_modulo/encryption.ts
import type { ModuleEncryptionMap } from '@open-mercato/shared/modules/encryption'

export const defaultEncryptionMaps: ModuleEncryptionMap[] = [
  {
    entityId: 'mi_modulo:persona',
    fields: [
      { field: 'first_name' },
      { field: 'last_name' },
      { field: 'phone' },
      { field: 'email', hashField: 'email_hash' }, // para lookup por igualdad
    ],
  },
]
export default defaultEncryptionMaps

// Al leer — NUNCA em.find/em.findOne directamente:
import { findWithDecryption, findOneWithDecryption } from '@open-mercato/shared/lib/encryption/find'
const records = await findWithDecryption(em, 'PersonaEntity', filter, undefined, { tenantId, organizationId })
```

```bash
# Aplicar encriptación a tenants existentes:
yarn mercato entities seed-encryption --tenant <tenantId>
```

---

## 11. Portal del cliente

### Estructura de páginas de portal

```
src/modules/mi_modulo/frontend/
└── [orgSlug]/           ← OBLIGATORIO como primer segmento
    └── portal/
        └── mi-seccion/
            ├── page.tsx      ← 'use client' · usar DataTable/apiCall
            └── page.meta.ts  ← requireCustomerAuth + nav
```

```typescript
// page.meta.ts de portal
export const metadata: PageMetadata = {
  requireCustomerAuth: true,                         // NO requireAuth
  requireCustomerFeatures: ['mi_modulo.portal.view'], // NOT requireFeatures
  nav: { label: 'Mi Sección', labelKey: 'mi_modulo.portal.nav', group: 'main', order: 20 },
}
```

### DataTable en portal

```typescript
'use client'
import { DataTable } from '@open-mercato/ui'  // no /backend/ para portal
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'

// Omitir: exporter, perspective, advancedFilter, columnChooser,
//         injectionSpotId, replacementHandle, bulkActions (admin-only)
```

---

## 12. Patrones específicos de crm-world

### 12.1 Kysely — acceso cross-module

```typescript
// SIEMPRE via Kysely, NUNCA via imports de entidades
const kysely = (em as any).getKysely()  // as any SIEMPRE

// Leer datos de otro módulo:
const customer = await kysely
  .selectFrom('customer_entities')  // tabla del módulo customers
  .select(['id', 'display_name', 'primary_email'])
  .where('id', '=', customerId)
  .where('tenant_id', '=', scope.tenantId)
  .executeTakeFirst()

const name = (customer as any)?.display_name  // as any SIEMPRE al acceder propiedades
```

### 12.2 Patrones Venezuela

```typescript
// Módulos base activos en todos los tenants:
// venezuela_rates  → tasas BCV + paralelo via DolarApi
// payment_methods  → 7 métodos locales (Zelle, Binance, pago móvil, etc.)
// ve_fiscal        → RIF/Cédula validation, IVA 16%, IGTF 3%
// ve_tenant_defaults → auto-config al crear tenant

// Validación de RIF:
import { rifSchema, cedulaSchema } from '@/modules/ve_fiscal/data/validators'
const result = rifSchema.safeParse('J-12345678-9') // normaliza a X-XXXXXXXX-X

// Tasas fiscales vigentes:
import { IVA_RATES, IGTF_RATES } from '@/modules/ve_fiscal/data/validators'
// IVA_RATES.general = 16  · IVA_RATES.reduced = 8  · IVA_RATES.exempt = 0
// IGTF_RATES.regular = 3  (aplica en pagos en divisas)

// Multi-tenancy: SIEMPRE filtrar por tenant_id + organization_id
// Moneda base: USD  · Formato decimal: coma  · Separador miles: punto
// Zona horaria: America/Caracas (UTC-4)
// Prefijo telefónico: +58
```

### 12.3 PDFs con @react-pdf/renderer

```typescript
// En API routes:
// @ts-ignore — suprimir tipos de react-pdf
import { renderToStream } from '@react-pdf/renderer'
import * as React from 'react'
import { MiDocumento } from '../../documents/MiDocumento'
import { loadOrgBranding } from '@app/lib/pdf/org-branding'

export async function GET(request: Request, ctx: any) {
  const kysely = (ctx.container.resolve('em') as any).getKysely()
  const org = await loadOrgBranding(kysely, ctx.scope)

  const stream = await renderToStream(React.createElement(MiDocumento, { data: { org, ... } }))
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const pdfBuffer = Buffer.concat(chunks)

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="doc.pdf"`,
    },
  })
}

// En documentos TSX:
// @ts-ignore
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { COLORS, FONTS, FONT_SIZES, SPACING, PAGE, type OrgBranding } from '@app/lib/pdf/design'
import { baseStyles, DocHeader, StatusBanner, Section, DetailRow, DocFooter } from '@app/lib/pdf/components'
```

**Importante**: `@react-pdf/renderer` está en `serverExternalPackages` en `next.config.ts`. No mover.

### 12.4 emitLifecycle — patrón estándar

```typescript
// src/lib/emit-lifecycle.ts (ya existe — no duplicar)
import { emitLifecycle } from '@app/lib/emit-lifecycle'

// Usar siempre DESPUÉS de la escritura en DB
await emitLifecycle(eventsConfig, 'mi_modulo.item.created', scope, {
  id: newItem.id,
})
```

---

## 13. Testing

### Unit tests (Jest)

```bash
yarn test                    # todos los unit tests
yarn test --coverage         # con cobertura
yarn test path/to/spec.ts    # un test específico
```

Estructura: `src/modules/<modulo>/__tests__/<archivo>.spec.ts`
Config: `jest.config.cjs` (ts-jest en modo CJS, con reflect-metadata)

### Integration tests (Playwright)

```bash
yarn test:integration:ephemeral  # app efímera + DB + Playwright
yarn test:integration            # contra BASE_URL existente
```

Estructura: `src/modules/<modulo>/__integration__/<archivo>.spec.ts`
Config: `.ai/qa/tests/playwright.config.ts` (auto-discover)

### Patrones de unit test

```typescript
// Para lógica pura (validators, parsers, scoring):
import { rifSchema } from '../data/validators'

describe('rifSchema', () => {
  it('normalizes J123456789 to J-12345678-9', () => {
    const result = rifSchema.safeParse('J123456789')
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe('J-12345678-9')
  })
})

// Para scoring engines con Kysely mockeado:
function makeMockEm(property: any, preferences: any[]) {
  return {
    getKysely: () => ({
      selectFrom: (table: string) => {
        const b: any = {
          selectAll: () => b, where: () => b,
          executeTakeFirst: jest.fn().mockResolvedValue(table === 'properties' ? property : preferences[0]),
          execute: jest.fn().mockResolvedValue(table === 'contact_preferences' ? preferences : [property]),
        }
        return b
      },
    }),
  } as any
}
```

---

## 14. Deploy y Build — diagnóstico

### Si `yarn build` falla en Coolify (exit code 1)

```bash
# Ver el error real en logs de Coolify (paso #15 = yarn build)
# Filtrar por errores TypeScript:
grep -E "Type error|Cannot find|Property.*does not exist|is not assignable" <coolify-logs>
```

### Errores frecuentes y solución

| Error en build | Causa | Fix |
|---|---|---|
| `Property 'X' does not exist on type '{}'` | Map sin tipo / Kysely sin cast | `Map<string, any>` + `(row as any).x` |
| `Cannot find module '../../data/entities'` | Path incorrecto por profundidad | Contar niveles correctamente |
| `failed to solve ... exit code: 1` | Error TypeScript o OOM | Ver log completo de paso #15 |
| `Export register doesn't exist` | di.ts sin `export function register` | Agregar función vacía |
| `@Property()` sin type crash en runtime | Turbopack no emite decorator metadata | Agregar `type: '...'` explícito |
| `module: 'x'` en createModuleEvents | API renombrada en v0.6.1 | Cambiar a `moduleId: 'x'` |
| `mapToEntity missing` | makeCrudRoute v0.6.1 requiere ambos | Agregar mapToEntity + applyToEntity |
| OOM en build | CX33 sin RAM | NODE_OPTIONS="--max-old-space-size=4096" |

### Diferencia local vs producción

| Aspecto | `yarn dev` (local) | `yarn build` (producción) |
|---|---|---|
| TypeScript | Turbopack (permisivo) | tsc strict mode |
| `@Property()` sin type | Puede funcionar | FALLA con crash |
| `Map` sin tipo | Infiere correctamente | Infiere como `{}` |
| `as any` en Kysely | A veces opcional | SIEMPRE obligatorio |
| Cross-module imports | Puede resolver | FALLA en Turbopack |

### Después de cambios estructurales

```bash
yarn generate                                        # siempre
yarn mercato configs cache structural --all-tenants  # si hay sidebar/nav
yarn dev:reset                                       # si Turbopack sirve chunks viejos
```

---

## 15. Checklists SDD

### ✅ Checklist: Nuevo módulo

```
PRE-IMPLEMENTACIÓN
[ ] Spec escrito en .ai/specs/YYYY-MM-DD-nombre.md y aprobado
[ ] Spec incluye: Entities · API Endpoints · RBAC Features · Admin Pages · Events

ESTRUCTURA
[ ] src/modules/<modulo>/index.ts creado con ModuleInfo
[ ] src/modules/<modulo>/di.ts creado con export function register
[ ] Módulo registrado en src/modules.ts: { id: 'modulo', from: '@app' }

ENTIDADES
[ ] Todos los @Property tienen type: explícito
[ ] tenant_id + organization_id en todas las entidades
[ ] created_at · updated_at · deleted_at presentes
[ ] Tabla en plural, snake_case
[ ] Import desde @mikro-orm/decorators/legacy

API ROUTES
[ ] metadata exportado por método HTTP
[ ] openApi = {} exportado
[ ] makeCrudRoute con mapToEntity + applyToEntity + indexer
[ ] Handler custom usa (request: Request, ctx: any)
[ ] Kysely usa (em as any).getKysely()

RBAC
[ ] Features declarados en acl.ts con ids: 'modulo.accion'
[ ] defaultRoleFeatures en setup.ts para admin + employee
[ ] yarn mercato auth sync-role-acls ejecutado (o documentado para ejecutar)

EVENTOS
[ ] events.ts usa moduleId: (no module:)
[ ] as const en el array de events
[ ] yarn generate ejecutado después

UI BACKEND
[ ] 'use client' en todos los page.tsx
[ ] page.meta.ts usa React.createElement para iconos
[ ] Sin colores hardcoded (text-red-*, bg-green-*, etc.)
[ ] Sin tamaños arbitrarios (text-[13px], p-[13px])
[ ] CrudForm / DataTable / Button — no HTML raw

CALIDAD
[ ] Strings visibles en i18n/es.json + i18n/en.json
[ ] Sin imports cross-module directos
[ ] yarn typecheck pasa sin errores
[ ] Tests unitarios para validators y lógica de negocio
```

### ✅ Checklist: Nueva página backend

```
[ ] 'use client' como primera línea
[ ] Importar desde @open-mercato/ui (no HTML raw)
[ ] Sin text-red-*, bg-green-*, text-amber-* — usar tokens semánticos
[ ] Sin text-[Xpx] arbitrario — usar escala Tailwind
[ ] Sin p-[Xpx] arbitrario — usar escala 4px
[ ] page.meta.ts con requireFeatures (no requireRoles)
[ ] Icono en page.meta.ts via React.createElement (no lucide import)
[ ] Estado loading → notFound → error → ready (no colapsar)
[ ] apiCall en lugar de fetch()
[ ] LoadingMessage / ErrorMessage de @open-mercato/ui/backend/detail
[ ] Button con type="button" explícito en no-submit
[ ] IconButton con aria-label en icon-only buttons
[ ] Dialogs: Cmd/Ctrl+Enter submit · Escape cancel
[ ] useGuardedMutation si no usa CrudForm para escrituras
[ ] useAppEvent si necesita real-time updates
```

### ✅ Checklist: Nueva vertical completa

```
PLANNING
[ ] Spec completo en .ai/specs/ con todas las entidades y módulos
[ ] Aprobación del usuario ANTES de empezar

POR MÓDULO (repetir para cada módulo de la vertical)
[ ] Módulo completo (index · di · acl · setup · events · entities · validators · api · backend · i18n)
[ ] Registrado en modules.ts
[ ] yarn generate ejecutado

TRANSVERSAL
[ ] Integración con venezuela_rates (si usa monedas)
[ ] Integración con ve_fiscal (si tiene facturación)
[ ] search.ts en módulos con búsqueda Cmd+K
[ ] notifications.ts si el módulo tiene alertas
[ ] ai-agents.ts + ai-tools.ts si tiene asistente IA
[ ] Dashboard widgets si aplica

CALIDAD FINAL
[ ] yarn typecheck sin errores
[ ] yarn build sin errores (verificar localmente si es posible)
[ ] PR con spec aprobado referenciado
[ ] Tests unitarios para lógica de negocio
[ ] Un PR por módulo o PR atómico bien definido
```

### ✅ Checklist: Pre-commit (cualquier cambio TypeScript)

```
[ ] @Property() tiene type: explícito en todas las entidades tocadas
[ ] (em as any).getKysely() — cast presente
[ ] makeCrudRoute con mapToEntity + applyToEntity
[ ] createModuleEvents usa moduleId: (no module:)
[ ] API routes custom: (request: Request, ctx: any)
[ ] em.create() y em.find() en seeds usan as any
[ ] new Map() tiene tipo: new Map<string, any>()
[ ] Map.get() + (value as any) al acceder propiedades
[ ] Kysely results usan (row as any).campo
[ ] Import paths relativos correctos (contar ../../ niveles)
[ ] Sin imports cross-module (de otro módulo @app)
[ ] Componentes UI de @open-mercato/ui — no HTML raw
[ ] Strings visibles en i18n/es.json
[ ] metadata + openApi exportados en API routes
[ ] Sin colores hardcoded (text-red-*, bg-green-*, etc.)
[ ] Sin tamaños arbitrarios (text-[Xpx], p-[Xpx])
[ ] yarn typecheck pasa sin errores
```

---

## 16. Comandos de referencia rápida

```bash
# Desarrollo
yarn dev                     # dev con splash screen
yarn dev:verbose             # dev con logs completos
yarn dev:reset               # limpiar cache Turbopack cuando sirve chunks viejos

# Generador (correr después de cambios en módulos)
yarn generate
yarn mercato configs cache structural --all-tenants

# Base de datos
yarn db:generate             # generar SQL de migración (revisar antes de commitear)
yarn db:migrate              # aplicar migraciones (solo cuando se pide explícitamente)
yarn db:greenfield           # reset completo de DB (solo en dev)

# Build y calidad
yarn build                   # build de producción (yarn generate && next build)
yarn typecheck               # tsc --noEmit
yarn lint                    # next lint

# Tests
yarn test                    # unit tests (Jest)
yarn test --coverage         # con cobertura
yarn test:integration:ephemeral  # integration tests (Playwright + app efímera)

# Auth / ACL
yarn mercato auth sync-role-acls          # sincronizar features a roles existentes
yarn mercato auth sync-role-acls --tenant <id>

# Tenant
yarn mercato auth setup      # crear nuevo tenant con admin

# Encriptación
yarn mercato entities seed-encryption --tenant <tenantId>

# Módulos
yarn mercato module add @open-mercato/<pkg>   # instalar módulo oficial
yarn mercato eject --list                      # ver módulos ejectables
```

---

## 17. Lecciones aprendidas (LESSONS LEARNED)

Patrones críticos que han causado bugs o builds rotos. Ver historial completo en `docs/PATTERNS.md` y `docs/COOKBOOK.md`.

| Lección | Regla derivada |
|---------|----------------|
| Turbopack no emite decorator metadata | `@Property({ type: '...' })` SIEMPRE |
| `getKysely()` no está en los tipos públicos | `(em as any).getKysely()` SIEMPRE |
| MikroORM v7 strict types en create/find | `as any` en seeds SIEMPRE |
| `module:` renombrado a `moduleId:` en v0.6.1 | Usar `moduleId:` en createModuleEvents |
| `mapToEntity`/`applyToEntity` requerido en v0.6.1 | Ambos SIEMPRE en makeCrudRoute |
| di.ts sin `register` → build failure | `export function register` SIEMPRE |
| ratelimit_probe sin index.ts/di.ts → build failure | Todos los @app modules necesitan ambos |
| Cross-module import → Turbopack build failure | Usar Kysely o DI event bus |
| `@react-pdf/renderer` no en serverExternalPackages → falla | Está en next.config.ts - no mover |
| Turbopack más permisivo que `yarn build` | Siempre testear con `yarn build` antes de PR |
| Kysely `Map` sin tipo → TypeScript strict falla | `new Map<string, any>()` + `(val as any)` |
| `LoadingMessage` sin `label` prop → error en v0.6.1 | `<LoadingMessage label="Cargando..." />` |
| `lucide-react` en page.meta.ts → rompe sidebar | `React.createElement('svg', ...)` en meta |
| `yarn.lock` vacío → builds no-deterministas | Commitear lockfile completo SIEMPRE |
| No usar raw `<button>` → UX inconsistente | `Button` o `IconButton` SIEMPRE |
| `notFound` colapsado con `error` → UX confuso | Estado `notFound` separado en páginas detail |
| Feature check con `includes()` → wildcard ACL falla | Usar `hasFeature()` de @open-mercato/shared |
| Flush antes de relation syncs | Flush escalares antes de queries de relaciones |
| Event bus en `globalThis` para dev HMR | No duplicar bus — usar `ctx.container.resolve('eventBus')` |

---

## 18. Referencias

| Doc | Descripción |
|-----|-------------|
| `AGENTS.md` | Guía standalone app (dev commands, módulos, routing) |
| `docs/PATTERNS.md` | Chainlock: 13 errores conocidos + soluciones |
| `docs/COOKBOOK.md` | Patrones + historial de incidentes |
| `docs/GUIDELINES.md` | Lineamientos organizacionales (6 principios) |
| `docs/DEVELOPMENT.md` | Guía de creación de módulos paso a paso |
| `docs/CONTEXT.md` | Contexto del proyecto Aika (repos, infra, accesos) |
| `docs/REALTIME.md` | Guía completa de clientBroadcast y SSE |
| `.ai/specs/` | Specs aprobados — fuente de verdad de implementaciones |
| `docs/open-mercato-reference/` | AGENTS.md del monorepo open-mercato (caché local) |
| `/workspace/open-mercato/` | Repo clonado open-mercato (código fuente del framework) |

---

> **Última sincronización con open-mercato**: 2026-05-26
> Fuentes: AGENTS.md · .ai/ds-rules.md · .ai/ui-components.md · .ai/lessons.md ·
> packages/ui/AGENTS.md · packages/ui/src/backend/AGENTS.md ·
> packages/shared/AGENTS.md · packages/core/AGENTS.md
