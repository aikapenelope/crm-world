# CI — Aika Platform

> Implementado en Mayo 2026 basado en el patrón de open-mercato/open-mercato.
> **Fuentes**: `apps/mercato/jest.config.cjs`, `.github/workflows/ci.yml`, `apps/mercato/tsconfig.json`

---

## Arquitectura CI

Tres jobs paralelos en cada PR hacia `main` y cada push a `main`:

```
Lint ──────────────────────────────► ✅/❌
Typecheck (con yarn generate) ─────► ✅/❌
Unit Tests ────────────────────────► ✅/❌
```

---

## Job: Lint

**Comando**: `yarn lint` → `eslint src/modules`

**Scope**: `src/modules/**/*.ts` únicamente (lógica de negocio pura, sin componentes React).

### Por qué NO el app completo

El repo oficial (open-mercato/open-mercato) excluye el app de CI lint explícitamente:

```yaml
# .github/workflows/ci.yml del repo oficial
- name: Lint
  run: yarn turbo run lint --filter=!@open-mercato/app
  # ^ Comentario del repo: "its next lint script requires an ESLint config
  #   that is not yet present in the repo"
```

La razón técnica: `eslint-config-next/core-web-vitals` en ESLint v10 flat config provoca
`TypeError: scopeManager.addGlobals is not a function` al analizar componentes React con
globals declarados. El problema es una incompatibilidad entre `eslint-plugin-react` y el
nuevo API de `eslint-scope@9` usado por ESLint v10.

**Para linting completo del app**: usar IDE (VSCode/Cursor con ESLint extension).

### eslint.config.mjs

Usa `typescript-eslint` (ya instalado como dep transitiva de `eslint-config-next@16.2.6`).
Ver `docs/open-mercato-reference/LESSONS.md` si necesitas cambiar la config.

---

## Job: Typecheck

**Comando**: `yarn generate && yarn typecheck` → `tsc --noEmit`

### Por qué necesita yarn generate primero

`yarn generate` ejecuta `mercato generate`, que escribe `.mercato/generated/modules.generated.ts`
y archivos relacionados. El `tsconfig.json` incluye `.mercato/**/*.ts`. Sin los archivos
generados, `tsc` falla con `Cannot find module '#generated/...'`.

### Por qué necesita 6 GB de heap

El proyecto tiene 111+ módulos. `tsc` en modo `--noEmit` analiza todo el grafo de tipos
en memoria. El runner `ubuntu-latest` tiene ~7 GB de RAM total. Sin el flag, el proceso
muere con `node::OOMErrorHandler` (exit code 129).

```yaml
# Correcto: NODE_OPTIONS a nivel de JOB (hereda todos los steps)
typecheck:
  env:
    NODE_OPTIONS: --max-old-space-size=6144
```

### Qué incluye y excluye el typecheck

```json
// tsconfig.json
"include": ["**/*.ts", "**/*.tsx", ".mercato/**/*.ts"],
"exclude": [
  "node_modules",
  "**/__tests__/**",   // Tests compilados por ts-jest, no por tsc
  "**/*.spec.ts",
  "**/*.test.ts",
  "**/*.test.tsx"
]
```

**Patrón del OM**: `apps/mercato/tsconfig.json` hace exactamente lo mismo:
```json
"exclude": ["node_modules", "**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"]
```

---

## Job: Unit Tests

**Comando**: `yarn test --ci --forceExit`

### Ubicación de los tests

```
src/modules/<module>/__tests__/*.spec.ts
```

**Patrón del OM**: `apps/mercato/jest.config.cjs`:
```js
testMatch: ['<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)']
```

Nuestro proyecto usa `.spec.ts` (ya existente antes del CI setup). Ambos patrones son válidos.

### jest.config.cjs — puntos clave

**Fuente**: `apps/mercato/jest.config.cjs` del repo oficial.

```js
// Transformer: copia verbatim del repo oficial
// Maneja import.meta.* de @mikro-orm (ESM-only)
transform: {
  '^.+\\.(t|j)sx?$': ['<rootDir>/scripts/jest-mikroorm-transformer.cjs', ...]
}

// Necesario para transformar @mikro-orm (ESM + import.meta)
// Patrón del repo: apps/mercato/jest.config.cjs
transformIgnorePatterns: [
  '/node_modules/(?!(@mikro-orm|@open-mercato)/)',
]

// Setup: env vars antes de cualquier import (patrón OM)
setupFiles: ['<rootDir>/jest.setup.ts', 'reflect-metadata']
```

