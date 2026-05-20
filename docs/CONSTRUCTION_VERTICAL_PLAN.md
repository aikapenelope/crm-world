# Plan de Vertical Construcción — Aika Platform

> **Objetivo**: Sistema completo para empresas constructoras en Venezuela y el mercado global.
> **Benchmark**: Procore (mercado US), ProyecPro (LatAm), prácticas del CIV (Venezuela)
> **Base**: Open Mercato v0.6.1 (customers, sales, catalog, attachments, workflows)
> **Módulos**: 8 custom `from: '@app'`

---

## Contexto

### Venezuela
- Las obras se contratan en USD desde 2020 (resolución BCV)
- Los pagos se hacen por **valuaciones** (cobros parciales por avance real medido)
- Los presupuestos usan **APU** (Análisis de Precios Unitarios): material + MO + equipo
- Las obras largas requieren **índices de actualización** por inflación
- Los entes públicos exigen **actas** firmadas (inicio, recepción parcial, recepción final)
- El contratista retiene 5-10% como **garantía de fiel cumplimiento**
- El anticipo se garantiza con una fianza o retención escalonada

### Mercado US / Global
- **RFIs** (Requests for Information): consultas técnicas formales entre obra-proyectista-cliente
- **Submittals**: aprobación de materiales/equipos antes de instalar
- **Change Orders**: órdenes de cambio con flujo de aprobación y ajuste presupuestal
- **Punch List**: lista de defectos para cierre de obra
- **Daily Logs**: reporte diario con personal, equipos, clima, avances
- **Schedule of Values**: cronograma de cobros vinculado al avance
- **Lien Waivers**: liberaciones de garantía al pagar subcontratistas

---

## Módulos

### Sprint 1: const_projects — Proyectos

```typescript
// ConstProjectEntity
@Entity({ tableName: 'const_projects' })
- id (uuid PK)
- tenant_id, organization_id
- name (text) — "Torre Residencial Los Pinos"
- code (text, unique) — "PINOS-2026"
- project_type: 'residential' | 'commercial' | 'infrastructure' | 'industrial' | 'renovation'
- status: 'prospect' | 'bidding' | 'awarded' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
- client_id (uuid, nullable) — ref customers
- client_name (text) — snapshot
- client_type: 'private' | 'public'
- location (text)
- city (text)
- state (text)
- contract_number (text, nullable)
- contract_type: 'fixed_price' | 'unit_price' | 'cost_plus' | 'design_build'
- contract_amount (decimal 18,2)
- currency (text, default 'USD')
- start_date (date, nullable)
- planned_end_date (date, nullable)
- actual_end_date (date, nullable)
- advance_percent (decimal 5,2, default 0) — anticipo %
- retention_percent (decimal 5,2, default 10) — retención %
- overall_progress (decimal 5,2, default 0) — % avance calculado
- project_manager (text, nullable)
- site_supervisor (text, nullable)
- description (text, nullable)
- notes (text, nullable)
- metadata (json, nullable)
- created_at, updated_at, deleted_at
```

**API Routes:**
- `GET/POST/PUT/DELETE /api/const-projects/projects`
- `GET /api/const-projects/dashboard` — KPIs: proyectos activos, monto total, avance, cobros pendientes

**UI Backend:**
- `/backend/const_projects/` — Lista proyectos con KPIs globales
- `/backend/const_projects/create/` — Crear proyecto
- `/backend/const_projects/[id]/` — Detalle proyecto (tabs: resumen, presupuesto, cronograma, valuaciones, RFIs, subcontratistas)

---

### Sprint 2: const_budget — Presupuesto y APU

