# Spec: Vertical Agroalimentario con Procesamiento — Phase 23

> **Estado**: APROBADO — inicio implementación 2026-05-26
> **Sprint A**: agri_units · agri_feed · agri_vet · agri_inputs
> **Sprint B**: agri_processing · agri_cold_chain · agri_quality · agri_traceability
> **Sprint C**: agri_sales · agri_field · agri_hr · agri_portal

---

## Contexto

Vertical para empresas del sector agroalimentario venezolano con integración vertical completa:
campo (producción primaria) → planta (procesamiento industrial) → distribución (ventas comerciales).

**Casos de uso principales:**
- Avicultura industrial (pollos de engorde, ciclos 42-49 días, múltiples galpones)
- Porcicultura (reproductores, lechones, ciclos de engorde)
- Integración con productores contratados (productores integrados)
- Empresas con planta de beneficio propia y cadena de frío
- Exportación con trazabilidad completa exigida por cadenas de supermercados

---

## Módulos — 12 en total

### Sprint A — Capa de producción primaria

#### `agri_units` — Unidades Productivas y Flocks

**Tablas:**
- `agri_farm_units` — Fincas/granjas (nombre, tipo, ubicación GPS, área, propietario, técnico)
- `agri_flocks` — Lotes de aves por galpón (especie, línea genética, entrada, aves iniciales, proveedor de pollitos)
- `agri_flock_weekly_records` — Registro semanal (semana, peso promedio, consumo alimento, mortalidad, FCA, IEP, temp/humedad)

**KPIs calculados por API** (endpoint `/api/agri-units/flock-kpis`):
- FCA (Factor de Conversión Alimenticia) = kg alimento consumido / kg de peso ganado
- IEP (Índice Europeo de Producción) = (Peso kg × Viabilidad%) / (FCA × Edad días) × 100
- Costo por kg vivo acumulado (USD + VES al tipo actual)
- Proyección de peso y fecha óptima de cosecha

**Features ACL:**
`agri_units.view`, `agri_units.create`, `agri_units.edit`, `agri_units.delete`, `agri_units.weekly_record`

**Eventos:**
- `agri_units.flock.started` — Nuevo lote iniciado (clientBroadcast)
- `agri_units.flock.weekly_recorded` — Registro semanal completado (clientBroadcast)
- `agri_units.flock.completed` — Lote finalizado/cosechado
- `agri_units.flock.mortality_alert` — Mortalidad supera umbral diario (clientBroadcast)

**AI Agent:** `agri_units.production_director_assistant` (6 tools — ver sección AI Agent)

---

#### `agri_feed` — Alimento Balanceado

**Tablas:**
- `agri_feed_formulas` — Fórmulas (iniciador/engorde/finalizador, ingredientes JSON, análisis nutricional, costo/tonelada)
- `agri_feed_batches` — Lotes de alimento (fecha, fórmula, toneladas, ingredientes con lotes de origen, análisis laboratorio)
- `agri_feed_allocations` — Asignación de lotes de alimento a flocks (para trazabilidad)

**Worker:** `workers/on-rate-changed.ts` — subscriber a `venezuela_rates.rate.updated`; recalcula `cost_per_ton_usd` en todas las fórmulas activas.

**Features ACL:**
`agri_feed.view`, `agri_feed.create`, `agri_feed.edit`, `agri_feed.delete`

**Eventos:**
- `agri_feed.formula.created`
- `agri_feed.formula.cost_updated` — Cuando cambia BCV (clientBroadcast)
- `agri_feed.batch.produced`
- `agri_feed.stock.low_alert` — Stock por debajo del mínimo

---

#### `agri_vet` — Sanidad y Medicina Veterinaria

**Tablas:**
- `agri_vaccination_programs` — Programas por especie/producción (vacuna, principio activo, vía, edad días, dosis, retiro)
- `agri_vaccination_records` — Aplicaciones reales por lote (vacuna, fecha, aves tratadas, lote del medicamento, operador)
- `agri_medication_records` — Tratamientos: diagnóstico, medicamento, dosis, duración, veterinario, período retiro, `withdrawal_end_date`
- `agri_mortality_records` — Mortalidad diaria por lote y causa (sanitaria, aplastamiento, calor, selección)

**Regla crítica:** Cuando `agri_processing` crea un `SlaughterBatch`, verifica via Kysely si el flock tiene algún `medication_record` con `withdrawal_end_date > today`. Si lo hay → 409 Conflict.

