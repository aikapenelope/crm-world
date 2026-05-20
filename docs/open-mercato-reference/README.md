# Open Mercato Framework Reference

> Copia directa de la documentación interna de Open Mercato v0.6.1.
> Fuente: https://github.com/open-mercato/open-mercato
> Fecha de copia: 2026-05-20

Estos archivos son la **fuente de verdad** para construir módulos custom sobre Open Mercato.
Cuando hay conflicto entre estos docs y la documentación web (docs.openmercato.com), **estos ganan**.

---

## Índice

| Archivo | Qué contiene | Cuándo consultarlo |
|---------|-------------|-------------------|
| [AGENTS-ROOT.md](AGENTS-ROOT.md) | Guía principal: Task Router, principios, convenciones, reglas críticas, comandos | **SIEMPRE** — leer primero |
| [AGENTS-CORE.md](AGENTS-CORE.md) | Extensibilidad: módulos, API routes, CRUD factory, setup, events, widgets, ACL, encryption, migrations | Al crear/modificar módulos |
| [AGENTS-UI.md](AGENTS-UI.md) | Componentes UI: CrudForm, DataTable, primitives, design system, portal, menu injection | Al construir UI |
| [AGENTS-UI-BACKEND.md](AGENTS-UI-BACKEND.md) | Reglas MUST para backend pages: apiCall, RowActions, LoadingMessage, useGuardedMutation | Al construir páginas admin |
| [AGENTS-SHARED.md](AGENTS-SHARED.md) | Utilidades compartidas: i18n, encryption, boolean parsing, feature matching, query engine | Al usar helpers cross-cutting |
| [AGENTS-CLI.md](AGENTS-CLI.md) | Generadores, migraciones, scaffolding, build order | Al generar código o migraciones |
| [AGENTS-EVENTS.md](AGENTS-EVENTS.md) | Event bus: declaración, subscribers, DOM Event Bridge (SSE), queue integration | Al agregar eventos/subscribers |
| [AGENTS-CACHE.md](AGENTS-CACHE.md) | Caching: strategies, tag invalidation, tenant scoping | Al agregar cache |
| [AGENTS-QUEUE.md](AGENTS-QUEUE.md) | Workers: strategies, concurrency, idempotency | Al agregar background jobs |
| [AGENTS-SEARCH.md](AGENTS-SEARCH.md) | Search: fulltext, vector, tokens, search.ts config | Al configurar búsqueda |
| [AGENTS-MODULE-CUSTOMERS.md](AGENTS-MODULE-CUSTOMERS.md) | **Módulo de referencia** — copiar patrones de aquí para CRUD nuevos | Al crear módulos nuevos |
| [AGENTS-MODULE-SALES.md](AGENTS-MODULE-SALES.md) | Sales: document flow, pricing, channels, shipments, payments | Al integrar con ventas |
| [AGENTS-MODULE-CATALOG.md](AGENTS-MODULE-CATALOG.md) | Catalog: products, variants, pricing resolvers, offers | Al integrar con catálogo |
| [DS-RULES.md](DS-RULES.md) | Design System: tokens de color, tipografía, radius, decision trees | Al elegir colores/estilos |
| [LESSONS.md](LESSONS.md) | Errores recurrentes y cómo evitarlos | Revisar antes de cada sesión |

---

## Reglas Clave para Aika (resumen ejecutivo)

### Estructura de módulo (auto-discovery)

```
src/modules/<module>/
├── index.ts              → metadata (ModuleInfo)
├── acl.ts                → features (RBAC)
├── setup.ts              → defaultRoleFeatures, onTenantCreated, seedDefaults
├── di.ts                 → export function register(container) {}
├── events.ts             → createModuleEvents({ moduleId, events }) as const
├── data/
│   ├── entities.ts       → MikroORM entities (@mikro-orm/decorators/legacy)
│   └── validators.ts     → Zod schemas
├── api/
│   └── <resource>/route.ts → makeCrudRoute + export openApi + export metadata
├── backend/
│   └── <module>/
│       ├── page.meta.ts  → nav entry (React.createElement SVG)
│       └── page.tsx      → 'use client' React page
├── frontend/             → public pages (requireAuth: false)
├── subscribers/          → event handlers (metadata + default export)
├── workers/              → background jobs (metadata + default export)
└── i18n/
    ├── es.json
    └── en.json
```

