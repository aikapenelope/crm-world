# Compliance Checklist — Open Mercato crm-world

> **LEER ANTES DE INICIAR CADA VERTICAL.**
> Audit generado: 2026-05-26. Actualizar el checkbox cuando se mergee el PR de cada vertical.
>
> Fuentes de verdad (OM repo):
> - `packages/core/AGENTS.md:533` → TODO 2 (`deleted_at`)
> - `packages/shared/AGENTS.md:63` + `packages/ui/src/backend/AGENTS.md:4` → TODO 3 (i18n)
> - `packages/create-app/template/AGENTS.md:562` → TODO 4 (icons `page.meta.ts`)
> - `.ai/ds-rules.md:6` + `packages/create-app/template/AGENTS.md:542` → TODO 5 (colores)

---

## Reglas por TODO (extracto de OM AGENTS.md)

### TODO 2 — `deleted_at` en entidades

**Regla** (`packages/core/AGENTS.md:533`):
```
Include `deleted_at timestamptz null` for soft delete
```

**Flujo por módulo:**
1. Agregar a `data/entities.ts`:
   ```typescript
   @Property({ type: 'timestamptz', nullable: true })
   deleted_at?: Date | null
   ```
2. Actualizar route → `softDeleteField: 'deleted_at'`
3. `yarn db:generate` en el container de producción → revisar migration
4. Copiar `Migration*.ts` + `.snapshot-open-mercato.json` al repo
5. Commitear migration + snapshot en el **mismo** commit

**Nota:** `softDeleteField: undefined` (bug ISP) → cambiar a `null` (Tipo B) o `'deleted_at'` (Tipo A) explícitamente.

---

### TODO 3 — i18n strings

**Regla** (`packages/shared/AGENTS.md:63`):
```typescript
// Client-side — MUST usar en todos los page.tsx
import { useT } from '@open-mercato/shared/lib/i18n/context'
const t = useT()

// Uso
<h1>{t('module.page.title', 'Fallback en español')}</h1>
```

