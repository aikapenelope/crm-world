# Plan de Vertical Property Management / Condominios — Aika Platform

> **Objetivo**: Sistema completo para administradoras de condominios en Venezuela.
> **Marco legal**: Ley de Propiedad Horizontal (Gaceta Oficial N° 3.241, 1983)
> **Base**: Open Mercato v0.6.1 (customers, portal, sales, planner)
> **Módulos**: 7 custom `from: '@app'`

---

## Contexto Venezuela

### Realidad del mercado
- Hay ~50,000 edificios residenciales en las principales ciudades (Caracas, Maracaibo, Valencia, Barquisimeto)
- La mayoría se administra con Excel, WhatsApp y cuadernos
- El dolor #1 es la **morosidad** (40-60% de propietarios no pagan a tiempo)
- El dolor #2 es la **comunicación** (circulares que nadie lee, asambleas sin quórum)
- El dolor #3 es la **transparencia** (propietarios desconfían de la administradora)
- Cobro en USD es la norma (condominio se cobra en dólares desde ~2020)
- WhatsApp es el canal principal de comunicación (no email)

### Marco legal (Ley de Propiedad Horizontal)
- **Alícuota**: Porcentaje de participación de cada unidad en gastos comunes (Art. 7)
- **Gastos comunes**: Todos los propietarios contribuyen según su alícuota (Art. 14)
- **Fondo de reserva**: Obligatorio, mínimo 10% del presupuesto anual (Art. 14)
- **Asamblea**: Órgano máximo de decisión (Art. 18)
- **Junta de Condominio**: Órgano ejecutivo que supervisa al administrador (Art. 18)
- **Administrador**: Responsable de gestión diaria, cobro, mantenimiento (Art. 20)
- **Morosos**: Se puede exigir judicialmente + intereses de mora (Art. 14, 39)
- **Cuotas extraordinarias**: Requieren aprobación en asamblea

### Monedas y pagos
- Condominio se cobra en USD (referencia BCV)
- Se acepta pago en VES a tasa del día
- Métodos: Pago Móvil, Zelle, Binance, Transferencia, Efectivo
- Recibo debe mostrar: monto USD, equivalente VES, tasa aplicada, fecha

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                    Open Mercato Core (ya existe)                  │
│  customers (propietarios) · portal · planner · notifications     │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Kysely + event bus
                              │
┌─────────────────────────────────────────────────────────────────┐
│                 Módulos Condominio Custom (@app)                  │
│                                                                   │
│  condo_properties   → Edificios, unidades, alícuotas, residentes │
│  condo_fees         → Cuotas, recibos, cálculo por alícuota      │
│  condo_collections  → Cobranza, morosos, aging, acuerdos pago    │
│  condo_maintenance  → Solicitudes, órdenes trabajo, proveedores  │
│  condo_accounting   → Ingresos/gastos, fondo reserva, reportes   │
│  condo_comms        → Circulares, votaciones, actas asamblea     │
│  condo_portal       → Portal propietario (estado cuenta, pagos)  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ Reutiliza
                              │
┌─────────────────────────────────────────────────────────────────┐
│              Módulos Transversales VE (ya existen)                │
│  venezuela_rates · payment_methods · ve_fiscal · bank_reconcil.  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sprint 1: condo_properties — Edificios, Unidades y Residentes

### Entidades