### API Route Handler Pattern (CORRECTO para standalone apps)

```typescript
// Para rutas con makeCrudRoute — no necesita handler custom
const crud = makeCrudRoute({ ... })
export const GET = crud.GET
export const POST = crud.POST

// Para rutas custom (dashboard, bulk operations, etc.)
export async function GET(request: Request, ctx: any) {
  const em = ctx.container.resolve('em')
  const scope = ctx.scope
  const user = ctx.user  // puede ser undefined en rutas públicas
  const kysely = (em as any).getKysely()
  // ...
}
```

### Convenciones de nombres

| Qué | Formato | Ejemplo |
|-----|---------|---------|
| Module ID | plural snake_case | `retail_branches` |
| Table name | plural snake_case con prefijo módulo | `retail_branches` |
| Column name | snake_case | `organization_id` |
| Event ID | module.entity.action (singular, past tense) | `retail_branches.transfer.approved` |
| Feature ID | module.action | `retail_branches.view` |
| JS/TS identifiers | camelCase | `organizationId` |

### Reglas de entidades MikroORM

```typescript
import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

@Entity({ tableName: 'my_items' })
export class MyItemEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  // SIEMPRE type: explícito (Turbopack no emite metadata)
  @Property({ type: 'text' })
  name!: string

  @Property({ type: 'boolean', default: false })
  is_active: boolean = false

  @Property({ type: 'timestamptz' })
  created_at: Date = new Date()

  @Property({ type: 'timestamptz', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ type: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
```

### Design System — Tokens (NUNCA hardcodear colores)

| Necesitas... | Usa... |
|---|---|
| Error/destructivo | `text-destructive`, `bg-destructive` |
| Texto principal | `text-foreground` |
| Texto secundario | `text-muted-foreground` |
| Acción primaria | `bg-primary`, `text-primary-foreground` |
| Fondo sutil | `bg-secondary`, `bg-accent`, `bg-muted` |
| Borde | `border-border`, `border-input` |
| Status success | `text-status-success-text`, `bg-status-success-bg` |
| Status warning | `text-status-warning-text` |
| Status error | `text-status-error-text` |

**PROHIBIDO**: `text-red-500`, `bg-green-100`, `text-amber-600`, `dark:` overrides en tokens semánticos.

### UI Backend — MUST Rules

1. NUNCA usar `fetch` raw — usar `apiCall` de `@open-mercato/ui/backend/utils/apiCall`
2. NUNCA usar `<button>` raw — usar `Button` o `IconButton`
3. SIEMPRE `type="button"` en botones que no son submit
4. Usar `LoadingMessage`/`ErrorMessage` de `@open-mercato/ui/backend/detail`
5. Usar `flash()` para feedback después de operaciones CRUD
6. Usar `DataTable` para listas, `CrudForm` para formularios
7. Cada dialog: `Cmd/Ctrl+Enter` submit, `Escape` cancel

---

## Diferencias Standalone vs Monorepo

En Aika (standalone app), los módulos están en `src/modules/` (no en `packages/core/src/modules/`).
Los paquetes se consumen como npm packages compilados (`@open-mercato/*`).
El generador escanea `node_modules/@open-mercato/*/dist/modules/` para los módulos core.

Lo que cambia:
- No hay acceso al source de los paquetes (solo `dist/`)
- `yarn generate` descubre módulos de ambas fuentes
- Las migraciones van en `src/modules/<module>/migrations/`
- El build es `yarn generate && next build`