**Regla** (`packages/ui/src/backend/AGENTS.md` MUST #4):
```
MUST NOT hard-code user-facing strings — use useT() for all labels and messages
```

**Flujo por módulo:**
1. Agregar `import { useT } from '@open-mercato/shared/lib/i18n/context'` al `page.tsx`
2. Añadir `const t = useT()` dentro del componente (client component) o usar `resolveTranslations()` (server)
3. Agregar keys a `src/i18n/en.json` y `src/i18n/es.json` (mínimo)
4. Reemplazar strings hardcodeadas: `"Título"` → `t('module.page.title', 'Título')`

**Keys i18n existentes:** `src/i18n/en.json` tiene 927 keys. Añadir bajo el namespace del módulo: `module_id.page.key`.

---

### TODO 4 — Iconos en `page.meta.ts`

**Regla** (`packages/create-app/template/AGENTS.md:562`):
```typescript
// ✅ CORRECTO — React.createElement SVG tree
import React from 'react'
const myIcon = React.createElement('svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('path', { d: 'M...' })
)

// ❌ INCORRECTO — import directo de lucide-react en meta
import { Building2 } from 'lucide-react'

// ❌ INCORRECTO — string literal
icon: 'building-2'
```

Obtener el path SVG en `lucide.dev/icons/<name>`.

---

### TODO 5 — Colores Tailwind hardcodeados

**Regla** (`.ai/ds-rules.md:6`):
```
NEVER: text-red-*, bg-green-*, text-amber-*, text-emerald-*, bg-blue-*
USE:   text-status-error-text, bg-status-success-bg,
       border-status-warning-border, text-status-info-icon,
       text-destructive, bg-destructive
```

**Mapa de migración:**
| Hardcoded | Token semántico |
|-----------|----------------|
| `text-red-*` | `text-status-error-text` |
| `bg-red-*` | `bg-status-error-bg` |
| `text-green-*` / `text-emerald-*` | `text-status-success-text` |
| `bg-green-*` | `bg-status-success-bg` |
| `text-amber-*` | `text-status-warning-text` |
| `bg-amber-*` | `bg-status-warning-bg` |
| `text-blue-*` | `text-status-info-text` |
| `bg-blue-*` | `bg-status-info-bg` |

---

## Estado por vertical

> Leyenda: ✅ completo · 🔴 pendiente · — no aplica

### 🏠 Real Estate
**Módulos:** `properties`, `matching`, `market_intelligence`, `mercadolibre_sync`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | Ninguna entidad Tipo A | — |
| T2 `sdf:undef` | Ningún route con `undefined` | — |
| T3 i18n | `properties` 3 páginas, `market_intelligence` 1, `matching` 1, `mercadolibre_sync` 1 | 🔴 |
| T4 icons | `properties/properties`, `properties/settings`, `market_intelligence`, `matching`, `mercadolibre_sync` | 🔴 |
| T5 colors | Ninguno | — |

**PR objetivo:** 1 PR `feat(real-estate): compliance TODO 3+4`

---

### 🚗 Auto
**Módulos:** `auto_estimates`, `auto_inspections`, `auto_parts`, `auto_service_orders`, `auto_vehicles`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | Ninguna entidad Tipo A | — |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `auto_inspections` 2, `auto_parts` 2, `auto_reports` 1, `auto_service_orders` 5, `auto_vehicles` 3 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | Ninguno | — |

**PR objetivo:** 1 PR `feat(auto): compliance TODO 3`

---

### 🇻🇪 VE Fiscal
**Módulos:** `ve_fiscal`, `ve_tax_books`, `ve_withholdings`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | `ve_fiscal` → `ve_fiscal_configs` (Tipo A, config editable) | 🔴 |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `ve_tax_books` 2, `ve_tax_reports` 1, `ve_withholdings` 2 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | Ninguno | — |

**PR objetivo:** 1 PR `feat(ve-fiscal): compliance TODO 2+3`

---

### 🔧 Core/Other
**Módulos:** `attendance`, `vertical_presets`, `transactions`, `payment_methods`, `bank_reconciliation`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | `attendance` → `attendance_records`; `vertical_presets` → `tenant_verticals` | 🔴 |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `attendance` 3, `transactions` 2, `payment_methods` 1, `bank_reconciliation` 2 | 🔴 |
| T4 icons | `transactions/transactions` → icon: `'handshake'` | 🔴 |
| T5 colors | Ninguno | — |

**PR objetivo:** 1 PR `feat(core-other): compliance TODO 2+3+4`

---

### 📚 Academy
**Módulos:** `academy_attendance`, `academy_certificates`, `academy_courses`, `academy_enrollments`, `academy_groups`, `academy_instructors`, `academy_payments`, `academy_sessions`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | Ninguna entidad Tipo A | — |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `academy_certificates` 1, `academy_courses` 3, `academy_enrollments` 2, `academy_groups` 2, `academy_instructors` 1, `academy_payments` 2, `academy_sessions` 1 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | `academy_groups/[id]/page.tsx` → `amber` | 🔴 |

**PR objetivo:** 1 PR `feat(academy): compliance TODO 3+5`

---

### 📦 Distribution
**Módulos:** `dist_commissions`, `dist_credit`, `dist_delivery`, `dist_inventory`, `dist_price_lists`, `dist_routes`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | Ninguna entidad Tipo A | — |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `dist_commissions` 1, `dist_credit` 5, `dist_delivery` 2, `dist_inventory` 3, `dist_price_lists` 2, `dist_reports` 1, `dist_routes` 3 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | Ninguno | — |

**PR objetivo:** 1 PR `feat(distribution): compliance TODO 3`

---

### 🎓 Education
**Módulos:** `enrollment`, `grades`, `school_calendar`, `school_comms`, `school_docs`, `students`, `tuition`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | `grades` → `student_grades`, `report_cards` | 🔴 |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `enrollment` 2, `grades` 4, `school_calendar` 1, `school_comms` 1, `school_docs` 1, `school_migration` 1, `students` 3, `tuition` 9 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | Ninguno | — |

**PR objetivo:** 1 PR `feat(education): compliance TODO 2+3`

---

### 🏭 Manufacturing
**Módulos:** `mfg_bom`, `mfg_costs`, `mfg_dispatch`, `mfg_energy`, `mfg_floor`, `mfg_hr`, `mfg_inventory`, `mfg_maintenance`, `mfg_mrp`, `mfg_orders`, `mfg_planning`, `mfg_procurement`, `mfg_quality`, `mfg_subcontract`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | `mfg_hr` → `mfg_shifts` | 🔴 |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `mfg_bom` 2, `mfg_costs` 1, `mfg_dispatch` 2, `mfg_energy` 1, `mfg_floor` 1, `mfg_hr` 1, `mfg_inventory` 1, `mfg_maintenance` 2, `mfg_mrp` 1, `mfg_orders` 2, `mfg_planning` 1, `mfg_procurement` 2, `mfg_quality` 3, `mfg_reports` 1, `mfg_subcontract` 1 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | `mfg_quality/spc/page.tsx` → `blue`, `red` | 🔴 |

**PR objetivo:** 1 PR `feat(manufacturing): compliance TODO 2+3+5`

---

### 🔨 Construction
**Módulos:** `const_budget`, `const_daily`, `const_materials`, `const_progress`, `const_projects`, `const_rfis`, `const_schedule`, `const_subcon`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | `const_materials` → `const_material_stock` | 🔴 |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `const_budget` 2, `const_daily` 3, `const_materials` 3, `const_progress` 2, `const_projects` 3, `const_rfis` 3, `const_schedule` 2, `const_subcon` 2 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | `const_subcon/page.tsx` → `amber` | 🔴 |

**PR objetivo:** 1 PR `feat(construction): compliance TODO 2+3+5`

---

### 🌾 Agri
**Módulos:** `agri_cold_chain`, `agri_feed`, `agri_field`, `agri_hr`, `agri_inputs`, `agri_processing`, `agri_quality`, `agri_sales`, `agri_traceability`, `agri_units`, `agri_vet`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | `agri_feed` → `agri_feed_allocations` | 🔴 |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `agri_cold_chain` 2, `agri_feed` 3, `agri_field` 1, `agri_hr` 4, `agri_inputs` 1, `agri_processing` 2, `agri_quality` 6, `agri_sales` 3, `agri_traceability` 2, `agri_units` 4, `agri_vet` 5 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | Ninguno | — |

**Borderlines a revisar manualmente:**
- `agri_cold_chain/agri_temperature_logs` — route sin `softDeleteField: null` explícito; confirmar Tipo B
- `agri_units/agri_flock_weekly_records` — borderline; confirmar Tipo B

**PR objetivo:** 1 PR `feat(agri): compliance TODO 2+3`

---

### 🏢 Condo
**Módulos:** `condo_accounting`, `condo_collections`, `condo_comms`, `condo_fees`, `condo_maintenance`, `condo_properties`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | `condo_collections` → `condo_debtors` | 🔴 |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `condo_accounting` 7, `condo_collections` 3, `condo_comms` 7, `condo_fees` 5, `condo_maintenance` 5, `condo_properties` 6 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | Ninguno | — |

**Borderlines a revisar manualmente:**
- `condo_comms/condo_vote_casts` — votos son inmutables; confirmar Tipo B y route tenga `null`

**PR objetivo:** 1 PR `feat(condo): compliance TODO 2+3`

---

### 🛒 Retail
**Módulos:** `retail_branches`, `retail_ecommerce`, `retail_inventory`, `retail_loyalty`, `retail_pricing`, `retail_purchasing`, `retail_returns`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | `retail_loyalty` → `retail_loyalty_programs`, `retail_loyalty_tiers`, `retail_loyalty_accounts`; `retail_pricing` → `retail_channel_prices`, `retail_price_alerts`; `retail_purchasing` → `retail_accounts_payable` | 🔴 |
| T2 `sdf:undef` | Ninguno | — |
| T3 i18n | `retail_branches` 5, `retail_ecommerce` 4, `retail_inventory` 6, `retail_loyalty` 4, `retail_pricing` 3, `retail_purchasing` 5, `retail_returns` 5 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | Ninguno | — |

**PR objetivo:** 1 PR `feat(retail): compliance TODO 2+3`

---

### 📡 ISP
**Módulos:** `isp_billing`, `isp_network`, `isp_plans`, `isp_sales`, `isp_subscribers`, `isp_support`, `isp_technicians`

| TODO | Detalle | Estado |
|------|---------|:------:|
| T2 `deleted_at` | `isp_billing` → `isp_billing_cycles`; `isp_network` → `isp_network_segments`, `isp_cpe_deployments`; `isp_plans` → `isp_plan_addons`; `isp_sales` → `isp_coverage_zones`; `isp_subscribers` → `isp_subscriber_contracts`; `isp_support` → `isp_support_tickets`, `isp_ticket_comments`; `isp_technicians` → `isp_work_orders` | 🔴 |
| T2 `sdf:undef` | `isp_billing/api/payments/route.ts`, `isp_network/api/segments/route.ts`, `isp_plans/api/addons/route.ts`, `isp_sales/api/commissions/route.ts`, `isp_sales/api/coverage-zones/route.ts`, `isp_subscribers/api/contracts/route.ts`, `isp_support/api/outages/route.ts`, `isp_support/api/tickets/comments/route.ts`, `isp_support/api/tickets/route.ts`, `isp_technicians/api/work-orders/route.ts` | 🔴 |
| T3 i18n | `isp_billing` 3, `isp_network` 6, `isp_plans` 3, `isp_sales` 4, `isp_subscribers` 3, `isp_support` 4, `isp_technicians` 6 | 🔴 |
| T4 icons | Ninguno | — |
| T5 colors | Ninguno | — |

**ISP sdf:undef — decisión por route:**
| Route | Tipo | Acción |
|-------|------|--------|
| `isp_billing/payments` | Tipo B (log pagos) | `softDeleteField: null` |
| `isp_network/segments` | Tipo A (editable) | `softDeleteField: 'deleted_at'` + agregar columna |
| `isp_plans/addons` | Tipo A (editable) | `softDeleteField: 'deleted_at'` + agregar columna |
| `isp_sales/commissions` | Tipo B (log) | `softDeleteField: null` |
| `isp_sales/coverage-zones` | Tipo A (editable) | `softDeleteField: 'deleted_at'` + agregar columna |
| `isp_subscribers/contracts` | Tipo A (editable) | `softDeleteField: 'deleted_at'` + agregar columna |
| `isp_support/outages` | Tipo B (log) | `softDeleteField: null` |
| `isp_support/tickets/comments` | Tipo A (editable) | `softDeleteField: 'deleted_at'` + agregar columna |
| `isp_support/tickets` | Tipo A (editable) | `softDeleteField: 'deleted_at'` + agregar columna |
| `isp_technicians/work-orders` | Tipo A (editable) | `softDeleteField: 'deleted_at'` + agregar columna |

**PR objetivo:** 1 PR `feat(isp): compliance TODO 2+3` (más complejo — migrations para 9 entidades)

---

## Resumen de estado global

| Vertical | T2 `deleted_at` | T2 `sdf:undef` | T3 i18n | T4 icons | T5 colors | PR estado |
|----------|:-:|:-:|:-:|:-:|:-:|:---------:|
| 🏠 Real Estate | — | — | 6 pág | 5 meta | — | 🔴 pendiente |
| 🚗 Auto | — | — | 12 pág | — | — | 🔴 pendiente |
| 🇻🇪 VE Fiscal | 1 ent | — | 4 pág | — | — | 🔴 pendiente |
| 🔧 Core/Other | 2 ent | — | 8 pág | 1 meta | — | 🔴 pendiente |
| 📚 Academy | — | — | 12 pág | — | 1 arch | 🔴 pendiente |
| 📦 Distribution | — | — | 16 pág | — | — | 🔴 pendiente |
| 🎓 Education | 2 ent | — | 22 pág | — | — | 🔴 pendiente |
| 🏭 Manufacturing | 1 ent | — | 21 pág | — | 1 arch | 🔴 pendiente |
| 🔨 Construction | 1 ent | — | 20 pág | — | 1 arch | 🔴 pendiente |
| 🌾 Agri | 1 ent | — | 33 pág | — | — | 🔴 pendiente |
| 🏢 Condo | 1 ent | — | 33 pág | — | — | 🔴 pendiente |
| 🛒 Retail | 6 ent | — | 32 pág | — | — | 🔴 pendiente |
| 📡 ISP | 9 ent | 10 routes | 29 pág | — | — | 🔴 pendiente |

**Totales: 24 entidades · 10 routes · 247 páginas · 6 meta files · 3 archivos**

---

## Checklist pre-PR por vertical

Antes de abrir cada PR verificar:
- [ ] `yarn generate` pasa sin errores
- [ ] `yarn typecheck` pasa sin errores (`NODE_OPTIONS=--max-old-space-size=6144 yarn typecheck`)
- [ ] `yarn lint` pasa sin errores
- [ ] Para T2: migration file + snapshot en el mismo commit
- [ ] Para T2: migration aplicada en producción antes del merge
- [ ] Post-merge: `yarn mercato auth sync-role-acls --all-tenants`
- [ ] Post-merge: `yarn mercato configs cache structural --all-tenants`
