# Spec: Vertical Manufactura Industrial — Phase 24

> **Estado**: APROBADO — inicio implementación 2026-05-26
> **Sprint A**: mfg_bom · mfg_inventory · mfg_orders · mfg_quality
> **Sprint B**: mfg_mrp · mfg_floor · mfg_planning · mfg_costs
> **Sprint C**: mfg_maintenance · mfg_procurement · mfg_subcontract · mfg_energy
> **Sprint D**: mfg_dispatch · mfg_hr · mfg_reports · mfg_portal

---

## Contexto

ERP manufacturero para Venezuela 2026. Opera bajo cuatro presiones que no existen en otros mercados:
1. **Materia prima importada** — precio en USD con alta volatilidad, lead time 45-90 días (trámite divisas + aduana)
2. **Mano de obra en bolívares** — con ajustes frecuentes, régimen LOTTT con turnos rotativos
3. **Energía eléctrica intermitente** — cortes frecuentes y semi-predecibles por zona (CORPOELEC)
4. **Repuestos importados difíciles** — piezas que en Colombia tardan 2 semanas, en Venezuela 3 meses

**Sectores cubiertos:**
- Alimentos procesados (harina, aceite, pastas, snacks) — producción por procesos
- Plásticos y empaques — producción discreta y por procesos
- Pinturas y químicos — producción por procesos con rendimientos
- Farmacéutica — alta regulación, trazabilidad exigida
- Textil y calzado — producción discreta multinivel
- Metalmecánica — BOM multinivel, routing complejo
- Ensamblaje ligero — BOM multinivel, subcontratación

---

## Módulos — 16 en total

### Sprint A — Núcleo productivo

#### `mfg_bom` — Bill of Materials

**Tablas:**
- `mfg_bom_headers` — cabecera: producto_id, versión, estado (draft/active/superseded), tipo (process/discrete), rendimiento_esperado_pct, aprobado_por, fecha_aprobación
- `mfg_bom_lines` — líneas: bom_id, componente_id, tipo_componente (raw/packaging/subassembly), cantidad, unidad, merma_pct, es_critico, notas
- `mfg_bom_alternatives` — materiales alternativos: bom_line_id, material_alternativo_id, factor_conversion, condicion_uso
- `mfg_bom_versions` — historial de versiones con diff de cambios y motivo

**Features ACL:**
`mfg_bom.view`, `mfg_bom.create`, `mfg_bom.edit`, `mfg_bom.approve`, `mfg_bom.delete`

**Eventos:**
- `mfg_bom.created` — BOM creado (clientBroadcast)
- `mfg_bom.activated` — versión activada para producción (clientBroadcast)
- `mfg_bom.superseded` — versión reemplazada

**UI:**
- Lista de BOMs con versión activa, tipo, rendimiento
- Detalle [id]: editor de líneas con tabla inline (componente, cantidad, unidad, merma, tipo)
- Panel de materiales alternativos por línea
- Historial de versiones con comparación
- Explosión multinivel: vista árbol del BOM completo

---

#### `mfg_inventory` — Almacén de Manufactura

**Tablas:**
- `mfg_warehouse_locations` — ubicaciones de almacén: código, zona (cuarentena/disponible/rechazado/WIP), condiciones (temperatura, humedad)
- `mfg_stock_lots` — lotes de inventario: material_id, lote_proveedor, fecha_vencimiento, fecha_entrada, costo_usd, status (quarantine/available/reserved/consumed), analisis_qc_id
- `mfg_stock_movements` — movimientos: tipo (GR_purchase/GR_production/GI_production/GI_scrap/transfer/adjustment), lote_id, cantidad, orden_referencia_id
- `mfg_cycle_counts` — conteos cíclicos: zona, periodo, status, diferencias detectadas

**Features ACL:**
`mfg_inventory.view`, `mfg_inventory.receive`, `mfg_inventory.issue`, `mfg_inventory.adjust`, `mfg_inventory.count`

**Eventos:**
- `mfg_inventory.stock_below_reorder` — stock < punto de reorden (clientBroadcast)
- `mfg_inventory.lot_expiring_soon` — lote vence en ≤ 30 días (clientBroadcast)
- `mfg_inventory.quarantine_lot_released` — lote de cuarentena liberado

---

#### `mfg_orders` — Órdenes de Producción

