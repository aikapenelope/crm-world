# Fuentes de Verdad — Open Mercato

> **IMPORTANTE**: Cuando tengas dudas sobre cómo implementar algo, consulta estas fuentes EN ESTE ORDEN.
> Última revisión: Mayo 2026 (post CI verde, @open-mercato@0.6.1)

---

## 1. Repositorio oficial (código fuente) — FUENTE DE VERDAD #1

**URL**: https://github.com/open-mercato/open-mercato

El código real siempre gana sobre la documentación. Clonar localmente para inspeccionar:

```bash
git clone --depth 1 https://github.com/open-mercato/open-mercato /tmp/open-mercato
```

### Dónde buscar patrones:

| Necesitas... | Busca en... |
|---|---|
| Cómo definir entidades | `packages/core/src/modules/*/data/entities.ts` |
| Tipos del CRUD factory | `packages/shared/src/lib/crud/factory.ts` |
| CrudForm props | `packages/ui/src/backend/CrudForm.tsx` |
| DataTable props | `packages/ui/src/backend/DataTable.tsx` |
| useGuardedMutation API | `packages/ui/src/backend/injection/useGuardedMutation.ts` |
| flash() API | `packages/ui/src/backend/FlashMessages.tsx` |
| Tipos de search | `packages/shared/src/modules/search.ts` |
| Tipos de eventos | `packages/shared/src/modules/events/types.ts` |
| PageMetadata, ModuleInfo | `packages/shared/src/modules/registry.ts` |
| acl.ts patrón | `packages/core/src/modules/example/acl.ts` |
| jest.config.cjs standalone | `apps/mercato/jest.config.cjs` |
| CI workflow | `apps/mercato/.github/workflows/ci.yml` |
| jest-mikroorm-transformer | `scripts/jest-mikroorm-transformer.cjs` |

### Ejemplo de referencia (módulo `example`):
```
apps/mercato/src/modules/example/
├── acl.ts                ← DEBE tener export default features
├── data/entities.ts      ← @Property({ type: 'text' }) — usa `type` no `columnType`
├── data/validators.ts    ← Zod schemas
├── api/*/route.ts        ← CRUD routes con metadata
├── search.ts             ← SearchModuleConfig
├── events.ts             ← createModuleEvents({ moduleId, events } as const)
├── di.ts                 ← export function register(_: AppContainer) {}
├── setup.ts              ← ModuleSetupConfig
├── __tests__/*.spec.ts   ← Unit tests (jest)
└── backend/*/page.tsx    ← React pages
```

---

## 2. Documentación oficial

**URL**: https://docs.openmercato.com/

### ⚠️ ADVERTENCIA: la docs puede estar desactualizada

**Cuando hay conflicto entre docs y código, EL CÓDIGO GANA.**

---

## 3. Discrepancias conocidas (docs/código antiguo vs código real v0.6.1)

### Críticas (causan fallos de typecheck/build/runtime)