```typescript
// ConstBudgetItemEntity — Partida presupuestaria (APU)
@Entity({ tableName: 'const_budget_items' })
- id (uuid PK)
- tenant_id, organization_id
- project_id (uuid)
- parent_id (uuid, nullable) — para capítulos/subcapítulos
- item_number (text) — "01.02.03"
- level (int, default 0) — 0=capítulo, 1=subcapítulo, 2=partida
- name (text)
- unit (text, nullable) — m², m³, ml, kg, un, gl
- quantity (decimal 12,4)
- unit_cost (decimal 18,4) — costo unitario total (suma de insumos)
- total_cost (decimal 18,2) — quantity * unit_cost
- currency (text, default 'USD')
- category: 'civil' | 'electrical' | 'mechanical' | 'architectural' | 'special' | 'general'
- sort_order (int, default 0)
- is_chapter (boolean, default false)
- notes (text, nullable)
- created_at, updated_at

// ConstBudgetResourceEntity — Insumo de APU (material/MO/equipo)
@Entity({ tableName: 'const_budget_resources' })
- id (uuid PK)
- budget_item_id (uuid)
- resource_type: 'material' | 'labor' | 'equipment' | 'subcontract' | 'overhead'
- name (text)
- unit (text)
- quantity (decimal 12,4)
- unit_price (decimal 18,4)
- total (decimal 18,2)
- currency (text, default 'USD')
- sort_order (int, default 0)
```

**API Routes:**
- `GET/POST/PUT/DELETE /api/const-budget/items` — CRUD partidas
- `GET/POST/PUT/DELETE /api/const-budget/resources` — CRUD insumos APU
- `GET /api/const-budget/summary` — Resumen por capítulo
- `POST /api/const-budget/import-template` — Importar plantilla de partidas

**UI Backend:**
- `/backend/const_budget/` — Árbol presupuestal (capítulos → subcapítulos → partidas)
- `/backend/const_budget/create/` — Crear/editar partida con APU inline

---

### Sprint 3: const_schedule — Cronograma

```typescript
// ConstTaskEntity — Tarea del cronograma
@Entity({ tableName: 'const_tasks' })
- id (uuid PK)
- tenant_id, organization_id
- project_id (uuid)
- parent_id (uuid, nullable)
- task_number (text) — "1.2.3"
- name (text)
- level (int, default 0)
- status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
- planned_start (date)
- planned_end (date)
- actual_start (date, nullable)
- actual_end (date, nullable)
- duration_days (int)
- progress_percent (decimal 5,2, default 0)
- assigned_to (text, nullable)
- is_milestone (boolean, default false)
- is_critical (boolean, default false) — ruta crítica
- predecessor_ids (json, nullable) — IDs de tareas predecesoras
- budget_item_id (uuid, nullable) — vínculo con partida presupuestal
- notes (text, nullable)
- sort_order (int, default 0)
- created_at, updated_at

// ConstMilestoneEntity — Hito del proyecto
@Entity({ tableName: 'const_milestones' })
- id (uuid PK)
- tenant_id, organization_id
- project_id (uuid)
- name (text) — "Fundaciones completas", "Entrega de obra"
- milestone_type: 'start' | 'delivery' | 'payment' | 'inspection' | 'permit' | 'other'
- planned_date (date)
- actual_date (date, nullable)
- status: 'upcoming' | 'at_risk' | 'achieved' | 'delayed'
- linked_valuation (boolean, default false) — dispara valuación
- notes (text, nullable)
- created_at, updated_at
```

**API Routes:**
- `GET/POST/PUT/DELETE /api/const-schedule/tasks`
- `GET/POST/PUT/DELETE /api/const-schedule/milestones`
- `GET /api/const-schedule/gantt` — Datos para Gantt chart (tareas + dependencias)

**UI Backend:**
- `/backend/const_schedule/` — Vista Gantt + lista de tareas
- `/backend/const_schedule/milestones/` — Hitos del proyecto

---

### Sprint 4: const_progress — Valuaciones y Cobros

```typescript
// ConstValuationEntity — Valuación (cobro parcial por avance)
@Entity({ tableName: 'const_valuations' })
- id (uuid PK)
- tenant_id, organization_id
- project_id (uuid)
- valuation_number (text) — "VAL-001"
- period_from (date)
- period_to (date)
- status: 'draft' | 'submitted' | 'approved' | 'invoiced' | 'paid' | 'rejected'
- total_contract (decimal 18,2) — monto total del contrato
- previous_billed (decimal 18,2) — cobrado en valuaciones anteriores
- current_period (decimal 18,2) — cobro esta valuación
- retention_amount (decimal 18,2) — retención aplicada
- advance_deduction (decimal 18,2) — amortización del anticipo
- net_payable (decimal 18,2) — monto neto a pagar
- exchange_rate (decimal 18,4, nullable) — tasa BCV aplicada
- amount_ves (decimal 18,2, nullable) — equivalente VES
- currency (text, default 'USD')
- submitted_at (timestamptz, nullable)
- approved_at (timestamptz, nullable)
- approved_by (text, nullable)
- invoice_number (text, nullable)
- notes (text, nullable)
- created_at, updated_at

// ConstValuationLineEntity — Línea de valuación por partida
@Entity({ tableName: 'const_valuation_lines' })
- id (uuid PK)
- valuation_id (uuid)
- budget_item_id (uuid)
- item_number (text) — snapshot
- item_name (text) — snapshot
- unit (text)
- contracted_quantity (decimal 12,4)
- unit_price (decimal 18,4)
- previous_quantity (decimal 12,4, default 0) — cantidad acumulada anterior
- current_quantity (decimal 12,4, default 0) — cantidad esta valuación
- current_amount (decimal 18,2) — current_quantity * unit_price
- accumulated_percent (decimal 5,2) — % acumulado sobre contrato
- created_at, updated_at
```

