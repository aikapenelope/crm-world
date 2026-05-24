# Roadmap — Aika Platform

> Última actualización: 24 Mayo 2026 — CI verde ✅ · TypeScript limpio ✅
> Stack: Open Mercato v0.6.1 · Next.js 16 · Hetzner CX43 Helsinki · Coolify 4.0
> Deploy URL: mercato.novaincs.com · Panel: deploy.novaincs.com
> CI: github.com/aikapenelope/crm-world/actions — Lint ✅ Typecheck ✅ Unit Tests ✅

---

## Verticales — Estado

| Vertical | Phase | Módulos | AI Agent | Search | PDF | Estado |
|----------|-------|---------|----------|--------|-----|--------|
| Real Estate / Inmobiliaria | 2–6 | 8 módulos | ✅ | ✅ | — | **COMPLETO** |
| Fiscal Venezuela (transversal) | 7 | 4 módulos | — | ✅ | — | **COMPLETO** |
| Educación / Colegios | 8 | 10 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| Distribución / Distribuidoras | 9 | 8 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| Automotriz / Talleres | 10 | 7 módulos | ✅ | ✅ | — | **COMPLETO** |
| Retail / Comercio | 11 | 7 módulos | ✅ | ✅ | — | **COMPLETO** |
| Condominios | 12 | 7 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| Construcción / Constructoras | 13 | 8 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| **Academias y Formación** | 20 | 9 módulos | ✅ | ✅ | — | **COMPLETO** |
| **ISP / Telecomunicaciones** | 22 | 9 módulos | — | ✅ | — | **COMPLETO** |
| **Agroalimentario con Procesamiento** | 23 | 12 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| **Manufactura Industrial** | 24 | 16 módulos | ✅ | ✅ | ✅ | **COMPLETO** |
| Fitness / Gym | — | — | — | — | — | Candidata |
| Beauty / Salones | — | — | — | — | — | Candidata |
| Services / Agencias | — | — | — | — | — | Candidata |
| Transporte / Logística | — | — | — | — | — | Futura |

> **Healthcare / Clínicas — DESCARTADO.**
> **Restaurant / Food — DESCARTADO.** Fuera de roadmap.

---

## Completado