| Código antiguo / docs dice | Código correcto (v0.6.1) | Fuente | Impacto |
|---|---|---|---|
| `@Property()` sin type | `@Property({ type: 'text' })` | `packages/core/src/modules/example/data/entities.ts` | Runtime crash |
| `@Property({ columnType: 'uuid' })` | `@Property({ type: 'uuid' })` | `packages/ui/src/backend/CrudForm.tsx` CrudFieldBase | Build error |
| `create: { schema }` sin mapToEntity | `create: { schema, mapToEntity: (i) => ({...i}) }` | `packages/shared/src/lib/crud/factory.ts` | Build error |
| `module: 'name'` en events | `moduleId: 'name'` | `packages/shared/src/modules/events/types.ts` | Build error |
| `CrudForm entityId apiPath mode` | Esas props no existen — ver §4 | `packages/ui/src/backend/CrudForm.tsx` | TS2353 error |
| `DataTable extensionTableId` prop | No es una prop — se computa internamente | `packages/ui/src/backend/DataTable.tsx` | TS2353 excess prop |
| `DataTable emptyState={{ label, description }}` | `emptyState={<string o ReactNode>}` | `packages/ui/src/backend/DataTable.tsx:223` | TS2353 error |
| `useGuardedMutation()` sin args | `useGuardedMutation({ contextId: 'mod.page' })` | `packages/ui/src/backend/injection/useGuardedMutation.ts` | TS2554 error |
| `runMutation({ operation: 'str', mutationPayload: fn })` | `runMutation({ operation: async () => {...}, context })` | `packages/ui/src/backend/injection/useGuardedMutation.ts` | TS2345 error |
| `flash({ type: 'success', message: 'txt' })` | `flash('txt', 'success')` | `packages/ui/src/backend/FlashMessages.tsx` | TS2345 error |
| `DocHeader title subtitle docId` | `DocHeader docTitle docNumber` | `src/lib/pdf/components.tsx` | TS2322 error |
| `DocFooter org pageLabel` | `DocFooter generatedAt` | `src/lib/pdf/components.tsx` | TS2322 error |
| `acl.ts` sin export default | `export default features` **REQUERIDO** | `packages/core/src/modules/example/acl.ts` | `.mercato/generated/` falla `.default` |
| `z.record(schema)` (Zod v3) | `z.record(z.string(), schema)` (Zod v4) | `zod@4.x` docs | TS2554 error |
| `EventCategory: 'alert'` | `EventCategory: 'custom'` | `packages/shared/src/modules/events/types.ts` | TS2322 error |
| `CrudBuiltinField.name` | `CrudBuiltinField.id` | `packages/ui/src/backend/CrudForm.tsx` CrudFieldBase | TS2353 error |
| `CrudFormGroup.label` | `CrudFormGroup.title` (solo cuando hay `fields:`) | `packages/ui/src/backend/CrudForm.tsx` CrudFormGroup | TS2353 error |
| `RowActionItem.title` | `RowActionItem.label` | `packages/ui/src/backend/RowActions.tsx` | TS2353 error |
| `PageMetadata.hidden` | `PageMetadata.navHidden` | `packages/shared/src/modules/registry.ts` | TS2353 error |
| `PortalNavMetadata.group: 'vertical-name'` | Solo acepta `'main' \| 'account' \| undefined` | `packages/shared/src/modules/registry.ts` | TS2322 error |
| `tab.label` en tab unions | `tab.title` (o cast `(tab as any).title`) | Depende del componente | TS2339 error |

---

## 4. API correcta de CrudForm v0.6.1

**Fuente**: `node_modules/@open-mercato/ui/src/backend/CrudForm.tsx`

```tsx
// ✅ CORRECTO — API actual v0.6.1
<CrudForm
  fields={[
    { id: 'name', label: 'Nombre', type: 'text', required: true },
    { id: 'status', label: 'Estado', type: 'select', options: [...] },
  ]}
  groups={[
    { id: 'basic', title: 'Información básica', fields: ['name', 'status'] },
  ]}
  initialValues={{ name: record?.name ?? '', status: 'active' }}
  onSubmit={async (values) => {
    await apiCallOrThrow('/api/my-module/items', { method: 'POST', body: JSON.stringify(values) })
    flash('Guardado', 'success')
  }}
  cancelHref="/backend/my-module"
/>

// ❌ INCORRECTO — API antigua (ya no existe)
<CrudForm entityId="..." apiPath="/api/..." mode="create" fields={[...]} onSuccess={() => {}} />
```

**Reglas clave**:
- `CrudFieldBase.id` (no `name`)
- `CrudFieldBase.label` (el display label del campo)
- `CrudFormGroup.title` (no `label`) para el header del grupo
- `CrudFormGroup.fields` lista los `id` de los campos
- `cancelHref` (string) en vez de `onCancel` (función)
- `RowActionItem.label` (no `title`)