```typescript
// CondoBuildingEntity — Edificio/Conjunto residencial
@Entity({ tableName: 'condo_buildings' })
- id (uuid PK)
- tenant_id, organization_id
- name (text) — "Residencias Los Pinos", "Torre A"
- code (text, unique) — "PINOS", "TORRE-A"
- building_type: 'residential' | 'commercial' | 'mixed'
- address (text)
- city (text)
- state (text)
- total_units (int) — cantidad total de unidades
- total_floors (int, nullable)
- year_built (int, nullable)
- rif (text, nullable) — RIF del condominio (J-XXXXXXXX-X)
- admin_company (text, nullable) — nombre de la administradora
- document_number (text, nullable) — número documento de condominio
- common_areas (json, nullable) — ["piscina", "gym", "salón de fiestas", "estacionamiento"]
- metadata (json, nullable)
- is_active (boolean, default true)
- created_at, updated_at, deleted_at

// CondoUnitEntity — Unidad (apartamento, local, oficina)
@Entity({ tableName: 'condo_units' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- unit_number (text) — "4-A", "PB-L3", "PH-1"
- unit_type: 'apartment' | 'penthouse' | 'local' | 'office' | 'parking' | 'storage'
- floor (text, nullable) — "4", "PB", "PH"
- area_m2 (decimal, nullable) — metros cuadrados
- aliquot_percent (decimal, precision 8, scale 5) — alícuota (ej: 2.34567%)
- bedrooms (int, nullable)
- bathrooms (int, nullable)
- parking_spots (int, default 0)
- storage_units (int, default 0)
- status: 'occupied' | 'vacant' | 'for_sale' | 'for_rent'
- owner_id (uuid, nullable) — referencia a customers
- resident_id (uuid, nullable) — puede ser diferente al owner (inquilino)
- owner_name (text, nullable) — snapshot para cuando no hay customer
- owner_phone (text, nullable)
- owner_email (text, nullable)
- resident_name (text, nullable)
- resident_phone (text, nullable)
- notes (text, nullable)
- created_at, updated_at, deleted_at

// CondoCommonAreaEntity — Áreas comunes reservables
@Entity({ tableName: 'condo_common_areas' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- name (text) — "Salón de Fiestas", "Piscina", "BBQ"
- area_type: 'social' | 'sports' | 'parking' | 'garden' | 'other'
- capacity (int, nullable)
- is_reservable (boolean, default false)
- reservation_fee (decimal, nullable) — costo de reserva en USD
- rules (text, nullable) — reglas de uso
- is_active (boolean, default true)
- created_at, updated_at
```

### API Routes
- `GET/POST/PUT/DELETE /api/condo-properties/buildings` — CRUD edificios
- `GET/POST/PUT/DELETE /api/condo-properties/units` — CRUD unidades
- `GET/POST /api/condo-properties/common-areas` — áreas comunes
- `GET /api/condo-properties/dashboard` — resumen (total edificios, unidades, ocupación, alícuotas)

### UI (Backend)
- `/backend/condo_properties/` — Lista edificios (DataTable)
- `/backend/condo_properties/create/` — Crear edificio
- `/backend/condo_properties/[id]/` — Detalle edificio (tabs: unidades, áreas comunes, info)
- `/backend/condo_properties/units/` — Lista todas las unidades (filtrable por edificio)
- `/backend/condo_properties/units/create/` — Crear unidad

---

## Sprint 2: condo_fees — Cuotas y Recibos

### Entidades