**Worker:** `workers/mortality-monitor.ts` — corre diariamente; si mortalidad diaria > umbral_especie (0.2% en pollos de engorde) → emite `agri_units.flock.mortality_alert`.

**Features ACL:**
`agri_vet.view`, `agri_vet.create`, `agri_vet.edit`, `agri_vet.delete`, `agri_vet.prescribe`

**Eventos:**
- `agri_vet.vaccination.applied`
- `agri_vet.medication.prescribed` (clientBroadcast)
- `agri_vet.mortality.recorded`
- `agri_vet.withdrawal_period.active` — Período de retiro activo en un lote

---

#### `agri_inputs` — Inventario de Insumos Agropecuarios

**Tablas:**
- `agri_input_items` — Inventario de insumos: medicamentos, vacunas, alimento, agroquímicos, materiales
  - Campos clave: `input_type` (medication/vaccine/feed/agrochemical/material), `insai_registry`, `lot_number`, `expiry_date`, `quantity_available`, `min_stock`, `storage_temp_min/max`
- `agri_input_movements` — Movimientos de stock (entrada/salida/ajuste/consumo). Salida se registra automáticamente al crear VaccinationRecord o MedicationRecord.

**Features ACL:**
`agri_inputs.view`, `agri_inputs.create`, `agri_inputs.edit`, `agri_inputs.delete`, `agri_inputs.adjust`

**Eventos:**
- `agri_inputs.item.stock_low` (clientBroadcast) — Stock < min_stock
- `agri_inputs.item.expiring_soon` (clientBroadcast) — Vence en ≤ 30 días
- `agri_inputs.movement.recorded`

---

### Sprint B — Capa industrial

#### `agri_processing` — Planta de Beneficio y Procesamiento

**Tablas:**
- `agri_slaughter_batches` — Lote de beneficio: flock origen, aves ingresadas, peso vivo total, aves beneficiadas, peso en canal (caliente/frío), rendimiento %, decomisos, análisis microbiológico
- `agri_processing_formulas` — Fórmulas de procesamiento (pechuga deshuesada, salchicha, nuggets): partes usadas, proporciones, aditivos, rendimiento esperado
- `agri_processing_lots` — Lotes de producto terminado vinculados a SlaughterBatch

**Workflow:** Despacho sanitario — jefe de calidad firma antes de despachar.

---

#### `agri_cold_chain` — Cadena de Frío

**Tablas:**
- `agri_cold_storage_units` — Cuartos fríos/congeladores: capacidad, temp objetivo, sensor_id
- `agri_temperature_logs` — Lecturas de temperatura (15 min batch)
- `agri_storage_lot_records` — Lote en cuarto frío: cuarto, desde cuándo, temp ingreso, no-conformidades

**Worker:** `workers/check-temperature-excursions.ts` — evalúa últimas lecturas por cuarto; si sale del rango → alerta WhatsApp + no-conformidad.

---

#### `agri_quality` — HACCP y Calidad Alimentaria

**Tablas:**
- `agri_haccp_plans` — Plan HACCP por proceso (PCCs, límites críticos, monitoreo, acción correctiva)
- `agri_ccp_monitoring_records` — Registro de cada PCC en tiempo real, vinculado a lote
- `agri_non_conformities` — No-conformidades: descripción, lote afectado, decisión (retrabajo/destrucción/liberar), responsable, estado
- `agri_bpm_checklists` — Checklists BPM diarios (limpieza, higiene personal, control plagas)

**Workflow:** No-conformidad crítica de CCP — bloqueo de lote + flujo de decisión gerente de calidad.

---

#### `agri_traceability` — Trazabilidad Alimentaria

**Sin tablas propias** — API transversal que hace JOIN de 5-6 tablas via Kysely.

**Tablas auxiliares:**
- `agri_recalls` — Gestión de retiros de mercado: lote afectado, razón, clientes notificados, estado cierre

**Endpoint clave:** `GET /api/agri-traceability/trace?product_lot=XXX`
Devuelve grafo completo: producto → lote procesamiento → flock → alimentos → medicamentos → proveedor pollitos.

**Workflow:** Recall — GM aprueba, lista auto-generada de clientes afectados.

---

### Sprint C — Capa comercial

#### `agri_sales` — Ventas Industriales

**Tablas:**
- `agri_sale_orders` — Órdenes de venta: cliente, lote de producto, precio, condiciones, estado
- `agri_sale_dispatches` — Despachos con temperatura inicial, camión, temperatura durante transporte
- `agri_sale_invoices` — Facturación integrada con `ve_fiscal`: RIF, IVA 16%, IGTF 3% si pago en USD