---

## 5. API correcta de useGuardedMutation v0.6.1

**Fuente**: `node_modules/@open-mercato/ui/src/backend/injection/useGuardedMutation.ts`

```tsx
// ✅ CORRECTO — API actual v0.6.1
const { runMutation } = useGuardedMutation({ contextId: 'my_module.page' })

const handleApprove = (item: ItemRow) => {
  runMutation({
    operation: async () => {
      await apiCallOrThrow(`/api/my-module/items/${item.id}/approve`, { method: 'POST', body: '{}' })
      flash('Aprobado', 'success')
      load()
    },
    context: { entityId: 'my_module.item', recordId: item.id },
  })
}

// ❌ INCORRECTO — API antigua
const { runMutation } = useGuardedMutation()
runMutation({
  operation: 'update',
  context: { entityId: 'my_module.item', recordId: item.id },
  mutationPayload: async () => { /* la función estaba aquí */ },
})
```

---

## 6. Patrones correctos de entidades v0.6.1

**Fuente**: `packages/core/src/modules/example/data/entities.ts`

```typescript
import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

@Entity({ tableName: 'my_items' })
export class MyItemEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = v4()

  @Property({ type: 'text' })         // 'text', no 'varchar'
  tenant_id!: string

  @Property({ type: 'text' })
  organization_id!: string

  @Property({ type: 'text' })
  name!: string

  @Property({ type: 'int', default: 0 })
  quantity!: number

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

---

## 7. acl.ts — export default OBLIGATORIO

**Fuente**: `packages/core/src/modules/example/acl.ts`

```typescript
// ✅ CORRECTO — el generador accede .default en el import
export const features = [
  { id: 'my_module.view', title: 'View my module', module: 'my_module' },
  { id: 'my_module.manage', title: 'Manage my module', module: 'my_module' },
]

export default features  // ← REQUERIDO. Sin esto el generador falla.

// ❌ INCORRECTO — causa error en .mercato/generated/modules.generated.ts
// Property 'default' does not exist on type 'typeof import(".../acl")'
```

---

## 8. Zod v4 — cambios de API

**Fuente**: `zod@4.x` changelog. El proyecto usa `"zod": "4.3.6"`.

```typescript
// ✅ CORRECTO — Zod v4 requiere key schema en z.record()
z.record(z.string(), z.unknown())
z.record(z.string(), z.object({ open: z.string(), close: z.string() }))

// ❌ INCORRECTO — Zod v3 syntax (un solo argumento)
z.record(z.unknown())    // TS2554: Expected 2-3 arguments, but got 1
```

---

## 9. EventCategory — valores válidos

**Fuente**: `packages/shared/src/modules/events/types.ts`

```typescript
export type EventCategory = 'crud' | 'lifecycle' | 'system' | 'custom'
// 'alert' NO existe — usar 'custom'
```

---

## 10. Checklist de verificación antes de cada PR

- [ ] `@Property({ type: '...' })` en TODOS los decoradores (no `columnType`)
- [ ] `acl.ts` tiene `export default features`
- [ ] `CrudForm` usa `id:` en campos, `title:` en grupos, `cancelHref` (no `onCancel`)
- [ ] `useGuardedMutation({ contextId: 'module.page' })` con contextId
- [ ] `runMutation({ operation: async () => {...}, context })` — operation es función
- [ ] `flash('msg', 'type')` — firmatura con 2 args (mensaje primero)
- [ ] `z.record(z.string(), valueSchema)` para Zod v4
- [ ] `EventCategory`: solo `'crud' | 'lifecycle' | 'system' | 'custom'`
- [ ] `DataTable.emptyState` es string o ReactNode (no objeto)
- [ ] `RowActionItem.label` (no `title`)
- [ ] `PageMetadata.navHidden` (no `hidden`)
- [ ] CI verde: `yarn lint && yarn typecheck && yarn test`