**API Routes:**
- `GET/POST/PUT /api/const-progress/valuations`
- `GET/POST/PUT /api/const-progress/valuation-lines`
- `POST /api/const-progress/valuations/submit` — Enviar para aprobación
- `POST /api/const-progress/valuations/approve`

**UI Backend:**
- `/backend/const_progress/` — Lista valuaciones (estado, monto, % cobrado)
- `/backend/const_progress/create/` — Crear valuación con tabla de partidas y avances
- `/backend/const_progress/[id]/` — Detalle valuación (aprobación, retenciones)

---

### Sprint 5: const_rfis — RFIs y Submittals

```typescript
// ConstRFIEntity — Request for Information
@Entity({ tableName: 'const_rfis' })
- id (uuid PK)
- tenant_id, organization_id
- project_id (uuid)
- rfi_number (text) — "RFI-001"
- subject (text)
- description (text)
- discipline: 'civil' | 'architectural' | 'structural' | 'electrical' | 'mechanical' | 'plumbing' | 'other'
- priority: 'low' | 'normal' | 'high' | 'urgent'
- status: 'open' | 'pending_response' | 'answered' | 'closed' | 'void'
- submitted_by (text)
- assigned_to (text, nullable) — proyectista/ingeniero que debe responder
- due_date (date, nullable)
- answered_at (timestamptz, nullable)
- answer (text, nullable)
- cost_impact (decimal 18,2, nullable) — impacto en costo (si hay)
- schedule_impact_days (int, nullable) — impacto en días
- linked_drawing (text, nullable) — número de plano relacionado
- created_at, updated_at

// ConstSubmittalEntity — Submittal (aprobación de materiales)
@Entity({ tableName: 'const_submittals' })
- id (uuid PK)
- tenant_id, organization_id
- project_id (uuid)
- submittal_number (text) — "SUB-001"
- title (text)
- spec_section (text, nullable) — sección de la especificación técnica
- submittal_type: 'shop_drawing' | 'product_data' | 'sample' | 'calculation' | 'certificate' | 'test_report'
- status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'approved_as_noted' | 'revise_resubmit' | 'rejected'
- submitted_by (text)
- reviewer (text, nullable)
- submitted_at (date, nullable)
- due_date (date, nullable)
- reviewed_at (date, nullable)
- review_notes (text, nullable)
- revision_number (int, default 1)
- created_at, updated_at
```

**API Routes:**
- `GET/POST/PUT /api/const-rfis/rfis`
- `GET/POST/PUT /api/const-rfis/submittals`
- `POST /api/const-rfis/rfis/answer`

**UI Backend:**
- `/backend/const_rfis/` — Dashboard RFIs (abiertos, vencidos, respondidos)
- `/backend/const_rfis/submittals/` — Lista submittals

---

### Sprint 6: const_daily — Reporte Diario de Obra