```typescript
// CondoFeeConfigEntity — Configuración de cuota por edificio
@Entity({ tableName: 'condo_fee_configs' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- name (text) — "Cuota Ordinaria Junio 2026"
- fee_type: 'ordinary' | 'extraordinary' | 'special'
- period_month (text) — "2026-06"
- base_amount (decimal, precision 18, scale 2) — monto base total del edificio
- currency (text, default 'USD')
- distribution_method: 'aliquot' | 'equal' | 'custom'
- due_date (date) — fecha de vencimiento
- late_fee_percent (decimal, default 0) — recargo por mora (%)
- late_fee_days (int, default 15) — días de gracia antes de mora
- approved_in_assembly (boolean, default false)
- assembly_date (date, nullable)
- notes (text, nullable)
- status: 'draft' | 'approved' | 'generated' | 'closed'
- created_at, updated_at

// CondoReceiptEntity — Recibo individual por unidad
@Entity({ tableName: 'condo_receipts' })
- id (uuid PK)
- tenant_id, organization_id
- fee_config_id (uuid)
- building_id (uuid)
- unit_id (uuid)
- receipt_number (text) — "REC-2026-06-001"
- period_month (text) — "2026-06"
- owner_name (text) — snapshot
- unit_number (text) — snapshot
- aliquot_percent (decimal) — snapshot de la alícuota al momento
- amount_usd (decimal, precision 18, scale 2) — monto en USD
- amount_ves (decimal, precision 18, scale 2, nullable) — equivalente VES
- exchange_rate (decimal, precision 18, scale 4, nullable) — tasa aplicada
- late_fee_amount (decimal, precision 18, scale 2, default 0)
- total_amount (decimal, precision 18, scale 2) — amount + late_fee
- status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
- paid_amount (decimal, precision 18, scale 2, default 0)
- paid_at (timestamptz, nullable)
- payment_method (text, nullable)
- payment_reference (text, nullable)
- due_date (date)
- notes (text, nullable)
- created_at, updated_at

// CondoReceiptLineEntity — Desglose del recibo (gastos comunes, fondo reserva, extras)
@Entity({ tableName: 'condo_receipt_lines' })
- id (uuid PK)
- receipt_id (uuid)
- concept (text) — "Gastos comunes", "Fondo de reserva", "Vigilancia", "Ascensor"
- amount (decimal, precision 18, scale 2)
- is_common_expense (boolean, default true)
```

### API Routes
- `GET/POST/PUT /api/condo-fees/configs` — CRUD configuraciones de cuota
- `POST /api/condo-fees/generate` — Generar recibos para todas las unidades de un edificio
- `GET/PUT /api/condo-fees/receipts` — Lista/actualizar recibos
- `POST /api/condo-fees/receipts/pay` — Registrar pago de recibo

### UI (Backend)
- `/backend/condo_fees/` — Dashboard cuotas (pendientes, cobrado, morosos)
- `/backend/condo_fees/configs/` — Lista configuraciones
- `/backend/condo_fees/configs/create/` — Crear cuota (formulario con desglose)
- `/backend/condo_fees/receipts/` — Lista recibos (filtrable por período, edificio, estado)
- `/backend/condo_fees/receipts/[id]/` — Detalle recibo (registrar pago)

---

## Sprint 3: condo_collections — Cobranza y Morosos

### Entidades

```typescript
// CondoDebtorEntity — Vista de morosos (calculado)
@Entity({ tableName: 'condo_debtors' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- unit_id (uuid)
- owner_name (text)
- owner_phone (text, nullable)
- total_debt (decimal, precision 18, scale 2)
- currency (text, default 'USD')
- months_overdue (int)
- oldest_pending_date (date)
- last_payment_date (date, nullable)
- last_contact_date (date, nullable)
- contact_method (text, nullable) — 'whatsapp' | 'call' | 'letter' | 'legal'
- status: 'active' | 'agreement' | 'legal' | 'resolved'
- notes (text, nullable)
- updated_at

// CondoPaymentAgreementEntity — Acuerdo de pago para morosos
@Entity({ tableName: 'condo_payment_agreements' })
- id (uuid PK)
- tenant_id, organization_id
- unit_id (uuid)
- debtor_id (uuid)
- agreement_number (text)
- total_debt (decimal, precision 18, scale 2)
- installments (int) — número de cuotas del acuerdo
- installment_amount (decimal, precision 18, scale 2)
- currency (text, default 'USD')
- start_date (date)
- status: 'active' | 'completed' | 'defaulted' | 'cancelled'
- paid_installments (int, default 0)
- next_due_date (date, nullable)
- notes (text, nullable)
- created_at, updated_at

// CondoCollectionActionEntity — Registro de gestiones de cobro
@Entity({ tableName: 'condo_collection_actions' })
- id (uuid PK)
- tenant_id, organization_id
- unit_id (uuid)
- action_type: 'whatsapp' | 'call' | 'visit' | 'letter' | 'legal_notice' | 'assembly_report'
- action_date (timestamptz)
- performed_by (uuid, nullable)
- result: 'contacted' | 'no_answer' | 'promised_payment' | 'refused' | 'agreement_reached'
- notes (text, nullable)
- next_action_date (date, nullable)
- created_at
```