### jest.setup.ts

```typescript
// Copia de open-mercato/open-mercato jest.setup.ts
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://...'
```

### scripts/jest-mikroorm-transformer.cjs

Copia **verbatim** de `scripts/jest-mikroorm-transformer.cjs` del repo oficial. Transforma
`import.meta.*` a equivalentes CJS para que `@mikro-orm` (ESM-only) funcione en el runner
Jest (CJS). **No modificar sin revisar el repo oficial primero.**

---

## Cómo pasar el CI: checklist por job

### Para Lint

```bash
# Verificar localmente (requiere node_modules instalados)
yarn lint
# Solo src/modules/**/*.ts - reglas typescript-eslint
```

Causas comunes de fallo:
- `prefer-const`: `let` que nunca se reasigna → usar `const`
- Syntax errors en `.ts` → normalmente corrupción por regex

### Para Typecheck

```bash
yarn generate && yarn typecheck
```

Los errores más comunes y sus causas (todos eran código generado con APIs incorrectas):

| Error TS | Causa | Fix |
|---|---|---|
| `'name' not in CrudBuiltinField` | Campo usa `name:` en vez de `id:` | Cambiar a `id:` |
| `'label' not in CrudFormGroup` | Grupo usa `label:` en vez de `title:` | Cambiar a `title:` |
| `'title' not in RowActionItem` | Action item usa `title:` | Cambiar a `label:` |
| `'entityId'/'apiPath'/'mode' not in CrudFormProps` | API antigua de CrudForm | Usar props nuevas v0.6.1 |
| `'extensionTableId' not in DataTableProps` | Prop eliminada | Remover el prop |
| `useGuardedMutation()` sin args | Falta `contextId` | `useGuardedMutation({ contextId: 'mod.page' })` |
| `operation: string` | API antigua | `operation: async () => {...}` |
| `flash({ type, message })` | API antigua | `flash('msg', 'type')` |
| `z.record(V)` 1 arg | Zod v4 requiere 2 | `z.record(z.string(), V)` |
| `EventCategory: 'alert'` | Valor no válido | Cambiar a `'custom'` |
| `acl.ts .default` | Falta export default | Añadir `export default features` |
| `hidden: true` | Propiedad removida | Cambiar a `navHidden: true` |
| OOM exit 129 | Heap insuficiente | `NODE_OPTIONS=--max-old-space-size=6144` a nivel de job |

### Para Unit Tests

```bash
yarn test --ci --forceExit
```

Los tests son **puros** (no DB, no HTTP):
- `src/modules/<module>/__tests__/validators.spec.ts` — tests de Zod schemas
- `src/modules/<module>/__tests__/scoring.spec.ts`, etc.

Causas comunes de fallo:
- `SyntaxError: Unexpected token 'export'` → `@mikro-orm` no en `transformIgnorePatterns`
- `TS5103: ignoreDeprecations` → solo válido en TypeScript 6.x; el proyecto usa 5.x
- `Cannot read .errors.map` → Zod v4 renombró `.errors` a `.issues`

---

## Referencia: archivos de configuración CI

| Archivo | Propósito | Fuente del patrón |
|---|---|---|
| `.github/workflows/ci.yml` | CI workflow | `open-mercato/open-mercato .github/workflows/ci.yml` |
| `tsconfig.json` | TypeScript config | `apps/mercato/tsconfig.json` + `tsconfig.base.json` |
| `jest.config.cjs` | Jest config | `apps/mercato/jest.config.cjs` |
| `jest.setup.ts` | Jest env setup | `open-mercato/open-mercato jest.setup.ts` |
| `scripts/jest-mikroorm-transformer.cjs` | MikroORM ESM → CJS | `open-mercato/open-mercato scripts/jest-mikroorm-transformer.cjs` |
| `eslint.config.mjs` | ESLint flat config | `open-mercato/open-mercato eslint.config.mjs` (adaptado para standalone) |