```typescript
// ConstDailyReportEntity — Reporte diario
@Entity({ tableName: 'const_daily_reports' })
- id (uuid PK)
- tenant_id, organization_id
- project_id (uuid)
- report_date (date, unique per project)
- report_number (text) — "RDO-001"
- weather: 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'foggy'
- temperature_high (int, nullable)
- temperature_low (int, nullable)
- work_hours (decimal 4,1, default 8)
- status: 'draft' | 'submitted' | 'approved'
- overall_notes (text, nullable)
- safety_incidents (int, default 0)
- safety_notes (text, nullable)
- submitted_by (text, nullable)
- created_at, updated_at

// ConstDailyLaborEntity — Personal en obra por día
@Entity({ tableName: 'const_daily_labor' })
- id (uuid PK)
- report_id (uuid)
- trade (text) — "Albañil", "Electricista", "Carpintero"
- headcount (int)
- hours_worked (decimal 5,1)
- contractor_name (text, nullable) — si es subcontratista
- notes (text, nullable)

// ConstDailyActivityEntity — Actividades realizadas en el día
@Entity({ tableName: 'const_daily_activities' })
- id (uuid PK)
- report_id (uuid)
- task_id (uuid, nullable) — vínculo con cronograma
- area (text) — "Piso 3", "Fundación Eje C"
- description (text)
- quantity (decimal 12,4, nullable)
- unit (text, nullable)
- percent_complete (decimal 5,2, nullable)
```

**API Routes:**
- `GET/POST/PUT /api/const-daily/reports`
- `GET/POST /api/const-daily/labor`
- `GET/POST /api/const-daily/activities`

**UI Backend:**
- `/backend/const_daily/` — Lista reportes diarios con calendario
- `/backend/const_daily/create/` — Crear reporte (formulario con personal, equipos, actividades)
- `/backend/const_daily/[id]/` — Detalle reporte diario

---

### Sprint 7: const_subcon — Subcontratistas

```typescript
// ConstSubcontractorEntity — Subcontratista
@Entity({ tableName: 'const_subcontractors' })
- id (uuid PK)
- tenant_id, organization_id
- name (text)
- rif (text, nullable)
- specialty: 'excavation' | 'concrete' | 'steel' | 'masonry' | 'electrical' | 'mechanical' | 'plumbing' | 'hvac' | 'finishing' | 'landscaping' | 'other'
- contact_name (text, nullable)
- phone (text, nullable)
- email (text, nullable)
- rating (int, nullable) — 1-5
- is_active (boolean, default true)
- notes (text, nullable)
- created_at, updated_at

// ConstSubcontractEntity — Contrato de subcontrato
@Entity({ tableName: 'const_subcontracts' })
- id (uuid PK)
- tenant_id, organization_id
- project_id (uuid)
- subcontractor_id (uuid)
- subcontractor_name (text) — snapshot
- contract_number (text)
- scope_description (text)
- contract_amount (decimal 18,2)
- retention_percent (decimal 5,2, default 10)
- currency (text, default 'USD')
- start_date (date, nullable)
- end_date (date, nullable)
- status: 'draft' | 'active' | 'completed' | 'terminated'
- amount_paid (decimal 18,2, default 0)
- notes (text, nullable)
- created_at, updated_at

// ConstSubcontractPaymentEntity — Pago a subcontratista
@Entity({ tableName: 'const_subcontract_payments' })
- id (uuid PK)
- subcontract_id (uuid)
- payment_number (text)
- period_description (text)
- gross_amount (decimal 18,2)
- retention_amount (decimal 18,2)
- net_amount (decimal 18,2)
- status: 'pending' | 'approved' | 'paid'
- payment_date (date, nullable)
- notes (text, nullable)
- created_at, updated_at
```

**API Routes:**
- `GET/POST/PUT /api/const-subcon/subcontractors`
- `GET/POST/PUT /api/const-subcon/contracts`
- `GET/POST /api/const-subcon/payments`

**UI Backend:**
- `/backend/const_subcon/` — Lista subcontratistas con rating
- `/backend/const_subcon/contracts/` — Contratos por proyecto
- `/backend/const_subcon/payments/` — Pagos y retenciones

---

### Sprint 8: const_materials — Control de Materiales

