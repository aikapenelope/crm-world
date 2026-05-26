# Auditoría de Conformidad con Open Mercato — crm-world

> **Fecha**: Mayo 2026  
> **Principio rector**: Cero desviaciones del framework OM. Toda solución debe
> estar documentada en los AGENTS.md oficiales de Open Mercato.  
> **Fuente de verdad**: Los archivos listados en §0 — ninguna regla en este
> documento es inventada; cada una cita su origen exacto.

---

## §0. Fuentes oficiales de OM utilizadas en esta auditoría

| Archivo | Contenido clave |
|---------|----------------|
| `open-mercato/packages/create-app/template/AGENTS.md` | Guía canónica de standalone apps: module structure, migrations, CRUD, i18n, design system, icons |
| `open-mercato/packages/core/AGENTS.md` | Entidades, migrations, events, subscribers, setup.ts, RBAC, commands |
| `open-mercato/packages/ui/AGENTS.md` | Design system, componentes, MUST rules |
| `open-mercato/packages/cli/AGENTS.md` | Workflow de migrations: db:generate, db:migrate, snapshots |
| `open-mercato/.ai/qa/AGENTS.md` | Testing: estructura de specs, helpers, naming |
| `open-mercato/packages/search/AGENTS.md` | Search entityId format, indexer configuration |
| `open-mercato/packages/core/src/modules/customers/AGENTS.md` | Módulo de referencia canónico para custom modules |

---

## §1. Resultado ejecutivo

```
CRÍTICO  ■■■■■■■■  224 de 234 tablas NO existen en producción (migrations no commiteadas)
ALTO     ■■■■■■    153 de 234 entidades SIN deleted_at (65%)
MEDIO    ■■■■      56 pages con strings hardcodeadas (sin useT())
BAJO     ■■■       6 page.meta.ts con icon: 'string' en lugar de React.createElement SVG
BAJO     ■■        15 archivos con colores Tailwind hardcodeados
OK       ✅        320/320 routes: openApi + metadata ✅
OK       ✅        97/98 módulos: defaultRoleFeatures en setup.ts ✅
OK       ✅        0 TypeScript errors ✅
```

---

## §2. CRÍTICO — Migrations no commiteadas (224 tablas)

### Referencia OM

`open-mercato/packages/cli/AGENTS.md`:
> "Module-scoped migrations using MikroORM:
>  yarn db:generate # Generate migrations for all modules (writes to src/modules/<module>/migrations/)
>  yarn db:migrate  # Apply all pending migrations (ordered, directory first)"

`open-mercato/packages/create-app/template/AGENTS.md`:
> "Treat yarn db:generate as a schema-diff probe. Default to the generated SQL,
> but if it emits unrelated churn, keep or write only the scoped SQL."

`open-mercato/packages/core/AGENTS.md:522-526`:
> "Module-scoped with MikroORM: files live in src/modules/<module>/migrations/
>  Generate: yarn db:generate (iterates all modules)
>  Apply: yarn db:migrate (ordered, directory first)
>  Default: update ORM entities and let yarn db:generate emit SQL."

### Estado actual

```
src/modules/example/migrations/          ← 2 archivos ✅
src/modules/example_customers_sync/migrations/ ← archivos ✅
src/modules/*/migrations/                ← VACÍO para los 111 módulos restantes ❌
```

Producción tiene **10 de 234 tablas custom**. Los 111 módulos no generan
errores de startup pero devuelven HTTP 500 en cada request de datos.

### Solución OM (documentada)

```bash
# PASO 1: Greenfield en producción (sin usuarios: seguro)
# Fuente: packages/cli/src/lib/db/commands.ts:423-561
yarn db:greenfield --yes
# → Genera Migration*.ts + .snapshot-*.json en src/modules/*/migrations/
# → Aplica todas las migrations

# PASO 2: Commitear los archivos generados
git add src/modules/*/migrations/
git commit -m "db: migration baseline completo para todos los módulos custom"

# PASO 3: Flujo permanente going forward
# Editar data/entities.ts → yarn db:generate → revisar → commitear
# Coolify deploy → yarn db:migrate (automático)
```

**Por qué greenfield y no solo db:generate:**
`packages/create-app/template/AGENTS.md` explica el flujo de una sola pasada:
> "Prefer writing migration files in one shot — generate them with yarn db:generate,
> review, commit, move on."