#### `agri_field` — Operaciones de Campo Agrícola

**Tablas:**
- `agri_field_plots` — Parcelas: área, tipo suelo, historial cultivos, riego, coordenadas GIS
- `agri_crop_cycles` — Ciclos: cultivo, variedad, densidad siembra, cronograma actividades, rendimiento real vs esperado
- `agri_crop_activities` — Actividades con insumos, maquinaria, mano de obra, costo real

#### `agri_hr` — RRHH Agropecuario

**Tablas:**
- `agri_employees` — Personal fijo (nómina mensual LOTTT completa)
- `agri_jornalers` — Jornaleros/destajeros: jornal o destajo, pasivos prorrateados automáticos
- `agri_producer_settlements` — Liquidación del productor integrado: FCA logrado, peso promedio, mortalidad, monto calculado según tablas del contrato

**Workflow:** Liquidación productor integrado — técnico propone, gerente aprueba, portal notifica al productor.

**PDF:** Liquidación del productor integrado.

#### `agri_portal` — Portal del Productor Integrado

**Páginas:**
- `[orgSlug]/portal/agri/mi-ciclo` — Datos del lote actual: FCA, mortalidad, peso proyectado, días restantes
- `[orgSlug]/portal/agri/mis-liquidaciones` — Historial + PDF descargable
- `[orgSlug]/portal/agri/mis-datos` — Datos de la granja y contacto

---

## AI Agent — Asistente del Director de Producción

**Módulo:** `agri_units` (ai-agents.ts + ai-tools.ts)

**ID:** `agri_units.production_director_assistant`

**Tools:**
1. `agri.get_active_flocks` — Lotes activos con FCA, IEP, mortalidad acumulada y proyección cosecha
2. `agri.get_mortality_alerts` — Lotes con mortalidad por encima del umbral esta semana
3. `agri.get_feed_cost_breakdown` — Costo actual de producción por kg vivo por lote (USD + VES)
4. `agri.get_vaccination_schedule` — Vacunas vencidas o próximas 7 días en todos los galpones
5. `agri.get_cold_chain_status` — Cuartos fríos con temperatura fuera de rango actualmente
6. `agri.get_recall_risk` — Lotes en distribución con medicamentos de período de retiro activo

---

## PDFs

| Documento | Módulo | Trigger |
|---|---|---|
| Informe semanal del lote | `agri_units` | Download desde detalle del flock |
| Guía de despacho sanitaria | `agri_processing` | Workflow aprobado |
| Certificado de trazabilidad | `agri_traceability` | Endpoint GET con product_lot |
| Liquidación del productor | `agri_hr` | Workflow aprobado |

---

## Workflows (Phase 23)

| Workflow | Módulo | Trigger |
|---|---|---|
| Despacho sanitario | `agri_processing` | Lote listo para despacho |
| Recall de producto | `agri_traceability` | QA detecta contaminación |
| No-conformidad crítica CCP | `agri_quality` | CCP reading fuera de límite |
| Liquidación productor integrado | `agri_hr` | Fin de ciclo del flock |

---

## Integraciones con módulos existentes

| Módulo | Integración |
|---|---|
| `venezuela_rates` | `agri_feed` subscriber: recalcular costos de fórmulas al cambiar BCV |
| `ve_fiscal` | `agri_sales`: facturas con RIF, IVA 16%, IGTF 3% |
| `payment_methods` | Pagos de clientes en `agri_sales` y liquidaciones de `agri_hr` |

---

## Nomenclatura de tablas

```
agri_farm_units
agri_flocks
agri_flock_weekly_records
agri_feed_formulas
agri_feed_batches
agri_feed_allocations
agri_vet_vaccination_programs
agri_vet_vaccination_records
agri_vet_medication_records
agri_vet_mortality_records
agri_input_items
agri_input_movements
agri_slaughter_batches
agri_processing_formulas
agri_processing_lots
agri_cold_storage_units
agri_temperature_logs
agri_storage_lot_records
agri_haccp_plans
agri_ccp_monitoring_records
agri_non_conformities
agri_bpm_checklists
agri_recalls
agri_sale_orders
agri_sale_dispatches
agri_sale_invoices
agri_field_plots
agri_crop_cycles
agri_crop_activities
agri_employees
agri_jornalers
agri_producer_settlements
```