### API Routes
- `GET /api/condo-collections/debtors` — Lista morosos con aging
- `GET /api/condo-collections/debtors/summary` — Resumen de morosidad
- `POST /api/condo-collections/agreements` — Crear acuerdo de pago
- `GET/PUT /api/condo-collections/agreements` — Lista/actualizar acuerdos
- `POST /api/condo-collections/actions` — Registrar gestión de cobro
- `GET /api/condo-collections/whatsapp` — Generar mensajes de cobro por WhatsApp

### UI (Backend)
- `/backend/condo_collections/` — Dashboard morosidad (total deuda, % morosos, aging chart)
- `/backend/condo_collections/debtors/` — Lista morosos con filtros
- `/backend/condo_collections/debtors/[id]/` — Detalle moroso (historial, acuerdos, acciones)
- `/backend/condo_collections/agreements/` — Lista acuerdos de pago
- `/backend/condo_collections/whatsapp/` — Cobro masivo por WhatsApp

---

## Sprint 4: condo_maintenance — Mantenimiento y Proveedores

### Entidades

```typescript
// CondoMaintenanceRequestEntity — Solicitud de mantenimiento
@Entity({ tableName: 'condo_maintenance_requests' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- request_number (text) — "SOL-001"
- requested_by_unit_id (uuid, nullable) — unidad que reporta
- requested_by_name (text)
- requested_by_phone (text, nullable)
- category: 'plumbing' | 'electrical' | 'elevator' | 'structural' | 'cleaning' | 'security' | 'garden' | 'pool' | 'other'
- priority: 'low' | 'medium' | 'high' | 'emergency'
- title (text)
- description (text)
- location (text, nullable) — "Pasillo piso 3", "Estacionamiento nivel -1"
- status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
- assigned_to (text, nullable) — nombre del proveedor/técnico
- supplier_id (uuid, nullable)
- estimated_cost (decimal, nullable)
- actual_cost (decimal, nullable)
- currency (text, default 'USD')
- completed_at (timestamptz, nullable)
- resolution_notes (text, nullable)
- created_at, updated_at

// CondoWorkOrderEntity — Orden de trabajo para proveedor
@Entity({ tableName: 'condo_work_orders' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- order_number (text) — "OT-001"
- request_id (uuid, nullable) — referencia a solicitud
- supplier_id (uuid, nullable)
- supplier_name (text)
- description (text)
- scheduled_date (date, nullable)
- status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
- quoted_amount (decimal, nullable)
- approved_amount (decimal, nullable)
- final_amount (decimal, nullable)
- currency (text, default 'USD')
- approved_by (uuid, nullable)
- completed_at (timestamptz, nullable)
- notes (text, nullable)
- created_at, updated_at

// CondoSupplierEntity — Proveedor de servicios
@Entity({ tableName: 'condo_suppliers' })
- id (uuid PK)
- tenant_id, organization_id
- name (text)
- rif (text, nullable)
- specialty: 'plumbing' | 'electrical' | 'elevator' | 'cleaning' | 'security' | 'garden' | 'pool' | 'general' | 'other'
- phone (text, nullable)
- email (text, nullable)
- address (text, nullable)
- rating (int, nullable) — 1-5
- notes (text, nullable)
- is_active (boolean, default true)
- created_at, updated_at
```

### API Routes
- `GET/POST/PUT /api/condo-maintenance/requests` — CRUD solicitudes
- `GET/POST/PUT /api/condo-maintenance/work-orders` — CRUD órdenes de trabajo
- `GET/POST/PUT /api/condo-maintenance/suppliers` — CRUD proveedores
- `GET /api/condo-maintenance/dashboard` — KPIs mantenimiento