Con greenfield obtenemos UN migration file limpio por módulo desde cero, coherente
con el estado actual de las entidades. `db:generate` en 111 módulos sin snapshots
previos produciría ruido de dependencias entre módulos.

---

## §3. ALTO — Entidades sin `deleted_at` (153/234 entidades)

### Referencia OM

`open-mercato/packages/core/AGENTS.md:533`:
> "Include `deleted_at timestamptz null` for soft delete"

`open-mercato/packages/create-app/template/AGENTS.md` (Mandatory Module Mechanisms):
> "Multi-tenant scoping (default): Every tenant-scoped entity MUST include indexed
> `organization_id` and `tenant_id`; every read/write filters by them."

`open-mercato/packages/shared/src/lib/crud/factory.ts:149`:
```typescript
softDeleteField?: string | null
// default: 'deletedAt'; pass null to disable implicit soft delete filter
```

### Estado actual

65% de entidades custom NO tienen `deleted_at`. Esto viola el patrón OM de
soft delete y causó el problema de PR #127 (necesidad de `softDeleteField: null`).

### Clasificación de entidades

**Tipo A — DEBEN tener deleted_at** (registros editables por el usuario):
```
CondoMaintenanceRequestEntity, CondoWorkOrderEntity, CondoSupplierEntity,
AutoInspectionEntity, AcademySessionEntity, ConstTaskEntity,
MfgPurchaseOrderLineEntity, DistDeliveryItemEntity, TuitionPaymentEntity,
RetailStorefrontEntity, IspSubscriberEntity, RetailBranchEntity...
(~80 entidades que son registros de negocio editables)
```

**Tipo B — NO necesitan deleted_at** (append-only, registros de auditoría):
```
PropertyImageEntity (foto: se reemplaza, no soft-delete)
AnnouncementReadEntity (lectura: evento inmutable)
AgriSaleDispatchEntity (despacho: evento de inventario)
VeFiscalConfigEntity (config: se actualiza, no elimina)
MfgEnergyConsumptionEntity (medición: inmutable)
...(~73 entidades que son eventos/logs/mediciones)
```

### Solución OM para Tipo A

Para cada entidad Tipo A, agregar:

```typescript
// data/entities.ts — patrón de OM core
// Fuente: packages/core/src/modules/customers/data/entities.ts
@Property({ type: 'timestamptz', nullable: true })
deleted_at?: Date | null
```

Y en el route correspondiente, cambiar `softDeleteField: null` a:

```typescript
// route.ts — patrón OM
// Fuente: packages/core/src/modules/catalog/api/products/route.ts:743
orm: {
  entity: XxxEntity,
  idField: 'id',
  tenantField: 'tenant_id',
  orgField: 'organization_id',
  softDeleteField: 'deleted_at',  // ← patrón correcto para entidades con soft-delete
},
```

### Solución OM para Tipo B

Para entidades append-only que NO tienen deleted_at, el `softDeleteField: null`
en el route ES correcto (documentado en factory.ts:149). Estos son los ~110
routes que corregimos en PR #127.

### Plan de acción