### Phase 0 — Infraestructura base
- [x] Hetzner CX33 (Helsinki) via Pulumi
- [x] Coolify 4.0 (deploy.novaincs.com)
- [x] HTTPS (Let's Encrypt)
- [x] Seguridad (fail2ban, UFW, swap, backups)
- [x] Auto-deploy on push to main

### Phase 1 — Base Venezuela (todos los tenants)
- [x] `venezuela_rates` — DolarApi (BCV + paralelo)
- [x] `payment_methods` — 7 métodos locales (Zelle, Binance, efectivo USD/VES, transferencia, pago móvil, punto)
- [x] `ve_fiscal` — RIF/CI, IVA 16%, IGTF 3%
- [x] `ve_tenant_defaults` — auto-config al crear tenant

### Phase 2–6 — Real Estate / Inmobiliaria (completo)
- [x] `properties`, `transactions`, `matching`, `property_portal`, `property_docs`, `property_publishing`, `mercadolibre_sync`, `market_intelligence`
- [x] Dashboard widgets, notificaciones, agent portal, CSV import, `search.ts`
- [x] **AI Agent** — Asistente del Agente Inmobiliario (5 tools)

### Phase 7 — Fiscal Venezuela (transversal)
- [x] `ve_tax_books`, `ve_withholdings`, `ve_tax_reports`, `bank_reconciliation`

### Phase 8 — Educación / Colegios (completo)
- [x] `students`, `enrollment`, `tuition`, `grades`, `attendance`, `school_calendar`, `school_comms`, `school_docs`, `parent_portal`, `school_migration`
- [x] `search.ts` para todos los módulos de educación
- [x] **AI Agent** — Asistente del Director Escolar (tuition, 5 tools)
- [x] **PDFs** — Boletín escolar + Constancia de inscripción

### Phase 9 — Distribución / Distribuidoras (completo)
- [x] `dist_credit`, `dist_price_lists`, `dist_inventory`, `dist_routes`, `dist_delivery`, `dist_reports`, `dist_commissions`, `dist_portal`
- [x] `search.ts` para todos los módulos dist
- [x] **AI Agent** — Asistente del Director de Distribución (dist_reports, 5 tools)
- [x] **PDF** — Nota de entrega / Remisión

### Phase 10 — Automotriz / Talleres Mecánicos (completo)
- [x] `auto_vehicles`, `auto_service_orders`, `auto_inspections`, `auto_parts`, `auto_estimates`, `auto_reports`, `auto_portal`
- [x] `search.ts` para todos los módulos auto
- [x] **AI Agent** — Asistente del Gerente de Taller (auto_reports, 5 tools)
- [x] Regionalización VE: 15 marcas, 20 servicios comunes, validación placa venezolana

### Phase 11 — Retail / Comercio (completo)
- [x] `retail_branches`, `retail_inventory`, `retail_loyalty`, `retail_returns`, `retail_ecommerce`, `retail_purchasing`, `retail_pricing`
- [x] `search.ts` para todos los módulos retail
- [x] **AI Agent** — Asistente del Gerente de Retail (retail_branches, 5 tools)

### Phase 12 — Condominios / Property Management (completo)
- [x] `condo_properties`, `condo_fees`, `condo_collections`, `condo_maintenance`, `condo_accounting`, `condo_comms`, `condo_portal`
- [x] `search.ts` para `condo_properties`, `condo_fees`, `condo_maintenance`, `condo_collections`
- [x] **AI Agent** — Asistente del Administrador de Condominio (6 tools)
- [x] **PDFs** — Recibo de condominio + Acta de asamblea

### Phase 13 — Construcción / Constructoras (completo)
- [x] `const_projects`, `const_budget`, `const_schedule`, `const_progress`, `const_rfis`, `const_daily`, `const_subcon`, `const_materials`
- [x] `search.ts` para todos los módulos const
- [x] **AI Agent** — Asistente del Director de Obra (6 tools)
- [x] **PDF** — Valuación de obra (tabla de partidas, montos, firmas)

### Phase 14 — Real-time + Platform Quality (completo)
- [x] `emit-lifecycle.ts`, `calendar-links.ts` — utilidades base
- [x] `clientBroadcast: true` + `emitLifecycle()` en módulos clave
- [x] `indexer: { entityType }` en todas las CRUD routes
- [x] `search.ts` universal — 63 módulos (100% coverage)
- [x] Módulo `example` desactivado, tokens semánticos OM

### Phase 15 — Portal del Propietario Condominios (completo)
- [x] Recibos, mantenimiento, circulares, votaciones, documentos, estado de cuenta

### Phase 16 — Páginas de Detalle `[id]` (completo)
- [x] `const_projects/[id]`, `condo_properties/[id]`, `condo_fees/receipts/[id]`
- [x] `const_rfis/[id]`, `const_daily/[id]`, `auto_service_orders/[id]`

### Phase 17 — Generación de PDFs (completo)
- [x] Recibo de condominio, Valuación de obra, Boletín escolar, Constancia de inscripción, Nota de entrega, Acta de asamblea

### Phase 18 — CI Pipeline (COMPLETO Y VERDE ✅ — PR #83)
- [x] `.github/workflows/ci.yml` — 3 jobs paralelos: Lint + Typecheck + Unit Tests
- [x] Lint verde: `typescript-eslint` en `src/modules` (patrón OM standalone)
- [x] Typecheck verde: `tsc --noEmit` en TODO el código (incluye `.tsx` backend pages)
- [x] Unit Tests verde: Jest con `jest-mikroorm-transformer.cjs` del repo oficial
- [x] Fix 900+ errores TS con regex (PR #83) → limpiados correctamente con tipos reales en Phase 24.5
- [x] Documentación CI completa en `docs/CI.md`
- [x] `docs/OPEN_MERCATO_REFERENCE.md` actualizado con todos los breaking changes

### Phase 19 — Workflows de Aprobación (completo)
- [x] Infraestructura: `WorkflowApprovalWidget`, `seed-workflow.ts`, `useWorkflowApproval.ts`
- [x] **Gasto extraordinario** (`condo_accounting`) — Junta aprueba gastos fuera del presupuesto
- [x] **Change order** (`const_rfis`) — Gerente de obra aprueba RFIs con impacto en costo
- [x] **Límite de crédito** (`dist_credit`) — Gerencia autoriza cambios de límite
- [x] **Inscripción escolar** (`enrollment`) — Comité de admisiones decide solicitudes
- [x] **Devolución fuera de política** (`retail_returns`) — Gerente autoriza devoluciones

### Phase 20 — Academias y Centros de Formación (completo)
- [x] 9 módulos + portal del estudiante, kanban, AI Agent, search.ts universal

### Phase 22 — ISP / Telecomunicaciones Venezuela (completo)
- [x] **22-A** — `isp_plans`, `isp_network`, `isp_subscribers`, `isp_billing` — core económico
- [x] **22-B** — `isp_support`, `isp_technicians`, `isp_sales` — operaciones diarias
- [x] **22-Portal** — `isp_portal` — portal del abonado
- [x] **Estandarización** — search.ts, notifications.ts, events.ts para todos los módulos ISP
- [ ] **22-C** — `isp_monitoring` — webhooks Zabbix/PRTG + Radius/OLT (pendiente: cliente con NMS)

### Estandarización de módulos — Sprints S1–S6 (completo)
- [x] **S1** — events.ts + i18n para módulos de infraestructura
- [x] **S2** — Schema `NotificationTypeDefinition` correcto en 10 módulos
- [x] **S3** — `search.ts` para 12 módulos → 100% coverage
- [x] **S4** — `CrudForm` en 7 páginas + 19 excepciones AGM documentadas
- [x] **S5** — `notifications.ts` en 63 módulos operativos (100%)
- [x] **S6** — `<Button>` reemplaza `<button>` raw; `<table>` excepciones documentadas
- [x] **Portales** — Migración a `[orgSlug]/portal/` en 6 módulos

### Phase 23 — Agroalimentario con Procesamiento (completo)

Vertical para empresas con integración vertical completa: campo → planta → distribución.
Spec completo en `.ai/specs/2026-05-26-agri-agroalimentario-vertical.md`.

**12 módulos en 3 capas:**

#### Sprint A — Producción primaria
- [x] `agri_units` — Fincas, galpones, flocks (lotes de aves). KPIs: FCA, IEP, viabilidad, proyección día 42. AI Agent con 6 tools.
- [x] `agri_feed` — Fórmulas de alimento con ingredientes USD/VES. Worker de recálculo automático al cambiar tasa BCV. Editor de ingredientes con cálculo de costo en tiempo real.
- [x] `agri_vet` — Vacunación (con calendario automático), medicación, mortalidad diaria. Bloqueo de despacho por período de retiro activo.
- [x] `agri_inputs` — Inventario de insumos (medicamentos, vacunas, agroquímicos). Descuento automático al aplicar tratamientos.

#### Sprint B — Capa industrial
- [x] `agri_processing` — Planta de beneficio. Verificación de retiro activo antes de permitir beneficio. Workflow `despacho_sanitario_v1`.
- [x] `agri_cold_chain` — Cadena de frío. Endpoint IoT batch, worker de excursiones, historial con sparkline. Alert threshold para micro-cortes venezolanos.
- [x] `agri_quality` — HACCP con editor de PCCs, monitoreo de PCCs con auto-NC, checklists BPM. Workflow `no_conformidad_ccp_v1`.
- [x] `agri_traceability` — Trazabilidad completa (producto → flock → alimentos → medicamentos) via Kysely. Recall con workflow `recall_v1`.

#### Sprint C — Capa comercial
- [x] `agri_sales` — Ventas a cadenas/distribuidores. Multi-moneda: USD + IVA 16% VES + IGTF 3%.
- [x] `agri_field` — Operaciones de campo (maíz, soya, sorgo). Costo real de materia prima propia.
- [x] `agri_hr` — Nómina jornaleros (provisiones LOTTT automáticas) + liquidación productor integrado. Workflow `liquidacion_productor_v1`.
- [x] `agri_portal` — Portal del productor integrado: ciclo activo (FCA/IEP en tiempo real), liquidaciones, datos.

**UI completa + 5 flujos inteligentes:**
- [x] Dashboard "Programa de Cosecha" — todos los flocks activos con semáforos de retiro/cosecha
- [x] Editor inline de PCCs (HACCP) y calendario de vacunación (VetPrograms)
- [x] Editor de ingredientes de fórmula con cálculo BCV en tiempo real
- [x] Nóminas jornaleros con preview de LOTTT antes de guardar
- [x] Historial de temperatura con sparkline SVG
- [x] Auto-aplicar programa de vacunación al iniciar flock
- [x] Auto-calcular liquidación del productor al completar flock
- [x] Excursión de temperatura → No-Conformidad automática
- [x] Vacunación/medicación → descuento automático en inventario
- [x] Costo de producción por lote en tiempo real (endpoint + tab UI)

**Workflows activados (seedModuleWorkflow en setup.ts + páginas [id]):**
- [x] `despacho_sanitario_v1` — `agri_processing/[id]`
- [x] `no_conformidad_ccp_v1` — `agri_quality/non-conformities/[id]`
- [x] `recall_v1` — `agri_traceability/recalls/[id]`
- [x] `liquidacion_productor_v1` — `agri_hr/settlements/[id]`

**PDFs (4 documentos):**
- [x] Liquidación del productor integrado (ciclo + KPIs + desglose de pago)
- [x] Guía de despacho sanitaria (lote de beneficio + resultados QC + vehículo)
- [x] Certificado de trazabilidad del lote (flock → alimentos → medicamentos → PT)
- [x] Informe semanal del lote (FCA, IEP, mortalidad, peso, proyecciones)

---

### Phase 24 — Manufactura Industrial (completo)

Vertical para fábricas de producción discreta y por procesos en Venezuela.
Spec completo en `.ai/specs/2026-05-26-manufactura-industrial.md`.

**16 módulos en 4 sprints:**

#### Sprint A — Núcleo productivo
- [x] `mfg_bom` — BOM multinivel (process/discrete), versiones, materiales alternativos para escasez. Workflow `bom_approval_v1`.
- [x] `mfg_inventory` — Almacén 4-tier (MP/empaque/WIP/PT), lotes FEFO, cuarentena QC, conteo cíclico.
- [x] `mfg_orders` — Órdenes con routing, reserva de materiales, OEE separado (CORPOELEC vs. interno). AI Agent + workflow `downtime_escalation_v1`.
- [x] `mfg_quality` — Planes de muestreo, SPC con cartas X-R, NCs automáticas en PCCs. Workflow `nc_disposition_v1`.

#### Sprint B — Inteligencia productiva
- [x] `mfg_mrp` — Motor MRP completo: BOM explosion, necesidades netas, lead times 60d importación venezolana, requisiciones automáticas.
- [x] `mfg_floor` — MES simplificado: OEE total vs. interno, worker cierre de turno, reportes automáticos.
- [x] `mfg_planning` — MPS semanal + heatmap eléctrico CORPOELEC, carga de capacidad por línea.
- [x] `mfg_costs` — Costeo bimoneda + variaciones de precio/cantidad/MO al cierre de cada orden.

#### Sprint C — Operaciones completas
- [x] `mfg_maintenance` — GMAO: preventivo/correctivo, repuestos críticos con stock de seguridad = ceil(lead_time/MTBF).
- [x] `mfg_procurement` — OCs con tracking completo de importación + cálculo CIF real en almacén. Workflow `purchase_authorization_v1`.
- [x] `mfg_subcontract` — Maquila con almacén virtual en instalaciones del maquilador, merma real vs. contractual.
- [x] `mfg_energy` — Consumo kWh, cortes CORPOELEC, sobrecosto generador (`generator_premium_usd`).

#### Sprint D — Capa comercial e inteligencia
- [x] `mfg_dispatch` — Pedidos industriales (IVA 16% + IGTF 3% bimoneda), guías de despacho, CoA obligatorio.
- [x] `mfg_hr` — Operarios con LOTTT (+30% noche, +25% extra día), bonos de producción por cuota.
- [x] `mfg_reports` — KPI dashboard ejecutivo + AI Agent "Gerente de Fábrica" (6 tools cross-module).
- [x] `mfg_portal` — Portal cliente industrial: estado de pedidos + certificados de análisis.

**PDFs (4 documentos):**
- [x] Guía de Despacho PT (cliente, lotes, cantidades, vehículo, firma de recepción)
- [x] Certificate of Analysis (CoA) — resultados de QC del lote para clientes industriales
- [x] Reporte de Turno — OEE total/interno, producción real vs. plan, paros por categoría
- [x] Orden de Trabajo de Mantenimiento — instructivo para técnicos con repuestos requeridos

---

### Phase 24.5 — Post-CI TypeScript Cleanup (COMPLETO ✅ — PRs #85-92)

> **Contexto**: El PR #83 (CI verde) fijó los 900+ errores TS usando un script
> de regex que introdujo `as any` masivos como workaround. Esta phase limpió
> todos esos casteos reemplazándolos con los tipos correctos según la API real
> de OM v0.6.1, sin tocar los patrones documentados como correctos
> (`(em as any).getKysely()`, `em.create(Entity, {...} as any)` en seeds).

- [x] **Sprint 1** — `fields={[] as any[]}` → `fields={[]}` en 42 páginas CrudForm (PR #85)
- [x] **Sprint 2** — Tab casts, `result.result as any`, `apiCall<T>` generics en 16 archivos (PR #86)
- [x] **Sprint 3** — `norm(r.field as string)` → `norm(r.field)` en 84 `search.ts` (371 reemplazos) (PR #87)
- [x] **Sprint 4** — Kysely results `as any` → interfaces locales tipadas en `isp_billing` + `isp_subscribers` (PR #88)
- [x] **Sprint 5** — CrudForm old API → v0.6.1 + Kysely interfaces en `agri_hr` + `const_progress` (PR #89)
- [x] **Sprint 6** — CrudForm old API → v0.6.1 + tipo `MrpRunSummary` en `mfg_bom/mrp/orders` (PR #90)
- [x] **Sprint 7** — CrudForm old API → v0.6.1 en 30 archivos restantes (agri/mfg) (PR #91)
- [x] `jest.config.cjs` — `kysely`/`meilisearch` en `transformIgnorePatterns` + aliases `@/generated/*` y `@open-mercato/core/generated/*` (PR #92)

**Patrones correctos preservados (documentados en `docs/PATTERNS.md`):**
- `(em as any).getKysely()` — API no pública de MikroORM, correcto
- `em.create(Entity, {...} as any)` en seeds/setup — necesario por strict types de MikroORM v7
- `null as any` en `orgField`/`tenantField` de entidades sin tenant scope
- `(ctx as any).resolve?.('em')` en search.ts — patrón DI documentado

---

## Pendiente

### Phase 22-C — ISP Monitoring (bloqueado: cliente con NMS)
- [ ] `isp_monitoring` — webhooks Zabbix/PRTG + comandos Radius/OLT

---

## Próximas Fases — Roadmap

> Orden sugerido basado en impacto y dependencias técnicas.

### Phase 25 — Tests unitarios para módulos custom (EN PROGRESO 🔄)

> **Infraestructura lista**: `jest.config.cjs` alineado con OM oficial (PR #92).
> **Progreso actual**: 26 módulos con tests · 899 assertions · CI verde en todos los sprints.

**Progreso por sprints** (divididos en 11 sprints atómicos por vertical):

| Sprint | Módulos | Tests | PR | Estado |
|--------|---------|-------|-----|--------|
| **T1 — Venezuela base** | `payment_methods`, `ve_tax_books`, `ve_withholdings` | 101 | #94 | ✅ MERGED |
| **T2 — ISP completo** | `isp_billing`, `isp_subscribers`, `isp_plans`, `isp_network`, `isp_support`, `isp_technicians`, `isp_sales` | 223 | #95 | ✅ MERGED |
| **T3 — Agro producción** | `agri_units`, `agri_feed`, `agri_hr`, `agri_vet`, `agri_inputs` | 181 | #96 | ✅ MERGED |
| **T4 — Agro industrial** | `agri_processing`, `agri_cold_chain`, `agri_quality`, `agri_sales`, `agri_field`, `agri_traceability` | 186 | #97 | ✅ MERGED |
| **T5 — Manufactura α** | `mfg_inventory`, `mfg_quality`, `mfg_floor`, `mfg_planning`, `mfg_costs`, `mfg_energy` | — | — | ⏳ PENDIENTE |
| **T6 — Manufactura β** | `mfg_maintenance`, `mfg_procurement`, `mfg_dispatch`, `mfg_hr`, `mfg_subcontract` | — | — | ⏳ PENDIENTE |
| **T7 — Construcción** | 8 × `const_*` | — | — | ⏳ PENDIENTE |
| **T8 — Distribución** | 6 × `dist_*` | — | — | ⏳ PENDIENTE |
| **T9 — Retail + Condo** | 7 × `retail_*` + 6 × `condo_*` | — | — | ⏳ PENDIENTE |
| **T10 — Educación** | `students`, `enrollment`, `tuition`, `grades`, `attendance`, 3 × `school_*` | — | — | ⏳ PENDIENTE |
| **T11 — Academia + Auto + Varios** | 5 × `academy_*`, 5 × `auto_*`, `transactions`, `bank_reconciliation`, `market_intelligence` | — | — | ⏳ PENDIENTE |

**Estado global**: 21 módulos cubiertos (T1-T4) · 59 módulos pendientes (T5-T11) · 899 tests.

**Patrón establecido** — cada spec sigue exactamente este patrón:
```
src/modules/<module>/__tests__/validators.spec.ts
```

Cada test cubre:
- `createSchema.safeParse(validPayload)` → success con defaults correctos
- Campos requeridos faltantes → failure
- Cada enum inválido → failure con `test.each`
- Reglas de negocio venezolanas (RIF, IVA, IGTF, LOTTT, tasas BCV, etc.)
- `updateSchema.safeParse({})` → success (partial update acepta vacío)

**Regla de oro post-T4**: Antes de cada commit de tests, ejecutar el script de auditoría
para detectar campos inexistentes (`result.data.FIELD` que no están en el schema):
```bash
python3 -c "
import re, glob
for f in glob.glob('src/modules/*/__tests__/validators.spec.ts'):
    mod = f.replace('/__tests__/validators.spec.ts','')
    vf = f'{mod}/data/validators.ts'
    try:
        test_fields = set(re.findall(r'result\.data\.([a-z_]+)', open(f).read()))
        vfields = set(re.findall(r'(?:^|,|\(|\{)\s*([a-z_]+):\s*z\.', open(vf).read(), re.M))
        unknown = test_fields - vfields
        if unknown: print(f'MISMATCH {mod.split(\"/\")[-1]}: {sorted(unknown)}')
    except: pass
print('Audit done')
"
```

---

### Phase 26 — Upgrade Open Mercato v0.6.2

**Por qué**: La versión actual del repo oficial es `0.6.2`. El proyecto usa `0.6.1`.
La diferencia incluye parches de TypeScript 6 y correcciones de eslint-config-next.

**Qué cambiaría**:
- `"typescript": "^5.9.3"` → `"typescript": "^6.0.3"`
- `"eslint-config-next": "16.2.6"` (ya está en 16.2.6)
- `@open-mercato/*`: `"0.6.1"` → `"0.6.2"`
- `"jest": "^30.3.0"` → `"^30.4.2"` (ya disponible)

**Riesgo**: TypeScript 6 es un major bump. Revisar breaking changes antes.
**Cómo**: Leer `UPGRADE_NOTES.md` del repo oficial antes de proceder.

---

### Phase 27 — Nuevas Verticales

**Candidatas prioritarias:**

#### Fitness / Gym
- `gym_members`, `gym_plans`, `gym_attendance`, `gym_payments`, `gym_classes`, `gym_portal`
- Venezuela: planes en USD, múltiples métodos de pago, control de acceso

#### Beauty / Salones / Spas
- `beauty_services`, `beauty_appointments`, `beauty_inventory`, `beauty_staff`, `beauty_portal`
- Venezuela: citas online, comisiones, productos de belleza

#### Agencias de Servicios Profesionales
- `agency_projects`, `agency_billing`, `agency_time_tracking`, `agency_contracts`
- Venezuela: facturación en USD/VES, retenciones ISLR

**Proceso para cada vertical nueva** (workflow validado en CI verde + type cleanup):
1. Leer repo OM antes de escribir código → `open-mercato/open-mercato apps/mercato/src/modules/example/`
2. Escribir `validators.ts` + `validators.spec.ts` PRIMERO (tests-first)
3. Verificar `yarn generate && yarn typecheck && yarn test` después de cada módulo
4. Usar API correcta v0.6.1: `id:` en campos, `title:` en grupos, etc.
5. `acl.ts` siempre con `export default features`
6. CrudForm solo con `fields/groups/initialValues/onSubmit/cancelHref` — nunca `entityId/apiPath/mode`

---

### Phase 28 — Integration Tests

**Objetivo**: Tests end-to-end para los flujos críticos.

**Infraestructura disponible**:
- `test:integration:ephemeral` en `package.json` — Docker + app real
- Playwright config en `.ai/qa/tests/playwright.config.ts`
- Helpers en `@open-mercato/core/helpers/integration/*` (auth, apiRequest, fixtures)
- 1 spec existente: `properties/__integration__/properties-crud.spec.ts` — **no corre en CI aún**

**Candidatos prioritarios**:
1. Activar el spec existente (`properties`) en CI como smoke test inicial
2. Flujo ISP: abonado → factura → pago → estado cuenta
3. Flujo manufactura: BOM → orden → despacho → CoA
4. Creación de tenant → módulos base venezolanos auto-configurados

---

### Phase 29 — Actualización CI con coverage threshold

Una vez que haya tests en todos los módulos, activar el threshold de coverage:

```js
// jest.config.cjs — activar cuando coverage sea suficiente
coverageThreshold: {
  global: {
    branches: 70,   // Empezar conservador
    functions: 80,
    lines: 80,
    statements: 80,
  },
},
```

**Condición**: Al menos 1 test por módulo con validators (Phase 25 completada).

---

## Deuda técnica general

| Item | Prioridad | Estado |
|------|-----------|--------|
| Tests unitarios validators (59 módulos pendientes T5-T11) | **ALTA** | Phase 25 — EN PROGRESO (21/80 módulos, 899 tests) |
| Integration tests (properties spec no corre en CI) | **ALTA** | Phase 28 — activar spec existente |
| Upgrade OM v0.6.2 + TypeScript 6 | **MEDIA** | Phase 26 |
| `yarn build` validado en CI (next build completo) | **MEDIA** | Sin phase asignada |
| Security audit en CI (`yarn npm audit --severity high`) | **MEDIA** | Sin phase asignada |
| i18n sync en CI (226 archivos JSON, 4 locales) | **MEDIA** | Sin phase asignada |
| Migrations formales por módulo | Media | Solo necesario al cambiar entidades en producción |
| `portalBroadcast` en portales | Baja | Pendiente migración a PortalShell OM completo |
| Wildcard domain `*.aika.com.ve` | Media | Pendiente DNS challenge |
| Coverage threshold activado en CI | Baja | Phase 29 (requiere Phase 25) |
| Docker layer caching en Coolify | Baja | Optimización de build |
| Dependabot para actualizaciones automáticas | Baja | Sin phase asignada |