### UI (Backend)
- `/backend/condo_maintenance/` — Dashboard (solicitudes abiertas, en progreso, costos)
- `/backend/condo_maintenance/requests/` — Lista solicitudes
- `/backend/condo_maintenance/requests/create/` — Crear solicitud
- `/backend/condo_maintenance/requests/[id]/` — Detalle (asignar, completar)
- `/backend/condo_maintenance/work-orders/` — Lista órdenes de trabajo
- `/backend/condo_maintenance/suppliers/` — Lista proveedores

---

## Sprint 5: condo_accounting — Contabilidad del Condominio

### Entidades

```typescript
// CondoAccountingEntryEntity — Movimiento contable
@Entity({ tableName: 'condo_accounting_entries' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- entry_type: 'income' | 'expense'
- category: 'condo_fee' | 'extraordinary' | 'reserve_fund' | 'maintenance' | 'utilities' | 'payroll' | 'insurance' | 'legal' | 'other'
- description (text)
- amount (decimal, precision 18, scale 2)
- currency (text, default 'USD')
- exchange_rate (decimal, nullable)
- reference_type (text, nullable) — 'receipt' | 'work_order' | 'manual'
- reference_id (uuid, nullable)
- entry_date (date)
- period_month (text) — "2026-06"
- supplier_name (text, nullable)
- document_number (text, nullable) — factura, recibo
- is_reserve_fund (boolean, default false)
- notes (text, nullable)
- recorded_by (uuid, nullable)
- created_at, updated_at

// CondoReserveFundEntity — Control del fondo de reserva
@Entity({ tableName: 'condo_reserve_fund' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- period_month (text)
- opening_balance (decimal, precision 18, scale 2)
- contributions (decimal, precision 18, scale 2, default 0)
- withdrawals (decimal, precision 18, scale 2, default 0)
- closing_balance (decimal, precision 18, scale 2)
- currency (text, default 'USD')
- min_required (decimal, nullable) — 10% del presupuesto anual
- notes (text, nullable)
- created_at, updated_at

// CondoBudgetEntity — Presupuesto anual
@Entity({ tableName: 'condo_budgets' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- year (int) — 2026
- status: 'draft' | 'approved' | 'active' | 'closed'
- total_income (decimal, precision 18, scale 2)
- total_expenses (decimal, precision 18, scale 2)
- reserve_fund_percent (decimal, default 10)
- currency (text, default 'USD')
- approved_in_assembly (boolean, default false)
- assembly_date (date, nullable)
- notes (text, nullable)
- created_at, updated_at
```

### API Routes
- `GET/POST /api/condo-accounting/entries` — CRUD movimientos
- `GET /api/condo-accounting/summary` — Resumen por período (ingresos vs gastos)
- `GET /api/condo-accounting/reserve-fund` — Estado del fondo de reserva
- `GET/POST /api/condo-accounting/budgets` — Presupuestos
- `GET /api/condo-accounting/report` — Reporte para asamblea (PDF-ready)

### UI (Backend)
- `/backend/condo_accounting/` — Dashboard financiero (ingresos, gastos, fondo reserva)
- `/backend/condo_accounting/entries/` — Lista movimientos
- `/backend/condo_accounting/entries/create/` — Registrar ingreso/gasto
- `/backend/condo_accounting/reserve-fund/` — Estado fondo de reserva
- `/backend/condo_accounting/budgets/` — Presupuestos anuales
- `/backend/condo_accounting/report/` — Reporte para asamblea

---

## Sprint 6: condo_comms — Comunicaciones y Asambleas

### Entidades