1. Auditar cada una de las 153 entidades: ¿es Tipo A (editable) o Tipo B (inmutable)?
2. Para Tipo A: agregar `deleted_at` + actualizar route a `softDeleteField: 'deleted_at'`
3. Para Tipo B: confirmar que el route tiene `softDeleteField: null` (ya hecho en PR #127)
4. Generar migrations (`yarn db:generate`) después de agregar `deleted_at`

---

## §4. MEDIO — Strings hardcodeadas sin useT() (56 archivos)

### Referencia OM

`open-mercato/packages/create-app/template/AGENTS.md`:
> "i18n (every user-facing string): useT() client-side from
> @open-mercato/shared/lib/i18n/context, resolveTranslations() server-side;
> keys in src/i18n/<locale>.json"
> "MUST NOT hard-code user-facing strings — use useT() for all labels and messages"
> (UI AGENTS.md §Critical MUST rules #4)

### Estado actual

56 `page.tsx` tienen strings de UI hardcodeadas en español sin pasar por `useT()`.

### Solución OM

```typescript
// ANTES (OM-incorrecto):
<Button>Nuevo Circular</Button>

// DESPUÉS (OM-correcto):
import { useT } from '@open-mercato/shared/lib/i18n/context'
const t = useT()
<Button>{t('condo_comms.circulars.create.button', 'Nueva Circular')}</Button>
```

Patrón documentado en `packages/core/src/modules/customers/AGENTS.md`.

El segundo argumento de `t()` es el fallback en inglés — en producción
con idioma español, las traducciones vienen de `src/i18n/es.json`.

### Plan de acción

1. Crear `src/i18n/es.json` con todas las traducciones en español
2. Para cada page.tsx: reemplazar strings hardcodeadas por `t('module.key', 'fallback')`
3. Esto es un refactor progresivo — no bloquea funcionalidad

---

## §5. BAJO — Iconos en page.meta.ts usando string en lugar de SVG (6 archivos)

### Referencia OM

`open-mercato/packages/create-app/template/AGENTS.md`:
> "**Icons (page.meta.ts).** In page.meta.ts files, the icon field has a stricter
> contract — it is consumed by the sidebar renderer and must be a plain
> React.createElement('svg', …) tree, NOT a direct lucide-react import. After
> the lucide-react major upgrade, importing { IconName } from 'lucide-react'
> inside a meta file can break page-metadata serialization and cause the sidebar
> to drop the icon."

### Estado actual (archivos afectados)

```
properties/backend/properties/page.meta.ts:           icon: 'building-2'
properties/backend/properties/settings/page.meta.ts:  icon: 'settings'
market_intelligence/backend/market_intelligence/page.meta.ts: icon: 'trending-up'
mercadolibre_sync/backend/market_data/page.meta.ts:   icon: 'bar-chart-3'
transactions/backend/transactions/page.meta.ts:       icon: 'handshake'
matching/backend/matching/page.meta.ts:               icon: 'git-compare'
```

### Solución OM (patrón exacto de la documentación)

```typescript
// ANTES (OM-incorrecto):
export const metadata = {
  icon: 'building-2',  // ← string, puede fallar en serialización
  ...
}

// DESPUÉS (OM-correcto, exactamente como documenta template/AGENTS.md):
import React from 'react'

const buildingIcon = React.createElement(
  'svg',
  {
    width: 16, height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  // path values de lucide.dev/icons/building-2
  React.createElement('path', { d: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z' }),
  React.createElement('path', { d: 'M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2' }),
  React.createElement('path', { d: 'M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 0-2 2h-2' }),
  React.createElement('path', { d: 'M10 6h4' }),
  React.createElement('path', { d: 'M10 10h4' }),
  React.createElement('path', { d: 'M10 14h4' }),
  React.createElement('path', { d: 'M10 18h4' }),
)

export const metadata = {
  icon: buildingIcon,
  ...
}
```

---

## §6. BAJO — Colores Tailwind hardcodeados (15 archivos)

### Referencia OM

`open-mercato/packages/create-app/template/AGENTS.md`:
> "**Colors.** NEVER hardcode Tailwind status colors (text-red-500, bg-green-100,
> text-amber-*, text-emerald-*, bg-blue-*). Use semantic tokens:
> text-status-error-text, bg-status-success-bg, border-status-warning-border,
> text-status-info-icon."

`open-mercato/packages/ui/AGENTS.md §Critical MUST rules`:
> "Boy Scout rule: When modifying a file that still has hardcoded status colors
> or arbitrary text sizes, migrate at minimum the lines you touched to semantic tokens."

### Estado actual

Los 15 archivos con colores hardcodeados son mayoritariamente del módulo `example`
(que viene con el template OM y son ejemplos, no producción) y 2 módulos custom:
- `academy_groups/backend/academy_groups/[id]/page.tsx` — `bg-amber-*`
- `const_subcon/backend/const_subcon/page.tsx` — `text-amber-*`

### Solución OM

```typescript
// ANTES:
<div className="text-red-500">Error</div>
<div className="bg-green-100">Success</div>
<div className="text-amber-600">Warning</div>

// DESPUÉS (semantic tokens OM):
<div className="text-status-error-text">Error</div>
<div className="bg-status-success-bg">Success</div>
<div className="text-status-warning-text">Warning</div>
```

---

## §7. MEDIO — indexer.entityType: formato dot vs colon en routes

### Referencia OM

`open-mercato/packages/core/AGENTS.md:108-116`:
```typescript
// Always set indexer for query index coverage
makeCrudRoute({
  // ... other config
  indexer: { entityType: 'my_module:my_entity' },  // ← COLON en el ejemplo
})
```

`open-mercato/packages/create-app/template/AGENTS.md` (Mandatory Module Mechanisms):
> "CRUD APIs (factory): makeCrudRoute({ entity, entityId, operations, schema,
> indexer: { entityType } }) from @open-mercato/shared/lib/crud/factory"