**Tablas:**
- `mfg_production_orders` — cabecera: número, bom_id, producto_id, cantidad_planificada, cantidad_real, fecha_inicio_plan, fecha_fin_plan, fecha_inicio_real, fecha_fin_real, status, costo_planificado_usd, costo_real_usd, lote_producción
- `mfg_order_operations` — operaciones de la ruta: order_id, operación_num, centro_trabajo_id, tiempo_estándar_hrs, tiempo_real_hrs, status, operador_id
- `mfg_work_centers` — centros de trabajo: nombre, tipo (máquina/línea/célula), capacidad_turno_hrs, costo_hr_usd
- `mfg_order_material_issues` — consumos reales de material vs. planificado por línea BOM
- `mfg_production_downtimes` — paros: order_id, operación_id, inicio, fin, causa (electrical_cut/mechanical/material_shortage/quality_hold/format_change/other), descripción, impacto_hrs

**Features ACL:**
`mfg_orders.view`, `mfg_orders.create`, `mfg_orders.execute`, `mfg_orders.close`, `mfg_orders.delete`

**AI Agent:** `mfg_orders.production_director_assistant` — en módulo `mfg_orders`
6 tools: get_active_orders_status, get_oee_by_line, get_downtime_analysis, get_material_shortage_alerts, get_cost_variance_summary, get_production_schedule

**Eventos:**
- `mfg_orders.released` — orden liberada para producción (clientBroadcast)
- `mfg_orders.started` — inicio de producción (clientBroadcast)
- `mfg_orders.completed` — cierre de orden (clientBroadcast)
- `mfg_orders.downtime_started` — paro iniciado (clientBroadcast, alerta)
- `mfg_orders.downtime_ended` — paro terminado

---

#### `mfg_quality` — Control de Calidad Industrial

**Tablas:**
- `mfg_quality_plans` — plan de muestreo: producto_id, punto_control (receiving/in_process/finished), parámetro, LSE, LIE, LSC, LIC, unidad, frecuencia_muestreo, instrumento
- `mfg_quality_inspections` — resultados: plan_id, lote_id, order_id, valor_medido, status (in_spec/out_spec/in_control/out_control), inspector_id, timestamp
- `mfg_nonconformances` — no-conformidades: NC_number, origen (receiving/in_process/finished/customer_return), lote_id, order_id, descripción, severidad (critical/major/minor), disposición (rework/scrap/use_as_is/return_supplier), estado, costo_nc_usd
- `mfg_spc_charts` — datos históricos para gráficas X-R / X-S por parámetro y producto

**Features ACL:**
`mfg_quality.view`, `mfg_quality.inspect`, `mfg_quality.disposition`, `mfg_quality.plans`

**Eventos:**
- `mfg_quality.out_of_spec_detected` — valor fuera de especificación (clientBroadcast, alerta)
- `mfg_quality.nc_created` — no-conformidad abierta (clientBroadcast)
- `mfg_quality.lot_released` — lote liberado de cuarentena
- `mfg_quality.lot_rejected` — lote rechazado (clientBroadcast)

---

### Sprint B — Inteligencia productiva

#### `mfg_mrp` — Motor MRP
- `mfg_production_plans` — plan mensual con demanda comprometida + proyectada
- `mfg_mrp_requirements` — necesidades netas calculadas por material y período
- `mfg_purchase_requisitions` — solicitudes de compra generadas automáticamente
- Worker `run-mrp.ts` — corre al final de cada día o bajo demanda

#### `mfg_floor` — Piso de Planta MES
- `mfg_shift_reports` — reporte de turno: producción real, paros, rechazos, OEE
- `mfg_oee_history` — historial OEE por línea/día con separación paros eléctricos vs. internos
- Worker `close-shift.ts` — genera ShiftReport al cierre + envía WhatsApp

#### `mfg_planning` — MPS
- `mfg_master_schedule` — MPS semanal: producto, línea, semana, cantidad
- `mfg_capacity_loads` — carga de capacidad por centro de trabajo
- `mfg_energy_windows` — ventanas de suministro eléctrico por día/zona para planificación

#### `mfg_costs` — Contabilidad de Costos
- `mfg_cost_centers` — centros de costo
- `mfg_standard_costs` — costos estándar por producto (USD + VES al tipo vigente)
- `mfg_cost_variances` — variaciones al cierre de orden: precio, cantidad, mano de obra
- `mfg_cost_reports` — reportes por período y producto

---

### Sprint C — Operaciones completas

#### `mfg_maintenance` — GMAO
- `mfg_equipment` — equipos con historial, manuales, costo reposición USD
- `mfg_maintenance_plans` — preventivo por horas/días/ciclos
- `mfg_work_orders_maint` — órdenes correctivas y preventivas
- `mfg_spare_parts` — inventario de repuestos con stock de seguridad basado en MTBF + lead time importación
- Worker `check-maintenance-due.ts` — genera WOs cuando se cumple la condición