```typescript
// CondoCircularEntity — Circular/Aviso
@Entity({ tableName: 'condo_circulars' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- circular_number (text) — "CIRC-2026-015"
- title (text)
- content (text) — contenido en markdown/texto
- category: 'general' | 'maintenance' | 'security' | 'assembly' | 'payment' | 'rules' | 'emergency'
- priority: 'normal' | 'important' | 'urgent'
- published_at (timestamptz, nullable)
- expires_at (timestamptz, nullable)
- send_whatsapp (boolean, default false)
- total_recipients (int, default 0)
- total_read (int, default 0)
- created_by (uuid, nullable)
- status: 'draft' | 'published' | 'expired'
- created_at, updated_at

// CondoVoteEntity — Votación/Consulta
@Entity({ tableName: 'condo_votes' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- title (text)
- description (text)
- vote_type: 'yes_no' | 'multiple_choice' | 'ranking'
- options (json) — ["Sí", "No"] o ["Opción A", "Opción B", "Opción C"]
- requires_quorum (boolean, default true)
- quorum_percent (decimal, default 50) — % de alícuota necesario
- status: 'draft' | 'open' | 'closed' | 'cancelled'
- opens_at (timestamptz)
- closes_at (timestamptz)
- results (json, nullable) — resultados tabulados
- total_votes (int, default 0)
- total_aliquot_voted (decimal, default 0) — % de alícuota que votó
- created_at, updated_at

// CondoVoteCastEntity — Voto individual
@Entity({ tableName: 'condo_vote_casts' })
- id (uuid PK)
- vote_id (uuid)
- unit_id (uuid)
- choice (text) — la opción elegida
- aliquot_weight (decimal) — peso del voto según alícuota
- cast_at (timestamptz)

// CondoAssemblyEntity — Acta de asamblea
@Entity({ tableName: 'condo_assemblies' })
- id (uuid PK)
- tenant_id, organization_id
- building_id (uuid)
- assembly_number (text) — "ASA-2026-002"
- assembly_type: 'ordinary' | 'extraordinary'
- title (text)
- date (date)
- start_time (text, nullable)
- end_time (text, nullable)
- location (text, nullable)
- quorum_present (decimal, nullable) — % alícuota presente
- attendees_count (int, default 0)
- agenda (json, nullable) — puntos del orden del día
- minutes (text, nullable) — acta en texto
- decisions (json, nullable) — decisiones tomadas
- status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
- created_at, updated_at
```

### API Routes
- `GET/POST/PUT /api/condo-comms/circulars` — CRUD circulares
- `POST /api/condo-comms/circulars/send` — Enviar circular (marcar como publicada)
- `GET/POST /api/condo-comms/votes` — CRUD votaciones
- `POST /api/condo-comms/votes/cast` — Emitir voto
- `GET /api/condo-comms/votes/results` — Resultados
- `GET/POST /api/condo-comms/assemblies` — CRUD asambleas

### UI (Backend)
- `/backend/condo_comms/` — Dashboard comunicaciones
- `/backend/condo_comms/circulars/` — Lista circulares
- `/backend/condo_comms/circulars/create/` — Crear circular
- `/backend/condo_comms/votes/` — Lista votaciones
- `/backend/condo_comms/votes/create/` — Crear votación
- `/backend/condo_comms/votes/[id]/` — Resultados votación
- `/backend/condo_comms/assemblies/` — Lista asambleas
- `/backend/condo_comms/assemblies/create/` — Crear acta

---

## Sprint 7: condo_portal — Portal del Propietario

### Páginas Frontend (públicas, requireAuth: false con token)

```
/(frontend)/condominio/[buildingSlug]/
├── page.tsx                    — Login del propietario (por unidad + clave)
├── dashboard/page.tsx          — Resumen: saldo, próximo pago, avisos
├── receipts/page.tsx           — Historial de recibos y pagos
├── receipts/[id]/page.tsx      — Detalle recibo (descargar, reportar pago)
├── maintenance/page.tsx        — Mis solicitudes de mantenimiento
├── maintenance/create/page.tsx — Crear solicitud
├── circulars/page.tsx          — Circulares y avisos
├── votes/page.tsx              — Votaciones activas
├── votes/[id]/page.tsx         — Votar
├── documents/page.tsx          — Documentos (actas, presupuestos, reglamento)
└── account/page.tsx            — Mi información, cambiar clave
```

