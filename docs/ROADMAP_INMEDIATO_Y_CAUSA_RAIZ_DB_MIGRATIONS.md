# Roadmap Inmediato y Causa Raíz No Resuelta: Database Migrations en Producción

> **Fecha de análisis**: Mayo 2026  
> **Redactor**: Neo (Pulumi Platform Agent)  
> **Estado**: Causa raíz confirmada, solución pendiente de aprobación y ejecución  
> **Referencia principal OM**: `open-mercato/packages/cli/src/lib/db/commands.ts`

---

## Tabla de Contenidos

1. [Diagnóstico: Estado actual de producción](#1-diagnóstico-estado-actual-de-producción)
2. [Causa raíz: Por qué las tablas no existen](#2-causa-raíz-por-qué-las-tablas-no-existen)
3. [Lo que se hizo hasta ahora y por qué es insuficiente](#3-lo-que-se-hizo-hasta-ahora-y-por-qué-es-insuficiente)
4. [Opciones de solución con análisis](#4-opciones-de-solución-con-análisis)
5. [Solución elegida: Greenfield + Commit de Migrations](#5-solución-elegida-greenfield--commit-de-migrations)
6. [Ejecución paso a paso](#6-ejecución-paso-a-paso)
7. [Verificación post-ejecución](#7-verificación-post-ejecución)
8. [Prevención futura: flujo permanente de migrations](#8-prevención-futura-flujo-permanente-de-migrations)
9. [Referencias directas al repositorio Open Mercato](#9-referencias-directas-al-repositorio-open-mercato)

---

## 1. Diagnóstico: Estado actual de producción

### 1.1 Tablas que EXISTEN en producción

De 234 tablas requeridas por entidades custom en crm-world, solo **10 existen** en el servidor PostgreSQL de `mercato.novaincs.com`:

```
✅ contact_preferences       (módulo: matching)
✅ match_results             (módulo: matching)
✅ market_listings           (módulo: mercadolibre_sync)
✅ market_valuations         (módulo: market_intelligence)
✅ payment_methods           (módulo: payment_methods)
✅ payment_records           (módulo: payment_methods)
✅ properties                (módulo: properties)
✅ property_images           (módulo: properties)
✅ property_links            (módulo: properties)
✅ property_transactions     (módulo: transactions)
```

### 1.2 Tablas que FALTAN (224 tablas, 62 módulos)

```
❌ academy_attendance, academy_certificates, academy_courses,
   academy_enrollments, academy_groups, academy_instructors,
   academy_payments, academy_sessions

❌ agri_cold_storage_units, agri_storage_lot_records, agri_temperature_logs,
   agri_feed_allocations, agri_feed_batches, agri_feed_formulas,
   agri_crop_activities, agri_crop_cycles, agri_field_plots,
   agri_employees, agri_jornalero_payrolls, agri_producer_settlements,
   agri_input_items, agri_input_movements, agri_processing_formulas,
   agri_processing_lots, agri_slaughter_batches, agri_bpm_checklists,
   agri_ccp_monitoring_records, agri_haccp_plans, agri_non_conformities,
   agri_sale_dispatches, agri_sale_invoices, agri_sale_orders,
   agri_recalls, agri_farm_units, agri_flock_weekly_records, agri_flocks,
   agri_vet_medication_records, agri_vet_mortality_records,
   agri_vet_vaccination_programs, agri_vet_vaccination_records

❌ attendance_records, attendance_summary

❌ auto_estimate_items, auto_estimates, auto_inspection_items,
   auto_inspection_photos, auto_inspections, auto_parts,
   auto_service_order_items, auto_service_orders,
   auto_vehicle_photos, auto_vehicles

❌ bank_statements, bank_transactions

❌ condo_accounting_entries, condo_budgets, condo_reserve_fund,
   condo_collection_actions, condo_debtors, condo_payment_agreements,
   condo_assemblies, condo_circulars, condo_vote_casts, condo_votes,
   condo_fee_configs, condo_receipt_lines, condo_receipts,
   condo_maintenance_requests, condo_suppliers, condo_work_orders,
   condo_buildings, condo_common_areas, condo_units

❌ const_budget_items, const_budget_resources,
   const_daily_activities, const_daily_labor, const_daily_reports,
   const_material_order_lines, const_material_orders, const_material_stock,
   const_valuation_lines, const_valuations, const_projects,
   const_rfis, const_submittals, const_milestones, const_tasks,
   const_subcontract_payments, const_subcontractors, const_subcontracts

❌ dist_commission_records, dist_commission_rules,
   dist_credit_limits, dist_credit_transactions,
   dist_delivery_items, dist_delivery_orders,
   dist_inventory_items, dist_inventory_movements,
   dist_customer_price_lists, dist_price_list_items, dist_price_lists,
   dist_route_stops, dist_route_visits, dist_routes

❌ enrollment_applications, enrollment_documents, enrollment_periods

❌ grade_periods, report_cards, student_grades, subjects

❌ isp_billing_cycles, isp_invoices, isp_payments,
   isp_cpe_deployments, isp_cpe_inventory,
   isp_network_nodes, isp_network_segments,
   isp_plan_addons, isp_service_plans,
   isp_commissions, isp_coverage_zones, isp_leads,
   isp_subscriber_contracts, isp_subscribers,
   isp_outages, isp_support_tickets, isp_ticket_comments,
   isp_field_technicians, isp_work_orders

❌ mfg_bom_alternatives, mfg_bom_headers, mfg_bom_lines, mfg_bom_versions,
   mfg_cost_centers, mfg_cost_variances, mfg_standard_costs,
   mfg_coa, mfg_dispatch_orders, mfg_sale_order_lines, mfg_sale_orders_mfg,
   mfg_energy_consumption, mfg_energy_costs, mfg_power_outages,
   mfg_oee_history, mfg_shift_reports,
   mfg_labor_tracking, mfg_production_bonuses, mfg_shifts, mfg_workers,
   mfg_cycle_counts, mfg_stock_lots, mfg_stock_movements, mfg_warehouse_locations,
   mfg_equipment, mfg_maintenance_plans, mfg_spare_parts, mfg_work_orders_maint,
   mfg_mrp_requirements, mfg_production_plans, mfg_purchase_requisitions,
   mfg_order_material_issues, mfg_order_operations, mfg_production_downtimes,
   mfg_production_orders, mfg_work_centers,
   mfg_capacity_loads, mfg_energy_windows, mfg_master_schedule,
   mfg_purchase_order_lines, mfg_purchase_orders, mfg_suppliers,
   mfg_nonconformances, mfg_quality_inspections, mfg_quality_plans, mfg_spc_charts,
   mfg_subcontract_materials, mfg_subcontract_orders

❌ retail_branch_staff, retail_branches, retail_transfer_lines, retail_transfers,
   retail_online_order_lines, retail_online_orders,
   retail_social_publishes, retail_storefronts,
   retail_stock_count_lines, retail_stock_counts, retail_stock_rotation,
   retail_campaigns, retail_loyalty_accounts, retail_loyalty_programs,
   retail_loyalty_tiers, retail_loyalty_transactions,
   retail_bulk_price_updates, retail_channel_prices,
   retail_price_alerts, retail_pricing_rules,
   retail_accounts_payable, retail_purchase_order_lines,
   retail_purchase_orders, retail_supplier_notes, retail_suppliers,
   retail_credit_notes, retail_return_lines,
   retail_return_policies, retail_returns

❌ school_events, school_announcements, announcement_reads,
   document_templates, generated_documents

❌ student_representatives, students

❌ tuition_charges, tuition_discounts, tuition_payments, tuition_plans

❌ ve_fiscal_configs, ve_fiscal_identities,
   ve_tax_book_entries,
   ve_withholding_records

❌ tenant_verticals
```

### 1.3 Síntoma en producción

Cuando cualquier página intenta cargar datos de estos módulos, la secuencia es:

```
1. GET /backend/academy_courses       → 200 OK  (SSR renderiza el shell React)
2. useEffect: apiCall('/api/academy-courses/courses?pageSize=50')
3. Server:  SELECT ... FROM academy_courses WHERE ...
4. PostgreSQL: ERROR: relation "academy_courses" does not exist
5. API:     HTTP 500 {"error": "Internal server error"}
6. Browser: DataTable muestra estado de error
```

El usuario ve la página cargar y luego "caerse" — el layout es visible pero los datos nunca cargan.

---

## 2. Causa raíz: Por qué las tablas no existen

### 2.1 Cómo funcionan las migrations en Open Mercato

**Referencia**: `open-mercato/packages/cli/src/lib/db/commands.ts:336`

```typescript
export async function dbMigrate(resolver: PackageResolver, options: DbOptions = {}): Promise<void> {
  // ...
  // Skip if no entities AND no migrations directory exists
  const migrationsPath = getMigrationsPath(entry, resolver)
  if (!entities.length && !fs.existsSync(migrationsPath)) continue
  // dbMigrate only runs existing migration files — entities are intentionally
  // NOT auto-discovered here to preserve explicit migration control
```

**Punto crítico**: `yarn db:migrate` **solo aplica archivos de migration que ya existen**
en `src/modules/<módulo>/migrations/`. No genera nada. No descubre entidades.

### 2.2 Dónde van los archivos de migration

**Referencia**: `open-mercato/packages/cli/src/lib/db/commands.ts:202-208`

```typescript
function getMigrationsPath(entry: ModuleEntry, resolver: PackageResolver): string {
  const roots = resolver.getModulePaths(entry)
  if (entry.from === '@app') {
    // @app modules: use src/ (user's TypeScript source)
    return path.join(roots.appBase, 'migrations').replace(/\\/g, '/')
  }
  // ...
}
```

Para crm-world (standalone `@app`), los archivos de migration se guardan en:
```
src/modules/<módulo>/migrations/Migration<timestamp>_<módulo>.ts
```

### 2.3 Por qué solo 10 de 234 tablas existen

En el deploy inicial de Coolify, `yarn initialize` ejecutó `db:migrate`. En ese momento:

- Los módulos `properties`, `matching`, `payment_methods`, `market_intelligence`,
  `transactions`, `mercadolibre_sync` ya tenían migration files commiteados
  (probablemente creados manualmente o con `db:generate` antes del deploy)
- Los **111 módulos custom restantes** nunca tuvieron migration files commiteados
- `db:migrate` los ignoró silenciosamente: "Skip if no entities AND no migrations directory"

**Los módulos con migrations commiteadas desde el inicio:**
```
src/modules/example/migrations/         ← 2 archivos  
src/modules/example_customers_sync/migrations/ ← archivos
```

Solo los módulos de ejemplo tienen migrations. El resto fue añadido después sin
el flujo correcto de `db:generate → commit → deploy`.

### 2.4 Divergencia CI vs Producción

El CI usa `db:greenfield --yes` que **genera + aplica** migrations on-the-fly. En CI
todas las tablas se crean y los tests pasan. En producción, esas tablas nunca existieron.

```
CI:          db:greenfield → genera migrations → aplica → 234 tablas ✅
Producción:  db:migrate   → no hay archivos  → skip   → 10 tablas ✅, 224 ❌
```

Esta divergencia hace que el CI sea una **falsa seguridad** para producción.

---

## 3. Lo que se hizo hasta ahora y por qué es insuficiente

### 3.1 PR #125 (Mergeado) — softDeleteField en `matching`
**Correcto.** `matching` usa `MatchResultEntity` con tabla `match_results` que SÍ existe.
El fix `softDeleteField: null` es correcto y está documentado en `factory.ts:149`.

### 3.2 PR #127 (Mergeado) — softDeleteField en 110 routes
**Correcto en concepto, insuficiente en práctica.**

El patrón `softDeleteField: null` está documentado en OM:
```typescript
// open-mercato/packages/shared/src/lib/crud/factory.ts:149
softDeleteField?: string | null
// default: 'deletedAt'; pass null to disable implicit soft delete filter
```

Antes de PR #127: error en metadata validation de MikroORM → 500
Después de PR #127: error en SQL execution de PostgreSQL → 500

Ambos son 500. El comportamiento para el usuario es idéntico. El PR **no empeoró
ni mejoró** los crashes; solo cambió el mensaje en el log:

```
Antes:  Trying to query by not existing property TuitionPaymentEntity.deletedAt
Después: TableNotFoundException: relation "tuition_payments" does not exist
```

El PR fue una solución al síntoma sin haber auditado si las tablas existían en producción.
**Lección**: antes de aplicar cualquier fix de CRUD, verificar con
`SELECT tablename FROM pg_tables WHERE schemaname='public'` que la tabla existe.

### 3.3 El "no available server" reportado

No fue causado por PR #127. Es el comportamiento de Traefik (`coolify-proxy`) durante
la transición de containers: cuando el container anterior termina y el nuevo aún no
responde al healthcheck (`path: / interval: 10s timeout: 3s`), Traefik muestra
"no available server" por ~30-60 segundos. Verificado:

```bash
# Traefik sí alcanza el app container:
docker exec coolify-proxy wget -qO- http://app:3000/ → 200 OK (HTML del login)
# Restart count del container:
docker inspect app-... --format='RestartCount: {{.RestartCount}}' → RestartCount: 0
```

---

## 4. Opciones de solución con análisis

### Opción A: `yarn db:generate && yarn db:migrate` (NO recomendada)
```bash
# Genera migrations desde entities → aplica solo las nuevas
yarn db:generate
yarn db:migrate
```

**Ventajas**: No destructiva, preserva datos existentes.

**Problema**: Con 111 módulos sin ningún `migrations/` folder ni snapshot, 
`db:generate` puede producir migrations con conflictos o dependencias circulares.
Las snapshots (`.snapshot-open-mercato.json`) también estarían desactualizadas,
causando que en el próximo `db:generate` se regeneren migrations ya aplicadas.

**Referencia OM**: `open-mercato/packages/cli/AGENTS.md`:
> "Coding-agent exception: if `yarn db:generate` emits unrelated migrations because
> another module's snapshot is stale, do not commit the noise. Delete unrelated
> generated files [...] The snapshot update is mandatory; without it, standalone apps
> will regenerate already-committed migrations."

### Opción B: `yarn db:greenfield --yes` solo en producción, sin commitear (NO recomendada)
Crea las tablas en producción pero no genera archivos commiteables. El próximo deploy
volvería a fallar. No resuelve la divergencia CI vs producción.

### Opción C ✅: `yarn db:greenfield --yes` + Commit de migrations generadas (ELEGIDA)

**Por qué es la más robusta:**

1. `db:greenfield` es la operación "oficial" de OM para este escenario exacto
2. Genera migrations limpias desde cero a partir de los entity schemas actuales
3. Las migrations generadas se commiten → futuro `db:migrate` en deploys funciona
4. Elimina la divergencia CI vs producción
5. Es segura porque **no hay usuarios en producción** (sin datos que perder)

**Referencia OM**: `open-mercato/packages/cli/src/lib/db/commands.ts:423-561`:
```typescript
export async function dbGreenfield(resolver, options) {
  // 1. Limpia migration files y snapshots existentes
  // 2. Elimina TODAS las tablas (DROP TABLE IF EXISTS ... CASCADE)
  // 3. Genera migrations frescas para todos los módulos  ← db:generate
  // 4. Aplica las migrations recién generadas             ← db:migrate
  console.log('Greenfield reset complete! Fresh migrations generated and applied.')
}
```

---

## 5. Solución elegida: Greenfield + Commit de Migrations

### 5.1 Resumen

```
FASE 1: Ejecutar db:greenfield en producción
        → Crea las 224 tablas faltantes
        → Genera los archivos Migration*.ts en src/modules/*/migrations/
        
FASE 2: Copiar los archivos generados al repositorio y commitearlos
        → El repo queda con todos los migration files
        → Future deployments: db:migrate (no db:greenfield)
        
FASE 3: Actualizar CI para usar db:migrate (no db:greenfield)
        → CI y producción siguen el mismo flujo
```

### 5.2 Por qué es segura

- No hay usuarios reales en producción (confirmado por el usuario)
- Las 10 tablas que SÍ tienen datos (properties, payment_methods, etc.) serán
  recreadas vacías. Si hay datos de prueba, se perderán — aceptable en esta fase.
- `db:greenfield` es idempotente: se puede correr múltiples veces con el mismo resultado.

### 5.3 Estado permanente después de la solución

```
ANTES:
  src/modules/*/migrations/ → vacío (111 módulos sin migrations)
  producción: 10 tablas de 234

DESPUÉS:
  src/modules/*/migrations/Migration<ts>_<mod>.ts → 111 archivos
  src/modules/*/migrations/.snapshot-*.json       → 111 snapshots
  producción: 234 tablas (todas)
  CI: usa db:migrate (mismo que producción)
```

---

## 6. Ejecución paso a paso

### PASO 1: Crear rama de trabajo

```bash
git checkout main && git pull
git checkout -b fix/db-greenfield-migrations-baseline
```

### PASO 2: Ejecutar db:greenfield en producción

```bash
# SSH al servidor (key recuperada de Coolify API)
CONTAINER=$(docker ps --format '{{.Names}}' | grep app-dnts)

# ADVERTENCIA: Este comando elimina TODOS los datos y recrea las tablas
# CONFIRMADO SEGURO: sin usuarios en producción
docker exec $CONTAINER yarn db:greenfield --yes 2>&1 | tee /tmp/greenfield.log
```

**Qué hace internamente** (referencia `commands.ts:429-561`):
1. Elimina todos los archivos `Migration*.ts` y `.snapshot-*.json` existentes
2. Ejecuta `DROP TABLE IF EXISTS "<tabla>" CASCADE` para todas las tablas públicas
3. Ejecuta `dbGenerate()` → crea `src/modules/*/migrations/Migration<ts>_<mod>.ts`
4. Ejecuta `dbMigrate()` → aplica las migrations recién generadas

### PASO 3: Verificar que las tablas se crearon

```bash
docker exec postgres-... psql -U postgres -d mercato-saas -c \
  "SELECT count(*) FROM pg_tables WHERE schemaname='public';"
# Esperado: ~335+ tablas (OM core + todas las custom)

# Verificar módulos específicos:
docker exec postgres-... psql -U postgres -d mercato-saas -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' 
   AND tablename LIKE 'academy%' ORDER BY tablename;"
# Esperado: academy_attendance, academy_certificates, academy_courses...
```

### PASO 4: Copiar las migrations generadas al repositorio

Las migrations se generaron DENTRO del container en `/app/src/modules/*/migrations/`.
Necesitamos copiarlas al workspace local:

```bash
# Copiar todo el directorio src/modules de vuelta (solo migrations)
for mod in $(docker exec $CONTAINER ls /app/src/modules/); do
  MPATH="/app/src/modules/$mod/migrations"
  if docker exec $CONTAINER test -d "$MPATH" 2>/dev/null; then
    mkdir -p src/modules/$mod/migrations/
    docker cp "$CONTAINER:$MPATH/." "src/modules/$mod/migrations/"
  fi
done
```

### PASO 5: Verificar los archivos generados

```bash
# Cuántos módulos tienen migrations ahora
find src/modules -name "Migration*.ts" | wc -l
# Esperado: 111+ archivos (uno por módulo con entidades)

# Verificar un módulo específico
cat src/modules/academy_courses/migrations/Migration*_academy_courses.ts | head -20
```

### PASO 6: Actualizar el CI para usar db:migrate (no db:greenfield)

Con migrations commiteadas, el CI puede usar el flujo estándar:

```yaml
# .github/workflows/ci.yml — smoke job
- name: Setup database (apply migrations)
  # Con migrations commiteadas, usamos db:migrate (flujo estándar de producción)
  # db:greenfield ya no es necesario; ambos entornos usan el mismo path
  run: yarn db:migrate
```

**Referencia OM** (`packages/cli/AGENTS.md`):
> "Default workflow: update ORM entities, run `yarn db:generate`, and review the
> generated SQL plus `migrations/.snapshot-open-mercato.json`"

### PASO 7: Reinicializar producción

```bash
# Re-ejecutar initialize para recrear superadmin + tenants + seed data
docker exec $CONTAINER yarn initialize
# ↑ Ahora funcionará porque todas las tablas existen

# Post-initialize obligatorio:
docker exec $CONTAINER yarn mercato auth sync-role-acls --all-tenants
docker exec $CONTAINER yarn mercato configs cache structural --all-tenants
```

### PASO 8: Commit y PR

```bash
git add src/modules/*/migrations/
git status | head -20  # verificar scope

git commit -m "feat(db): commits migration baseline para todos los módulos custom

Ejecutado yarn db:greenfield --yes en producción (sin usuarios activos).

ANTES: 10 de 234 tablas custom existían en producción.
       CI y producción divergían: CI usaba db:greenfield,
       producción dependía de migrations inexistentes.

DESPUÉS: 234 tablas custom en producción + migrations commiteadas.
         CI y producción usan el mismo path: db:migrate.

Los archivos Migration*.ts generados representan el schema completo de
los 111 módulos custom de crm-world al fecha de generación.

Flujo permanente post-este-commit:
  1. Modificar entities.ts en cualquier módulo
  2. yarn db:generate → revisa y commitea el archivo generado
  3. yarn db:migrate en producción (o via deploy automático de Coolify)

Referencias:
  open-mercato packages/cli/src/lib/db/commands.ts:423 (dbGreenfield)
  open-mercato packages/cli/src/lib/db/commands.ts:232 (dbGenerate)
  open-mercato packages/cli/src/lib/db/commands.ts:336 (dbMigrate)
  open-mercato packages/cli/AGENTS.md — Default migration workflow"
```

---

## 7. Verificación post-ejecución

### 7.1 Test de producción

```bash
# Verificar que el site sigue funcionando
curl -s -o /dev/null -w "%{http_code}" https://mercato.novaincs.com
# Esperado: 200

# Test de API contra tablas que antes fallaban:
TOKEN=$(docker exec $CONTAINER node -e "...")
wget -O- --header="Authorization: Bearer $TOKEN" \
  'http://localhost:3000/api/academy-courses/courses?pageSize=1'
# Esperado: {"items":[],"total":0,...}  (no 500)

wget -O- --header="Authorization: Bearer $TOKEN" \
  'http://localhost:3000/api/tuition/payments?pageSize=1'
# Esperado: {"items":[],"total":0,...}  (no 500)
```

### 7.2 Correr el TC-SMOKE-001 contra producción (solo lectura)

```bash
BASE_URL=https://mercato.novaincs.com yarn test:integration TC-SMOKE-001
# Esperado: 65/65 passed
```

### 7.3 TC-FRONTEND-001 verificación real

El TC-FRONTEND-001 actual acepta 307 (redirect a login) como OK, lo cual no verifica
si la DATA carga. Para una verificación real se necesitaría un test con auth real.
Ver sección §8.3 sobre mejora futura del test.

---

## 8. Prevención futura: flujo permanente de migrations

### 8.1 Flujo obligatorio para cambios de schema

Cuando se modifique o agregue una entidad (`data/entities.ts`):

```bash
# 1. Modificar entities.ts
# 2. Generar la migration
yarn db:generate

# 3. Revisar el archivo generado
#    Ubicación: src/modules/<módulo>/migrations/Migration<ts>_<módulo>.ts
#    También revisar: src/modules/<módulo>/migrations/.snapshot-<módulo>.json

# 4. Si db:generate emite migrations de otros módulos no modificados:
#    → Eliminar esos archivos no relacionados
#    → Solo commitear el migration del módulo que se modificó
#    (referencia: AGENTS.md OM — "Coding-agent exception")

# 5. Commitear migration + snapshot
git add src/modules/<módulo>/migrations/
git commit -m "db(<módulo>): agregar columna X a tabla Y"

# 6. En producción, Coolify ejecuta automáticamente yarn db:migrate
#    (o ejecutar manualmente: docker exec $CONTAINER yarn db:migrate)
```

### 8.2 Regla de oro documentada en OM

**Referencia**: `open-mercato/packages/cli/AGENTS.md`

> "Default migration workflow: update ORM entities in `data/entities.ts`,
> then run `yarn db:generate` to emit SQL and keep `.snapshot-open-mercato.json`
> in sync."
>
> "Do not run `yarn db:migrate` as part of generation unless the user explicitly
> asks to apply migrations. A PR should normally include the migration file plus
> snapshot, not depend on local DB state."

**Traducido al flujo de crm-world:**
- Cada PR que modifique `data/entities.ts` DEBE incluir el archivo de migration
- El CI debe incluir un check que verifique que no hay migrations pendientes sin commitear
- El deploy en Coolify ejecuta `yarn db:migrate` automáticamente

### 8.3 Mejora del TC-FRONTEND-001 (deuda técnica)

El test actual acepta HTTP 307 como OK, lo que significa que no verifica si
la data carga. Para ser útil debe:
1. Autenticarse via cookie (no Bearer token)  
2. Verificar que los endpoints API de datos devuelven 200 (no 500)
3. Verificar que al menos la estructura de respuesta es correcta

Esto está documentado como mejora futura en el ROADMAP (Phase 37 propuesta).

### 8.4 CI debe reflejar el estado de producción

Después de commitear las migrations, actualizar el smoke job:

```yaml
# Antes (CI tenía que usar greenfield porque no había migrations):
- name: Setup database with greenfield
  run: yarn db:greenfield --yes

# Después (con migrations commiteadas, usar el mismo flujo que producción):
- name: Apply migrations
  run: yarn db:migrate

- name: Initialize app data
  run: yarn initialize
```

---

## 9. Referencias directas al repositorio Open Mercato

### 9.1 Implementación de `dbGreenfield`

```
open-mercato/packages/cli/src/lib/db/commands.ts

Línea 423: export async function dbGreenfield(resolver, options)
Línea 429: "Cleaning up migrations and snapshots for greenfield setup..."
Línea 440-457: Elimina Migration*.ts existentes en src/modules/*/migrations/
Línea 451-457: Elimina .snapshot-*.json existentes
Línea 518: "Dropping ALL public tables for true greenfield..."
Línea 520-547: DROP TABLE IF EXISTS para todas las tablas en pg_tables
Línea 553-555: "Generating fresh migrations for all modules..." → dbGenerate()
Línea 557-559: "Applying migrations..." → dbMigrate()
Línea 561: "Greenfield reset complete! Fresh migrations generated and applied."
```

### 9.2 Implementación de `dbGenerate`

```
open-mercato/packages/cli/src/lib/db/commands.ts

Línea 232: export async function dbGenerate(resolver, options)
Línea 257: migrationsPath = getMigrationsPath(entry, resolver)
Línea 258: fs.mkdirSync(migrationsPath, { recursive: true })
Línea 294-317: genera Migration<timestamp>_<modId>.ts en migrationsPath
Línea 317: fs.writeFileSync(newPath, content, 'utf8')  ← escritura del archivo
```

### 9.3 Implementación de `dbMigrate`

```
open-mercato/packages/cli/src/lib/db/commands.ts

Línea 336: export async function dbMigrate(resolver, options)
Línea 346-350: Solo procesa módulos con migration files (skip si no existe el directorio)
Línea 356: "dbMigrate only runs existing migration files — entities are intentionally
            NOT auto-discovered here to preserve explicit migration control"
```

### 9.4 Dónde se guardan las migrations en standalone apps

```
open-mercato/packages/cli/src/lib/db/commands.ts

Línea 202: function getMigrationsPath(entry, resolver)
Línea 205-208: Para @app modules: path.join(roots.appBase, 'migrations')
               → En crm-world: src/modules/<módulo>/migrations/
```

### 9.5 Confirmación `--yes` para modo no-interactivo

```
open-mercato/packages/cli/src/mercato.ts

Línea 1658: command: 'greenfield'
Línea 1663: const yes = args.includes('--yes') || args.includes('-y')
Línea 424-426: if (!options.yes) { 
                 console.error('This command will DELETE all data. Use --yes to confirm.')
                 process.exit(1) 
               }
```

### 9.6 Documentación del flujo de migrations en OM

```
open-mercato/AGENTS.md

"Default migration workflow: update ORM entities, run `yarn db:generate`,
and review the generated SQL plus `migrations/.snapshot-open-mercato.json`"

"yarn db:generate          # Generate database migrations"
"yarn db:migrate           # Apply database migrations"
"yarn initialize           # Full project initialization"
"yarn dev:greenfield       # Fresh compact dev boot with build/generate/reinstall stages"
```

```
open-mercato/packages/cli/AGENTS.md

"Module-scoped migrations using MikroORM:"
"yarn db:generate   # Generate migrations for all modules
                    # (writes to src/modules/<module>/migrations/)"
"yarn db:migrate    # Apply all pending migrations (ordered, directory first)"

"Coding-agent exception: if yarn db:generate emits unrelated migrations because
another module's snapshot is stale, do not commit the noise. Delete unrelated 
generated files, keep or write only the SQL for the intended entity change,
and update the affected module's migrations/.snapshot-open-mercato.json to the
post-change schema. The snapshot update is mandatory; without it, standalone apps
will regenerate already-committed migrations."

"Do not run yarn db:migrate as part of generation unless the user explicitly asks
to apply migrations. A PR should normally include the migration file plus snapshot,
not depend on local DB state."
```

### 9.7 softDeleteField — documentación del patrón (correctness de PR #127)

```
open-mercato/packages/shared/src/lib/crud/factory.ts

Línea 149: softDeleteField?: string | null
           // default: 'deletedAt'; pass null to disable implicit soft delete filter

Línea 845: softDeleteField: opts.orm.softDeleteField === null
             ? null
             : opts.orm.softDeleteField ?? 'deletedAt'
```

```
open-mercato/packages/shared/src/lib/api/crud.ts

Línea 32: if (softField) where[softField] = null  ← agrega WHERE deletedAt IS NULL
```

**Conclusión sobre PR #127**: El patrón `softDeleteField: null` es correcto y está
documentado. El PR fue válido pero aplicado al problema incorrecto: el error real
era la ausencia de tablas, no el filtro de soft delete. Con las tablas creadas
por db:greenfield, PR #127 permite que las entidades append-only (sin `deleted_at`)
funcionen correctamente.

---

## Apéndice: Checklist de Ejecución

```
[ ] 1. Crear rama fix/db-greenfield-migrations-baseline
[ ] 2. Backup de datos de prueba si los hay (properties, payment_methods)
[ ] 3. yarn db:greenfield --yes en producción (container actual)
[ ] 4. Verificar: SELECT count(*) FROM pg_tables → 335+ tablas
[ ] 5. Verificar: API /api/academy-courses/courses → 200 (no 500)
[ ] 6. Copiar migrations generadas al repo local
[ ] 7. Verificar: find src/modules -name "Migration*.ts" | wc -l → 111+
[ ] 8. yarn initialize en producción
[ ] 9. sync-role-acls --all-tenants
[ ] 10. configs cache structural --all-tenants
[ ] 11. Actualizar CI: db:migrate en lugar de db:greenfield
[ ] 12. Commit + PR
[ ] 13. CI verde en todos los jobs
[ ] 14. Merge
[ ] 15. TC-SMOKE-001 contra producción: BASE_URL=https://mercato.novaincs.com
```

---

*Documento creado: Mayo 2026 — crm-world (Open Mercato v0.6.2)*
*Ver también: docs/PATTERNS.md §18, docs/ROADMAP.md Phase 36*