#### `mfg_procurement` — Compras Industriales
- `mfg_suppliers` — proveedores con lead time real histórico, confiabilidad, términos pago
- `mfg_purchase_orders` — OC con campos adicionales para importación (incoterm, DAU, agente aduana)
- `mfg_import_tracking` — seguimiento de importaciones: embarque → aduana → almacén
- Cálculo automático costo CIF real en almacén

#### `mfg_subcontract` — Maquila y Subcontratación
- `mfg_subcontract_orders` — órdenes de maquila con materiales enviados y PT esperado
- `mfg_subcontract_stock` — almacén virtual del maquilador
- Control de merma real vs. estándar contractual

#### `mfg_energy` — Gestión de Energía Eléctrica
- `mfg_energy_consumption` — consumo real por turno/línea/máquina en kWh
- `mfg_power_outages` — registro de cortes con duración e impacto en producción
- `mfg_energy_cost` — costo energía por orden de producción
- Worker `predict-energy-windows.ts` — patrones históricos de cortes por zona/hora

---

### Sprint D — Capa comercial e inteligencia

#### `mfg_dispatch` — Despacho de Producto Terminado
- `mfg_sale_orders_mfg` — órdenes de venta con reserva automática de lotes PT
- `mfg_dispatch_orders` — guías de despacho con lotes, cantidades, temperatura transporte
- `mfg_coa` — Certificate of Analysis automático por lote de PT (PDF)

#### `mfg_hr` — RRHH Manufactura
- `mfg_workers` — operadores con turno asignado, línea, calificaciones (qué máquinas puede operar)
- `mfg_shifts` — turnos: mañana/tarde/noche con recargos LOTTT
- `mfg_labor_tracking` — HH reales por orden de producción (alimenta mfg_costs)
- `mfg_production_bonuses` — bonos por cumplimiento de cuota

#### `mfg_reports` — KPIs + AI Agent
- Dashboard: OEE, producción real vs. plan, costo variaciones, paros por categoría
- AI Agent "Director de Producción" con 6 tools

#### `mfg_portal` — Portal Cliente Industrial
- Estado de órdenes de compra
- Certificados de análisis por lote
- Historial de entregas y facturas

---

## Workflows (4 definiciones JSON)

| Workflow | Módulo | Trigger |
|---|---|---|
| `bom_approval_v1` | `mfg_bom` | Cambio de versión de BOM requiere aprobación de ingeniería |
| `nc_disposition_v1` | `mfg_quality` | No-conformidad crítica: disposición firmada por gerente de calidad |
| `purchase_authorization_v1` | `mfg_procurement` | OC de importación > USD X requiere aprobación gerente general |
| `downtime_escalation_v1` | `mfg_orders` | Paro > 2 horas sin resolución: escala a gerente de mantenimiento |

---

## Integración con módulos existentes

| Módulo existente | Integración |
|---|---|
| `venezuela_rates` | `mfg_costs`: conversión BCV para costos bimoneda en tiempo real |
| `ve_fiscal` | `mfg_dispatch`: facturación con RIF, IVA 16%, IGTF |
| `payment_methods` | `mfg_dispatch`: cobro a clientes industriales |

---

## Tablas de DB — naming completo

```
mfg_bom_headers, mfg_bom_lines, mfg_bom_alternatives, mfg_bom_versions
mfg_warehouse_locations, mfg_stock_lots, mfg_stock_movements, mfg_cycle_counts
mfg_production_orders, mfg_order_operations, mfg_work_centers
mfg_order_material_issues, mfg_production_downtimes
mfg_quality_plans, mfg_quality_inspections, mfg_nonconformances, mfg_spc_charts
mfg_production_plans, mfg_mrp_requirements, mfg_purchase_requisitions
mfg_shift_reports, mfg_oee_history
mfg_master_schedule, mfg_capacity_loads, mfg_energy_windows
mfg_cost_centers, mfg_standard_costs, mfg_cost_variances
mfg_equipment, mfg_maintenance_plans, mfg_work_orders_maint, mfg_spare_parts
mfg_suppliers, mfg_purchase_orders, mfg_import_tracking
mfg_subcontract_orders, mfg_subcontract_stock
mfg_energy_consumption, mfg_power_outages, mfg_energy_cost
mfg_sale_orders_mfg, mfg_dispatch_orders, mfg_coa
mfg_workers, mfg_shifts, mfg_labor_tracking, mfg_production_bonuses
```