### Funcionalidades del portal
- Ver estado de cuenta (deuda actual, historial de pagos)
- Reportar pago (subir comprobante, referencia)
- Crear solicitud de mantenimiento
- Leer circulares (con tracking de lectura)
- Participar en votaciones
- Descargar documentos (actas, presupuestos)
- Ver información de su unidad

---

## Integraciones con Módulos Existentes

| Módulo Condo | Lee de... | Escribe en... |
|---|---|---|
| condo_properties | customers (propietarios) | condo_buildings, condo_units, condo_common_areas |
| condo_fees | condo_units (alícuotas), venezuela_rates (tasa) | condo_fee_configs, condo_receipts |
| condo_collections | condo_receipts (pendientes) | condo_debtors, condo_payment_agreements |
| condo_maintenance | condo_buildings, condo_units | condo_maintenance_requests, condo_work_orders |
| condo_accounting | condo_receipts (ingresos), condo_work_orders (gastos) | condo_accounting_entries, condo_reserve_fund |
| condo_comms | condo_units (destinatarios) | condo_circulars, condo_votes, condo_assemblies |
| condo_portal | todos los anteriores (lectura) | condo_maintenance_requests (crear), condo_vote_casts |

---

## Diferenciadores vs Competencia

| Feature | gCon | elCondominio | **Aika Condo** |
|---------|------|-------------|----------------|
| Multi-moneda USD/VES | Parcial | No | **Sí** (tasa BCV automática) |
| WhatsApp cobro | No | No | **Sí** (wa.me links masivos) |
| Portal propietario | Sí | Básico | **Sí** (completo + votaciones) |
| Votaciones online | No | No | **Sí** (ponderadas por alícuota) |
| Integración fiscal VE | No | No | **Sí** (IVA, retenciones, libros) |
| Fondo de reserva | Manual | Manual | **Automático** (10% configurable) |
| Acuerdos de pago | No | No | **Sí** (cuotas, seguimiento) |
| Reportes para asamblea | PDF básico | No | **Sí** (completo, multi-período) |
| Solicitudes mantenimiento | No | Básico | **Sí** (workflow completo) |
| Multi-edificio | No | Sí | **Sí** (administradora gestiona N edificios) |

---

## Reglas de Implementación

Mismas reglas de Chainlock (PATTERNS.md):
1. `@Property()` con `type:` explícito
2. `di.ts` con `export function register`
3. `makeCrudRoute` con `mapToEntity` + `applyToEntity`
4. `createModuleEvents` con `moduleId:`
5. API custom: `(request: Request, ctx: any)` con `ctx.container.resolve('em')`
6. `page.meta.ts` con `React.createElement('svg', ...)`
7. Colores semánticos (NO hardcoded)
8. i18n: `es.json` + `en.json`
9. Comunicación entre módulos: Kysely + event bus

---

## Notas Técnicas

- **Multi-edificio**: Una administradora gestiona múltiples edificios. El `building_id` es el filtro principal.
- **Alícuota**: Se almacena como decimal con 5 decimales (ej: 2.34567%). La suma de todas las alícuotas de un edificio DEBE ser 100%.
- **Recibos**: Se generan en batch (un click genera recibos para todas las unidades del edificio).
- **Tasa de cambio**: Se toma de `venezuela_rates` al momento de generar el recibo.
- **Morosos**: Se calculan automáticamente basado en recibos con status 'overdue'.
- **Votaciones**: El peso del voto es proporcional a la alícuota (Art. 23 LPH).
- **Fondo de reserva**: Se alimenta automáticamente con el % configurado de cada cuota cobrada.