El sistema OM core usa `E.catalog.catalog_product` (entity ID object) en lugar
de strings hardcodeados.

### Estado actual

crm-world tiene dos patrones mezclados:
- 118 routes usando DOT: `'module.entity'`
- 77 routes usando COLON: `'module:entity'`

### Análisis de compatibilidad

Investigando `open-mercato/packages/shared/src/lib/crud/factory.ts` y
`packages/core/src/modules/catalog/api/products/route.ts`:

El `indexer.entityType` para el **query index** usa el sistema de `E.*` (entity IDs
generados). El formato DOT que usa crm-world es el que espera el query index
(Kysely/PostgreSQL). El formato COLON es para el **search index** (Meilisearch).

Son sistemas diferentes:
- `indexer.entityType: 'module.entity'` → query index (DOT, correcto para CRUD routes)
- `search.ts entityId: 'module:entity'` → search/fulltext index (COLON, ya corregido en PR #125)

La mezcla en crm-world viene de usar el mismo string para ambos sistemas.
**El DOT en indexer.entityType es correcto para las CRUD routes.**

---

## §8. OK — Lo que SÍ cumple con OM

| Patrón OM | Estado en crm-world |
|-----------|---------------------|
| Todos los routes exportan `openApi` | ✅ 320/320 |
| Todos los routes exportan `metadata` con per-method auth | ✅ 320/320 |
| `defaultRoleFeatures` en setup.ts | ✅ 97/98 módulos |
| `makeCrudRoute` para todos los CRUD endpoints | ✅ |
| `page.meta.ts` colocado con cada page | ✅ |
| `requireAuth + requireFeatures` en metadata | ✅ |
| `apiCall` en lugar de raw `fetch` | ✅ (en pages con page.tsx completo) |
| `CrudForm` para forms de creación | ✅ (en los ~50 pages completos) |
| `DataTable` para listas | ✅ (en los pages con implementación) |
| `subscribers/*.ts` para event handling | ✅ |
| `workers/*.ts` para background jobs | ✅ |
| `acl.ts` con features declarados | ✅ todos los módulos |
| snake_case con prefijo `<module>_` en tablenames | ✅ la mayoría |
| TypeScript 0 errores | ✅ |
| Lint 0 errores | ✅ |

---

## §9. Plan de acción ordenado por prioridad OM

### Prioridad 1 — CRÍTICO (bloquea toda funcionalidad)

```
db:greenfield → commit migrations → db:migrate permanente
```

Fuente: `packages/create-app/template/AGENTS.md`, `packages/cli/AGENTS.md`

**Resultado esperado**: 234 tablas en producción, todos los módulos funcionales.

### Prioridad 2 — ALTO (seguridad y data integrity)

```
Auditar 153 entidades sin deleted_at:
  - Tipo A (editables): agregar deleted_at + softDeleteField: 'deleted_at' en route
  - Tipo B (inmutables): confirmar softDeleteField: null en route (ya hecho PR #127)
  - db:generate → commitear migrations por cada módulo modificado
```

Fuente: `packages/core/AGENTS.md:533`, `factory.ts:149`

**Resultado esperado**: Todas las entidades con el patrón correcto de soft delete.

### Prioridad 3 — MEDIO (UX y mantenibilidad)

```
i18n: reemplazar 56 archivos con strings hardcodeadas por useT()
```

Fuente: `template/AGENTS.md`, `ui/AGENTS.md MUST rules #4`

**Resultado esperado**: Aplicación internacionalizable, strings centralizadas.

### Prioridad 4 — BAJO (consistencia visual)

```
page.meta.ts: convertir 6 iconos string → React.createElement SVG
Tailwind: reemplazar colores hardcodeados → semantic tokens
```

Fuente: `template/AGENTS.md` (icons section), `ui/AGENTS.md` (colors section)

---

## §10. Flujo permanente documentado en OM

### Para cambios de schema (going forward)

```bash
# 1. Editar src/modules/<módulo>/data/entities.ts
# 2. Generar migration
yarn db:generate  # → src/modules/<módulo>/migrations/Migration<ts>_<mod>.ts

# 3. REVISAR el archivo generado (regla OM obligatoria)
#    Si hay migrations de otros módulos → eliminarlas
#    Si el snapshot está desactualizado → actualizar .snapshot-*.json

# 4. Commitear migration + snapshot EN EL MISMO COMMIT que el cambio de entidad
git add src/modules/<módulo>/migrations/ src/modules/<módulo>/data/entities.ts
git commit -m "db(<módulo>): agregar campo X"

# 5. Producción: Coolify deploy → yarn db:migrate aplicará automáticamente
```

Fuente: `packages/create-app/template/AGENTS.md:224-228`:
> "Prefer writing migration files in one shot — generate them with yarn db:generate,
> review, commit, move on."
> "Never hand-edit historical migrations that have shipped; add a new migration
> that performs the correction instead."

### Para nuevos módulos (going forward)

Fuente: `packages/create-app/template/AGENTS.md:169-176`:

```
src/modules/<nuevo_módulo>/
├── index.ts                    # metadata: { name, title, version }
├── acl.ts                      # features: ['modulo.view', 'modulo.manage']
├── setup.ts                    # defaultRoleFeatures + seedDefaults
├── di.ts                       # export function register(container)
├── data/
│   └── entities.ts             # @Entity, @PrimaryKey, @Property...
├── api/
│   └── <recurso>/
│       └── route.ts            # export metadata, openApi, GET, POST...
└── backend/
    └── <modulo>/
        ├── page.meta.ts        # requireAuth, requireFeatures, pageGroup...
        └── page.tsx            # DataTable con apiCall
```

**Agregar a `src/modules.ts`:**
```typescript
{ id: 'nuevo_modulo', from: '@app' }
```

**Después de crear:**
```bash
yarn generate                               # regenera .mercato/generated/
yarn db:generate                            # genera migration
yarn mercato auth sync-role-acls --all-tenants  # sincroniza ACL features
yarn mercato configs cache structural --all-tenants
```

---

## §11. Referencia rápida — Recursos OM

| Necesito... | Archivo OM |
|-------------|-----------|
| Estructura de un módulo custom | `packages/create-app/template/AGENTS.md:169-176` |
| Patrón de migration | `packages/cli/AGENTS.md:80-100` |
| Patrón de CRUD route | `packages/core/AGENTS.md:83-116` |
| Patrón de setup.ts | `packages/core/AGENTS.md:138-196` |
| Patrón de events.ts | `packages/core/AGENTS.md:212-237` |
| Patrón de subscribers | `packages/core/AGENTS.md:267-282` |
| Patrón de workers | `packages/create-app/template/AGENTS.md:481` |
| i18n en pages | `packages/create-app/template/AGENTS.md:483` |
| Iconos en page.meta.ts | `packages/create-app/template/AGENTS.md:562-593` |
| Colores semánticos | `packages/create-app/template/AGENTS.md:542-544` |
| Design system components | `packages/ui/AGENTS.md` |
| Testing patterns | `.ai/qa/AGENTS.md` |
| Search entityId format | `packages/search/AGENTS.md` |
| Encryption (PII) | `packages/create-app/template/AGENTS.md:487-536` |
| Soft delete pattern | `packages/core/AGENTS.md:533` |
| DI pattern (Awilix) | `packages/core/src/modules/sales/di.ts` (ejemplo) |
| Módulo de referencia completo | `packages/core/src/modules/customers/` |

---

*Documento generado: Mayo 2026 — crm-world (Open Mercato v0.6.2)*  
*Toda regla en este documento cita su fuente exacta en el repositorio OM.*  
*Ver también: docs/ROADMAP_INMEDIATO_Y_CAUSA_RAIZ_DB_MIGRATIONS.md*
