# Lineamientos de Desarrollo — Aika / crm-world

> **Este documento es vinculante.** Todo agente de IA y todo desarrollador humano que escriba
> código en este repositorio debe leer y respetar estos lineamientos antes de abrir cualquier PR.
> Se aplican sin excepción, independientemente de la urgencia o el tamaño del cambio.

---

## Origen de los lineamientos

Estos son los lineamientos organizacionales propietarios que rigen todo el trabajo en el ecosistema
Aika. Se expanden aquí en el contexto específico de este repositorio (`crm-world`) y del framework
[Open Mercato](https://github.com/open-mercato/open-mercato) sobre el que está construido.

---

## 1. Cero workarounds — cita la URL exacta de los docs oficiales

### El principio

**Nunca** implementar una solución provisional ("lo arreglo después", "casteo a `any` por ahora",
"comento esto temporalmente"). Cada decisión técnica debe tener respaldo en documentación oficial.
Si no existe documentación que la respalde, la solución es incorrecta o prematura.

### Aplicación en crm-world

| Situación | Lo que se hace | URL de referencia |
|-----------|----------------|-------------------|
| Crear un módulo | Seguir la estructura `index.ts → acl.ts → setup.ts → entities.ts → api/ → backend/` | https://docs.open-mercato.dev/framework/modules/overview |
| Validar input | Siempre Zod. Nunca validación manual con `if` | https://docs.open-mercato.dev/framework/api/api-development-guide |
| CRUD API | Usar `makeCrudRoute` con `mapToEntity` y `applyToEntity` | https://docs.open-mercato.dev/framework/api/crud-factory |
| Auth en rutas | Exportar `metadata` con `requireAuth` / `requireFeatures` por método | https://docs.open-mercato.dev/framework/api/api-development-guide |
| RBAC | Declarar en `acl.ts`, otorgar en `setup.ts` `defaultRoleFeatures` | https://docs.open-mercato.dev/framework/rbac/overview |
| Cross-module queries | `(em as any).getKysely()` — nunca imports directos entre módulos | https://docs.open-mercato.dev/architecture/system-overview |
| Datos sensibles / PII | `encryption.ts` con `findWithDecryption` | https://docs.open-mercato.dev/user-guide/encryption |
| Cache | `container.resolve('cache')` — nunca `new Redis(...)` | https://docs.open-mercato.dev/user-guide/cache-management |
| Workers de fondo | `workers/*.ts` con `metadata: { queue, id, concurrency }` | https://docs.open-mercato.dev/framework/events/queue-workers |
| i18n | `useT()` cliente / `resolveTranslations()` servidor | Paquete `@open-mercato/shared/lib/i18n/` |
| UI — colores | Tokens semánticos: `text-status-error-text`, no `text-red-500` | AGENTS.md §Design System |
| Formularios | `<CrudForm>` de `@open-mercato/ui/backend/CrudForm` — nunca `<form>` raw | https://docs.open-mercato.dev/framework/admin-ui/crud-form |
| Tablas | `<DataTable>` de `@open-mercato/ui/backend/DataTable` | https://docs.open-mercato.dev/framework/admin-ui/data-grids |
| Tests unitarios | Jest con ts-jest — ver `jest.config.cjs` en este repo | https://kulshekhar.github.io/ts-jest/docs/ |
| Tests integración | Playwright ephemeral: `yarn test:integration:ephemeral` | AGENTS.md §"Key Commands" |

### Excepciones documentadas en PATTERNS.md (reglas de este repo)

Algunas excepciones al código ideal son necesarias por limitaciones conocidas de la plataforma y
están documentadas en `docs/PATTERNS.md`:

| Patrón | Por qué es necesario |
|--------|---------------------|
| `@Property({ type: 'text' })` siempre explícito | Turbopack no emite decorator metadata |
| `(em as any).getKysely()` | `EntityManager` no declara `getKysely()` públicamente |
| `em.create(Entity, {...} as any)` en seeds | MikroORM v7 strict types en operaciones de seed |
| `export function register(_: AppContainer) {}` en `di.ts` | Generador lo importa siempre |

**Estas son las únicas excepciones aceptadas.** Cualquier nuevo `any`, cast, o workaround que no
esté en `docs/PATTERNS.md` debe justificarse con una nueva entrada en ese archivo antes de
hacer merge.

---

## 2. Spec-Driven Development: SPEC → aprobación → implementar → verificar

### El ciclo obligatorio

```
1. SPEC     Escribir spec en .ai/specs/{YYYY-MM-DD}-{título}.md
2. APPROVAL Obtener aprobación explícita antes de escribir código
3. IMPLEMENT Implementar siguiendo exactamente el spec aprobado
4. VERIFY   Demostrar que la implementación cumple el spec (tests + preview)
```

Nunca se salta ningún paso. El código que aparece en un PR sin un spec previo aprobado será
rechazado.

### Formato del spec (`.ai/specs/`)

```markdown
# {Título del módulo o feature} — Spec

## Summary
Una oración que describe qué hace y por qué existe.

## Entities
Tablas, columnas, tipos, constraints, valores default.

## API Endpoints
Método | Path | Feature | Descripción

## RBAC Features
Lista de feature IDs con descripción y rol por defecto.

## Admin Pages
Rutas y descripción de cada página.

## Events
IDs de eventos emitidos (formato: módulo.entidad.acción).

## Integration Points
Con qué otros módulos interactúa y cómo.

## Changelog
- YYYY-MM-DD: Descripción del cambio
```

### Specs existentes en este repo

| Archivo | Describe |
|---------|----------|
| `.ai/specs/2026-05-18-properties-module.md` | Módulo de propiedades inmobiliarias (Real Estate vertical) |
| `.ai/specs/2026-05-18-venezuela-tenant-defaults.md` | Auto-configuración de tenant para Venezuela |

Todo spec nuevo sigue la convención de nombres `YYYY-MM-DD-{descripción-kebab-case}.md`.

### Relación con el código

- El spec define la fuente de verdad. Si el código difiere del spec, **el código está mal**.
- Si el spec necesita cambiar durante la implementación, se actualiza el spec primero y se
  vuelve a obtener aprobación.
- El changelog del spec registra cada iteración con fecha.

---

## 3. Nunca hacer merge sin aprobación explícita

### Proceso de PR en este repo

```
1. Crear rama neo/{descripción}-{sufijo-aleatorio} desde main
2. Hacer commits atómicos con mensajes que expliquen el POR QUÉ (no el qué)
3. Abrir PR con título descriptivo que refleje el cambio atómico
4. Esperar aprobación explícita del dueño del repo
5. Solo después del "approve" o mensaje explícito de aprobación, hacer merge
```

**Nunca** hacer merge directamente a `main` sin PR. Coolify auto-despliega desde `main` —
un merge sin revisión va directo a producción.

### Ramas de trabajo

| Prefijo | Propósito |
|---------|-----------|
| `neo/` | Ramas creadas por agentes de IA (Neo, Claude Code, etc.) |
| `feat/` | Nuevas features por desarrolladores humanos |
| `fix/` | Correcciones de bugs |
| `chore/` | Dependencias, configuración, sin cambios funcionales |

### Commits

- Un commit = un cambio lógico (no "WIP", no "varios fixes")
- Mensaje: imperativo en inglés o español, explica el **porqué**
- Todo commit incluye `Co-Authored-By:` si fue asistido por IA

---

## 4. Versiones exactas pineadas — sin rangos

### La regla

Todas las dependencias en `package.json` deben usar versiones exactas (`"4.3.6"`, no `"^4.3.6"` ni
`"~4.3.6"`). Esto garantiza builds deterministas entre la máquina del desarrollador, CI, y
Coolify.

### Estado actual (verificar antes de agregar dependencias)

Los paquetes `@open-mercato/*` están pineados exactamente en `0.6.1`:

```json
"@open-mercato/core": "0.6.1",
"@open-mercato/shared": "0.6.1",
"@open-mercato/ui": "0.6.1"
```

Y el paquete crítico `zod` está pineado con resolución:

```json
"resolutions": {
  "zod": "4.3.6"
}
```

### Cómo agregar una dependencia nueva

```bash
# 1. Identificar la versión exacta necesaria
npm info <paquete> version   # versión latest
npm info <paquete> versions  # todas las versiones

# 2. Agregar a package.json con versión exacta (sin ^ ni ~)
# "mi-paquete": "1.2.3"     ← correcto
# "mi-paquete": "^1.2.3"    ← incorrecto
# "mi-paquete": "~1.2.3"    ← incorrecto

# 3. Correr install y commitear yarn.lock actualizado
yarn install
git add package.json yarn.lock
```

### Actualización de Open Mercato

```bash
# SIEMPRE verificar el changelog antes de actualizar
yarn up '@open-mercato/*'     # Actualiza a la versión más reciente
yarn generate                 # Regenera registros
yarn db:migrate               # Aplica migraciones nuevas si las hay
yarn typecheck && yarn build  # Verificar que no hay breaking changes
```

Referencia: https://kulshekhar.github.io/ts-jest/docs/getting-started/installation (para ts-jest)

### `yarn.lock` es obligatorio

El `yarn.lock` debe estar siempre completo y commiteado. Un lockfile vacío o parcial causa builds
no-deterministas en Coolify. Ver incidente documentado en `docs/PATTERNS.md` §11.

---

## 5. Un PR = un cambio atómico — sin mezclar concerns

### La regla

Cada Pull Request resuelve exactamente un problema o agrega exactamente una feature. No se mezclan
en el mismo PR:

- Una feature nueva + un bugfix
- Cambios de dos módulos no relacionados
- Refactor de código + nueva funcionalidad
- Actualizaciones de dependencias + cambios de lógica

### Por qué importa en este repo

Coolify auto-despliega desde `main`. Un PR que mezcla concerns:
1. Es más difícil de revisar y aprobar
2. Si hay un problema, no se puede hacer rollback del cambio problemático sin revertir todo
3. Contamina el historial de git (difícil hacer `git bisect`)

### Ejemplos de buen scope para un PR

| Bien | Mal |
|------|-----|
| "feat: add ve_fiscal validators" | "various improvements" |
| "fix: RIF validation regex off-by-one" | "fix RIF + update matching + refactor scoring" |
| "chore: upgrade @open-mercato to 0.7.0" | "upgrade + new property fields" |
| "test: unit tests for properties validators" | "tests + new CSV import feature" |
| "feat: properties CRUD UI (list + create + detail)" | "complete real estate vertical" |

### Tamaño orientativo

- Un módulo completo (entities + API + backend pages) = 1 PR
- Corrección de un bug = 1 PR (no importa lo pequeño que sea)
- Suite de tests para módulos existentes = 1 PR
- Actualización de dependencias = 1 PR separado de features

---

## 6. Si no hay patrón documentado en los docs oficiales, parar y reportar

### La regla

Si una tarea requiere un patrón que no está documentado en:
1. https://docs.open-mercato.dev (docs del framework)
2. `docs/open-mercato-reference/` (referencia local de AGENTS.md del monorepo)
3. `docs/PATTERNS.md` (patrones específicos de este repo)

**Parar inmediatamente** y reportar al dueño del repo antes de continuar. No inventar soluciones
ad-hoc.

### Por qué es crítico en Open Mercato

El framework tiene primitivas obligatorias para cada concern. Usar un patrón no documentado casi
siempre significa:
- Rompiendo el sistema de auto-discovery del generador
- Creando un bypass del sistema de auth/RBAC
- Violando el aislamiento multi-tenant
- Generando deuda técnica que bloquea futuras actualizaciones del framework

### Casos que requieren reporte

| Situación | Por qué parar |
|-----------|---------------|
| Necesito comunicación directa entre dos módulos (más allá de eventos) | Violación de arquitectura |
| Necesito un tipo de autenticación no cubierto por `requireAuth`/`requireFeatures` | Riesgo de seguridad |
| Necesito modificar un archivo en `src/app/` (no en `src/modules/`) | El framework gestiona esos archivos |
| Necesito un patrón de DB que no sea MikroORM entities | Rompe el sistema de migraciones |
| Necesito lógica en `src/bootstrap.ts` que no sea DI overrides | Efectos secundarios en boot |
| Necesito agregar una dependencia que ya provee `@open-mercato/*` | Duplicación y posibles conflictos |

### Proceso de reporte

```
1. Describir la tarea que requiere el patrón no documentado
2. Listar las opciones existentes evaluadas (y por qué no aplican)
3. Proponer una solución y pedir validación ANTES de implementar
4. Esperar respuesta explícita antes de continuar
```

---

## Aplicación de los lineamientos a los tests

Los tests en este repo siguen los mismos lineamientos:

### Tests unitarios (`src/modules/<id>/__tests__/*.spec.ts`)

- Corren con `yarn test` → Jest + ts-jest
- Solo lógica pura: validadores Zod, funciones de servicio, algoritmos (sin DB, sin HTTP)
- Cada `describe` tiene una responsabilidad única (igual que "un PR = un cambio")
- Los nombres de test describen el comportamiento, no el código:
  - ✅ `'returns 30 pts when property_type exactly matches preference'`
  - ❌ `'test calculateScore'`

### Tests de integración (`src/modules/<id>/__integration__/*.spec.ts`)

- Corren con `yarn test:integration:ephemeral` → Playwright + app efímera
- Descubiertos automáticamente por `discoverIntegrationSpecFiles` en `playwright.config.ts`
- Documentación: https://playwright.dev/docs/intro

### Cobertura mínima

Todo código en `src/modules/<id>/services/*.ts` y `src/modules/<id>/data/validators.ts` debe
tener tests unitarios antes de hacer merge. Sin tests = PR rechazado.

---

## Referencia rápida — checklist antes de abrir un PR

```
[ ] Existe spec aprobado en .ai/specs/ para el cambio
[ ] Todos los @Property() tienen type: explícito
[ ] di.ts exporta function register(_: AppContainer) {}
[ ] makeCrudRoute usa mapToEntity y applyToEntity
[ ] createModuleEvents usa moduleId: (no module:)
[ ] Todas las rutas API exportan metadata con requireAuth por método
[ ] Nuevas features en acl.ts están en setup.ts defaultRoleFeatures
[ ] Se ejecutó yarn mercato auth sync-role-acls después de agregar features
[ ] Se ejecutó yarn generate después de cambios estructurales
[ ] yarn typecheck pasa sin errores
[ ] yarn build pasa sin errores (o yarn lint como mínimo)
[ ] Tests unitarios escritos para la lógica nueva
[ ] yarn.lock actualizado y commiteado si se agregaron dependencias
[ ] PR contiene exactamente un cambio atómico
[ ] Versiones de dependencias nuevas son exactas (sin ^ ni ~)
```

---

## Documentos relacionados

| Archivo | Propósito |
|---------|-----------|
| `AGENTS.md` | Guía de arquitectura y convenciones para agentes de IA (Open Mercato standalone) |
| `docs/PATTERNS.md` | Registro de errores cometidos y sus soluciones (chainlock) |
| `docs/CONTEXT.md` | Contexto completo del proyecto Aika para continuación de sesiones |
| `docs/FOUNDATION.md` | Documento fundacional: identidad, Venezuela, decisiones técnicas |
| `docs/DEVELOPMENT.md` | Guía de desarrollo: cómo crear módulos paso a paso |
| `.ai/specs/` | Specs aprobados (fuente de verdad para implementaciones) |
| `docs/open-mercato-reference/` | Referencia local de los AGENTS.md del monorepo Open Mercato |

---

*Última actualización: 2026-05-26 — Expansión de lineamientos organizacionales para crm-world.*