```typescript
// ConstMaterialOrderEntity — Orden de compra de material
@Entity({ tableName: 'const_material_orders' })
- id (uuid PK)
- tenant_id, organization_id
- project_id (uuid)
- order_number (text) — "OC-001"
- supplier_name (text)
- supplier_rif (text, nullable)
- status: 'draft' | 'sent' | 'confirmed' | 'partial_received' | 'received' | 'cancelled'
- order_date (date)
- expected_delivery (date, nullable)
- total_amount (decimal 18,2)
- currency (text, default 'USD')
- notes (text, nullable)
- created_at, updated_at

// ConstMaterialOrderLineEntity — Línea de OC
@Entity({ tableName: 'const_material_order_lines' })
- id (uuid PK)
- order_id (uuid)
- budget_item_id (uuid, nullable) — vínculo con partida
- material_name (text)
- unit (text)
- ordered_quantity (decimal 12,4)
- received_quantity (decimal 12,4, default 0)
- unit_price (decimal 18,4)
- total_price (decimal 18,2)

// ConstMaterialStockEntity — Inventario en obra
@Entity({ tableName: 'const_material_stock' })
- id (uuid PK)
- tenant_id, organization_id
- project_id (uuid)
- material_name (text)
- unit (text)
- budget_quantity (decimal 12,4) — del presupuesto
- ordered_quantity (decimal 12,4, default 0)
- received_quantity (decimal 12,4, default 0)
- consumed_quantity (decimal 12,4, default 0)
- available_quantity (decimal 12,4) — received - consumed
- unit_cost (decimal 18,4)
- currency (text, default 'USD')
- updated_at
```

**API Routes:**
- `GET/POST/PUT /api/const-materials/orders`
- `GET/POST /api/const-materials/order-lines`
- `GET /api/const-materials/stock` — Inventario con desvíos vs presupuesto
- `POST /api/const-materials/receive` — Registrar recepción de material

**UI Backend:**
- `/backend/const_materials/` — Dashboard materiales (stock, pendiente, desvíos)
- `/backend/const_materials/orders/` — Órdenes de compra
- `/backend/const_materials/orders/create/` — Crear OC

---

## AI Agent (const_projects.director_assistant)

Tools:
- `const.get_project_overview` — Resumen de proyecto (avance, cobros, RFIs abiertos)
- `const.get_overdue_rfis` — RFIs sin respuesta pasados del due_date
- `const.get_budget_vs_actual` — Comparar presupuesto vs costo real
- `const.get_pending_valuations` — Valuaciones pendientes de cobro
- `const.get_material_alerts` — Materiales por debajo del nivel mínimo

Suggestions:
- "¿Cómo va el proyecto Los Pinos?"
- "¿Qué RFIs están vencidos?"
- "¿Cuánto hemos cobrado vs el contrato?"
- "Alerta de materiales críticos"

---

## Workers Automáticos

- `detect-overdue-rfis` — Diario: marca RFIs vencidos y notifica al PM
- `update-project-progress` — Semanal: recalcula % avance global desde tareas
- `material-reorder-alerts` — Diario: detecta materiales bajo nivel mínimo

---

## Integraciones con módulos OM existentes

| Módulo Construcción | Lee de... | Usa de... |
|---|---|---|
| const_projects | customers (clientes/dueños de obra) | — |
| const_budget | catalog (materiales como products) | — |
| const_progress | venezuela_rates (tasa BCV para VES) | — |
| const_progress | payment_methods (métodos de cobro VE) | — |
| Todos | attachments (planos, fotos, actas) | — |
| Todos | workflows (aprobaciones) | — |
| Todos | notifications | — |

---

## Diferenciadores vs Competencia

| Feature | ProyecPro | Construdata | **Aika Construcción** |
|---|---|---|---|
| Multi-moneda USD/VES | Parcial | No | **Sí (tasa BCV automática)** |
| APU integrado | Sí | Sí | **Sí (con recursos)** |
| Portal del cliente | No | No | **Sí (vía customer_accounts)** |
| AI Director de Obra | No | No | **Sí (7 tools)** |
| Daily Reports digital | No | No | **Sí (campo + foto)** |
| WhatsApp integration | No | No | **Sí (wa.me notificaciones)** |
| Valuaciones con retención | Sí | Sí | **Sí (automático)** |
| Fiscal VE (IVA, retenciones) | No | No | **Sí (ve_fiscal module)** |

---

## Reglas de Implementación

Mismas reglas Chainlock (PATTERNS.md):
1. `@Property()` con `type:` explícito
2. `di.ts` con `export function register`
3. `makeCrudRoute` con `mapToEntity` + `applyToEntity`
4. `createModuleEvents` con `moduleId:`
5. API custom: `(request: Request, ctx: any)` con `ctx.container.resolve('em')`
6. `page.meta.ts` con `React.createElement('svg', ...)`
7. Colores semánticos (NO hardcoded)
8. i18n: `es.json` + `en.json`
9. Comunicación entre módulos: Kysely + event bus
