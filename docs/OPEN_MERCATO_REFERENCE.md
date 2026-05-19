# Fuentes de Verdad — Open Mercato

> **IMPORTANTE**: Cuando tengas dudas sobre cómo implementar algo, consulta estas fuentes EN ESTE ORDEN.

---

## 1. Repositorio oficial (código fuente)

**URL**: https://github.com/open-mercato/open-mercato

Este es la fuente de verdad #1. El código real siempre gana sobre la documentación.

### Dónde buscar patrones:

| Necesitas... | Busca en... |
|---|---|
| Cómo definir entidades | `packages/core/src/modules/*/data/entities.ts` |
| Cómo hacer CRUD routes | `packages/core/src/modules/*/api/*/route.ts` |
| Cómo configurar search | `packages/core/src/modules/*/search.ts` |
| Cómo definir eventos | `packages/core/src/modules/*/events.ts` |
| Cómo registrar DI | `packages/core/src/modules/*/di.ts` |
| Cómo hacer setup/seeds | `packages/core/src/modules/*/setup.ts` |
| Cómo crear páginas | `packages/core/src/modules/*/backend/*/page.tsx` |
| Tipos del CRUD factory | `packages/shared/src/lib/crud/factory.ts` |
| Tipos de search | `packages/shared/src/modules/search.ts` |
| Tipos de eventos | `packages/shared/src/modules/events/` |

### Ejemplo de referencia (módulo `customers`):
```
packages/core/src/modules/customers/
├── data/entities.ts      ← Entidades con @Property({ columnType: 'uuid' })
├── api/*/route.ts        ← CRUD con mapToEntity
├── search.ts             ← SearchModuleConfig
├── events.ts             ← createModuleEvents({ moduleId: ... })
├── di.ts                 ← asClass(Service).scoped()
├── setup.ts              ← ModuleSetupConfig
└── backend/*/page.tsx    ← Páginas React
```

---

## 2. Documentación oficial

**URL**: https://docs.openmercato.com/

### Páginas clave:

| Tema | URL |
|------|-----|
| Crear módulo | https://docs.openmercato.com/customization/create-first-module |
| Entidades y migraciones | https://docs.openmercato.com/customization/create-inventory-data |
| API REST (CRUD factory) | https://docs.openmercato.com/customization/create-inventory-api |
| Arquitectura | https://docs.openmercato.com/architecture/system-overview |
| IoC Container | https://docs.openmercato.com/framework/ioc/container |
| Módulos | https://docs.openmercato.com/framework/modules/overview |
| Rutas y páginas | https://docs.openmercato.com/framework/modules/routes-and-pages |
| Entidades (framework) | https://docs.openmercato.com/framework/database/entities |

### ⚠️ ADVERTENCIA sobre la documentación

La documentación puede estar **desactualizada** respecto al código real. Ejemplo conocido:

- La docs muestra `create: { schema }` sin `mapToEntity`
- El código real (v0.6.1) REQUIERE `mapToEntity`

**Cuando hay conflicto entre docs y código, el código gana.**

---

## 3. Discrepancias conocidas (docs vs código real)

| Docs dice | Código real requiere | Impacto |
|-----------|---------------------|---------|
| `@Property()` sin type | `@Property({ columnType: 'uuid' })` | Runtime crash sin metadata |
| `create: { schema }` | `create: { schema, mapToEntity }` | Build error |
| `module: 'name'` en events | `moduleId: 'name'` | Build error |
| `import from '@mikro-orm/core'` | `import from '@mikro-orm/decorators/legacy'` | Puede funcionar pero legacy es más seguro |

---

## 4. Patrón correcto de entidad (extraído del repo, NO de la docs)

La documentación usa `columnType`. El código interno del core usa `type`. Ambos funcionan, pero `columnType` es más explícito y seguro con Turbopack:

```typescript
import { Entity, Property, PrimaryKey } from '@mikro-orm/decorators/legacy'
import { v4 } from 'uuid'

@Entity({ tableName: 'my_items' })
export class MyItemEntity {
  @PrimaryKey({ columnType: 'uuid' })
  id: string = v4()

  @Property({ columnType: 'uuid' })
  tenant_id!: string

  @Property({ columnType: 'uuid' })
  organization_id!: string

  @Property({ columnType: 'text' })
  name!: string

  @Property({ columnType: 'integer' })
  quantity!: number

  @Property({ columnType: 'text', nullable: true })
  description?: string | null

  @Property({ columnType: 'boolean', default: false })
  is_active: boolean = false

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  created_at: Date = new Date()

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()', onUpdate: () => new Date() })
  updated_at: Date = new Date()

  @Property({ columnType: 'timestamptz', nullable: true })
  deleted_at?: Date | null
}
```

---

## 5. Patrón correcto de CRUD route (extraído del repo)

```typescript
import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { MyItemEntity } from '../../data/entities'
import { createSchema, updateSchema } from '../../data/validators'

const listSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
}).passthrough()

const routeMetadata = {
  GET:    { requireAuth: true, requireFeatures: ['my_module.view'] },
  POST:   { requireAuth: true, requireFeatures: ['my_module.create'] },
  PUT:    { requireAuth: true, requireFeatures: ['my_module.edit'] },
  DELETE: { requireAuth: true, requireFeatures: ['my_module.delete'] },
}

export const metadata = routeMetadata

const crud = makeCrudRoute({
  metadata: routeMetadata,
  orm: {
    entity: MyItemEntity,
    idField: 'id',
    orgField: 'organization_id',
    tenantField: 'tenant_id',
    softDeleteField: 'deleted_at',
  },
  list: { schema: listSchema },
  create: {
    schema: createSchema,
    mapToEntity: (input: any) => ({ ...input }),
  },
  update: {
    schema: updateSchema,
    applyToEntity: (entity: any, input: any) => { Object.assign(entity, input) },
  },
})

export const GET = crud.GET
export const POST = crud.POST
export const PUT = crud.PUT
export const DELETE = crud.DELETE

export const openApi = {}
```

---

## 6. Por qué fallamos tanto

### Causa raíz
Los módulos se escribieron siguiendo la **documentación** (que está desactualizada) en vez del **código fuente real**. Además, el build pasaba "a ciegas" porque `NODE_ENV=production` como buildtime ocultaba errores de tipos.

### Lección
1. Siempre verificar contra el código fuente del repo, no solo la docs
2. Siempre correr el type-checker localmente antes de deployar
3. Nunca confiar en que "si compila, funciona" — verificar también en runtime
4. Usar `columnType` (no `type`) en decoradores para máxima compatibilidad con Turbopack

---

## 7. Checklist de verificación antes de cada PR

- [ ] Entidades usan `columnType:` explícito en TODOS los `@Property()`
- [ ] CRUD routes tienen `mapToEntity` y `applyToEntity`
- [ ] Events usan `moduleId:` (no `module:`)
- [ ] Kysely access usa `(em as any).getKysely()`
- [ ] Seeds usan `as any` en `em.create()` y `em.find()`
- [ ] Componentes UI tienen todas las props requeridas
- [ ] `useOrganizationScopeDetail()` retorna `string | null` — manejar el null
- [ ] Dependencias directas declaradas en package.json
- [ ] Verificado contra el código del repo de Open Mercato (no solo docs)
