# Vertical Distribuidoras — Plan Completo

> Plan de implementación para la vertical de distribuidoras en Venezuela.
> Prioridad #1 del roadmap después de los módulos fiscales transversales.

---

## Contexto del Negocio

Una distribuidora en Venezuela:
- Compra productos al mayor (importados o nacionales)
- Los almacena en bodega
- Los vende a crédito (15, 30, 60 días) a comercios, farmacias, ferreterías, etc.
- Tiene vendedores que visitan clientes por rutas fijas (lunes = zona norte, etc.)
- Despacha con vehículos propios o terceros
- Cobra en múltiples monedas (USD, VES, Zelle, Pago Móvil, USDT)
- El pain #1 es el control de cuentas por cobrar (quién debe, cuánto, desde cuándo)

---

## Módulos Core Reutilizados (ya activos, NO hay que construir)

| Módulo Core | Qué provee para distribuidoras |
|---|---|
| `catalog` | Productos, variantes, SKUs, categorías, precios, unidades de medida |
| `sales` | Órdenes, cotizaciones, facturas, notas de crédito, pagos, envíos, líneas |
| `customers` | CRM de clientes (personas/empresas), pipeline, actividades |
| `currencies` | Multi-moneda (USD/VES/EUR/USDT) |
| `shipping_carriers` | Carriers de envío |
| `workflows` | Automatización de procesos |
| `notifications` | Notificaciones in-app |
| `portal` + `customer_accounts` | Portal de clientes con auth |
| `planner` | Calendario y planificación |
| `attachments` | Documentos adjuntos |

### Módulos fiscales VE (ya construidos, aplican directamente)

| Módulo | Uso en distribuidoras |
|---|---|
| `ve_fiscal` | RIF de clientes, IVA, IGTF, contribuyente especial |
| `ve_tax_books` | Libro de ventas (obligatorio para declarar IVA) |
| `ve_withholdings` | Retenciones IVA/ISLR (distribuidoras suelen ser agentes) |
| `ve_tax_reports` | Reportes para el contador |
| `bank_reconciliation` | Conciliar pagos recibidos con extracto bancario |
| `payment_methods` | 7 métodos de pago VE |
| `venezuela_rates` | Tasas de cambio BCV + paralelo |

---

## Módulos Custom a Construir (8 módulos)

### Sprint 1: `dist_credit` — Crédito y Cuentas por Cobrar (PAIN #1)

**Propósito**: Controlar el crédito otorgado a clientes. Saber quién debe, cuánto, y desde cuándo. Bloquear pedidos si el cliente excede su límite.

**Entidades:**

```
dist_credit_limits
├── id, tenant_id, organization_id
├── customer_id (UUID → customers module)
├── credit_limit (monto máximo de crédito)
├── currency (USD por defecto)
├── payment_terms_days (15, 30, 60, 90)
├── status: 'active' | 'suspended' | 'blocked'
├── approved_by (UUID → auth user)
├── approved_at
├── notes
├── created_at, updated_at, deleted_at

dist_credit_transactions
├── id, tenant_id, organization_id
├── customer_id
├── type: 'invoice' | 'payment' | 'credit_note' | 'adjustment'
├── reference_type: 'sales_invoice' | 'sales_payment' | 'sales_credit_memo' | 'manual'
├── reference_id (UUID → sales module entity)
├── amount (positivo = deuda, negativo = abono)
├── currency, exchange_rate
├── balance_after (saldo después de esta transacción)
├── due_date (fecha de vencimiento)
├── description
├── created_at, updated_at
```

**Funcionalidades:**
- Asignar límite de crédito por cliente
- Estado de cuenta en tiempo real (saldo = sum de transacciones)
- Bloquear pedidos si saldo > límite
- Reporte de antigüedad de saldos (aging: 0-30, 31-60, 61-90, 90+)
- Alertas de vencimiento (notificaciones)
- WhatsApp cobro (adaptar patrón de tuition)
- Worker de morosos (adaptar overdue-checker de tuition)

**UI:**
- Lista de clientes con saldo/límite/estado
- Detalle de estado de cuenta por cliente
- Formulario para asignar/editar límite
- Reporte aging (tabla con columnas por rango de días)
- Página de cobro WhatsApp (como tuition/cobro)

---

### Sprint 2: `dist_price_lists` — Listas de Precios

**Propósito**: Manejar múltiples listas de precios (mayorista, detallista, especial) y descuentos por volumen.

**Entidades:**

```
dist_price_lists
├── id, tenant_id, organization_id
├── name (ej: "Mayorista", "Detallista", "Especial Farmacias")
├── code (slug único)
├── type: 'standard' | 'promotional' | 'volume'
├── currency (USD)
├── is_default: boolean
├── valid_from, valid_until (nullable — vigencia)
├── is_active: boolean
├── created_at, updated_at, deleted_at

dist_price_list_items
├── id, tenant_id, organization_id
├── price_list_id
├── product_id (UUID → catalog_products)
├── variant_id (UUID → catalog_product_variants, nullable)
├── unit_price
├── min_quantity (cantidad mínima para este precio)
├── currency
├── created_at, updated_at, deleted_at

dist_customer_price_lists
├── id, tenant_id, organization_id
├── customer_id
├── price_list_id
├── priority (si tiene varias, cuál aplica primero)
├── created_at, updated_at
```

**Funcionalidades:**
- CRUD de listas de precios
- Asignar productos con precio a cada lista
- Asignar lista de precios a clientes
- Descuentos por volumen (min_quantity)
- Precios en USD con equivalente VES automático (usa venezuela_rates)
- Al crear pedido, auto-seleccionar precio según lista del cliente

**UI:**
- Lista de listas de precios (DataTable)
- Detalle de lista con productos y precios
- Asignación de lista a clientes
- Formulario de precio por producto

---

### Sprint 3: `dist_inventory` — Control de Inventario

**Propósito**: Saber qué hay en bodega, qué está comprometido por pedidos, y qué hay que reponer.

**Entidades:**

```
dist_inventory_items
├── id, tenant_id, organization_id
├── product_id (UUID → catalog_products)
├── variant_id (UUID → nullable)
├── warehouse_code (default: 'main')
├── quantity_available (stock libre)
├── quantity_committed (reservado por pedidos no despachados)
├── quantity_in_transit (en camino del proveedor)
├── reorder_point (stock mínimo — alerta cuando baja de aquí)
├── reorder_quantity (cuánto pedir al reponer)
├── unit_cost (costo unitario promedio)
├── currency
├── last_count_date (último inventario físico)
├── created_at, updated_at

dist_inventory_movements
├── id, tenant_id, organization_id
├── product_id, variant_id
├── warehouse_code
├── type: 'purchase_in' | 'sale_out' | 'return_in' | 'adjustment' | 'transfer' | 'count'
├── quantity (positivo = entrada, negativo = salida)
├── reference_type: 'sales_order' | 'purchase_order' | 'return' | 'manual'
├── reference_id
├── unit_cost (costo en este movimiento)
├── notes
├── performed_by (UUID → user)
├── created_at

dist_inventory_lots (opcional — para productos con vencimiento)
├── id, tenant_id, organization_id
├── product_id, variant_id
├── lot_number
├── expiry_date
├── quantity_remaining
├── received_date
├── created_at, updated_at
```

**Funcionalidades:**
- Stock actual por producto (disponible, comprometido, en tránsito)
- Movimientos de entrada/salida con trazabilidad
- Alertas de stock mínimo (reorder_point)
- Inventario físico (conteo y ajuste)
- Control de lotes y vencimientos (para alimentos/medicinas)
- Auto-descontar stock al confirmar pedido
- Auto-devolver stock al cancelar pedido o registrar devolución

**UI:**
- Lista de inventario (DataTable con stock, comprometido, alerta)
- Registro de movimiento (entrada/salida/ajuste)
- Alertas de reposición
- Historial de movimientos por producto

---

### Sprint 4: `dist_routes` — Rutas de Distribución

**Propósito**: Organizar la operación diaria. Las distribuidoras tienen rutas fijas por zona/día con vendedores asignados.

**Entidades:**

```
dist_routes
├── id, tenant_id, organization_id
├── name (ej: "Ruta Norte - Lunes")
├── code
├── zone (zona geográfica)
├── day_of_week: 0-6 (0=domingo)
├── assigned_seller_id (UUID → staff/auth user)
├── assigned_driver_id (UUID → nullable)
├── vehicle_plate (nullable)
├── is_active: boolean
├── notes
├── created_at, updated_at, deleted_at

dist_route_stops
├── id, tenant_id, organization_id
├── route_id
├── customer_id
├── sequence_order (orden de visita)
├── address (dirección de entrega)
├── contact_phone
├── delivery_notes
├── is_active: boolean
├── created_at, updated_at, deleted_at

dist_route_visits
├── id, tenant_id, organization_id
├── route_id
├── stop_id
├── visit_date
├── status: 'planned' | 'visited' | 'skipped' | 'order_taken' | 'no_order'
├── order_id (UUID → sales_orders, nullable)
├── notes
├── visited_at (timestamp real de visita)
├── created_at, updated_at
```

**Funcionalidades:**
- Definir rutas por zona y día de la semana
- Asignar clientes como paradas en cada ruta
- Planificar visitas del día
- Registrar resultado de visita (pedido tomado, sin pedido, no visitado)
- Reporte de efectividad (pedidos/visitas)
- Vista de "hoy" para el vendedor

**UI:**
- Lista de rutas (DataTable)
- Detalle de ruta con paradas (drag & drop para reordenar)
- Vista "Mi día" (paradas de hoy para el vendedor logueado)
- Registro de visita

---

### Sprint 5: `dist_delivery` — Entregas y Despacho

**Propósito**: Gestionar desde que se prepara el pedido hasta que se entrega al cliente.

**Entidades:**

```
dist_delivery_orders
├── id, tenant_id, organization_id
├── route_id (nullable — puede ser entrega directa)
├── driver_id (UUID → staff)
├── vehicle_plate
├── dispatch_date
├── status: 'preparing' | 'dispatched' | 'in_transit' | 'completed' | 'partial'
├── total_items, delivered_items, returned_items
├── notes
├── created_at, updated_at, deleted_at

dist_delivery_items
├── id, tenant_id, organization_id
├── delivery_order_id
├── sales_order_id (UUID → sales_orders)
├── customer_id
├── product_id, variant_id
├── quantity_dispatched
├── quantity_delivered
├── quantity_returned
├── status: 'pending' | 'delivered' | 'partial' | 'returned' | 'rejected'
├── delivery_notes
├── confirmed_at
├── created_at, updated_at
```

**Funcionalidades:**
- Generar orden de despacho desde pedidos confirmados
- Agrupar por ruta/vehículo
- Marcar entregas (entregado, parcial, rechazado)
- Registrar devoluciones en campo
- Auto-actualizar inventario al confirmar entrega
- Auto-actualizar estado del pedido (sales_orders)

**UI:**
- Lista de órdenes de despacho (DataTable)
- Crear despacho (seleccionar pedidos pendientes)
- Detalle de despacho con items
- Confirmar entrega por item

---

### Sprint 6: `dist_reports` — Reportes de Distribución

**Propósito**: KPIs y reportes específicos del negocio.

**Reportes (API + UI):**
- Ventas por vendedor/ruta/zona/período
- Cobranza del período (cobrado vs pendiente)
- Antigüedad de saldos (aging report)
- Top productos vendidos
- Clientes morosos (saldo > 0 y vencido)
- Efectividad de rutas (pedidos/visitas %)
- Inventario valorizado (stock × costo)
- Comisiones del período

**UI:**
- Dashboard con cards de KPIs
- Filtros por período/vendedor/zona
- Export CSV de cada reporte

---

### Sprint 7: `dist_commissions` — Comisiones de Vendedores

**Propósito**: Calcular comisiones por ventas y cobranza.

**Entidades:**

```
dist_commission_rules
├── id, tenant_id, organization_id
├── seller_id (UUID → staff, nullable = aplica a todos)
├── type: 'sale' | 'collection' | 'goal_bonus'
├── rate (porcentaje)
├── min_amount (monto mínimo para aplicar)
├── goal_amount (meta para bonus, nullable)
├── is_active: boolean
├── created_at, updated_at, deleted_at

dist_commission_records
├── id, tenant_id, organization_id
├── seller_id
├── period_month
├── type: 'sale' | 'collection' | 'goal_bonus'
├── reference_type, reference_id
├── base_amount (monto base sobre el que se calcula)
├── rate_applied
├── commission_amount (calculado)
├── status: 'pending' | 'approved' | 'paid'
├── created_at, updated_at
```

**Funcionalidades:**
- Definir reglas de comisión por vendedor o globales
- Comisión por venta (% del monto facturado)
- Comisión por cobranza (% de lo cobrado)
- Bonus por cumplimiento de meta mensual
- Liquidación quincenal/mensual
- Reporte de comisiones por vendedor

**UI:**
- Configuración de reglas (DataTable + CrudForm)
- Reporte de comisiones del período
- Aprobación de comisiones

---

### Sprint 8: `dist_portal` — Portal del Cliente

**Propósito**: Portal self-service donde los clientes de la distribuidora pueden consultar y pedir.

**Funcionalidades:**
- Ver estado de cuenta (saldo, facturas pendientes, pagos)
- Hacer pedidos (seleccionar productos del catálogo con precios de su lista)
- Ver historial de pedidos y entregas
- Ver próxima visita programada
- Descargar facturas en PDF
- Registrar pago (subir comprobante)

**UI (portal pages):**
- Dashboard del cliente (saldo, último pedido, próxima visita)
- Catálogo con precios personalizados
- Carrito y checkout simplificado
- Historial de pedidos
- Estado de cuenta

---

## Patrones Reutilizados (adaptados de Education)

| Patrón | Origen | Adaptación para Distribuidoras |
|--------|--------|-------------------------------|
| `overdue_worker` | `tuition/workers/overdue-checker.ts` | Busca `dist_credit_transactions` vencidas, marca como moroso |
| `whatsapp_cobro` | `tuition/api/whatsapp-cobro/route.ts` | Busca clientes morosos, genera mensaje con facturas pendientes |
| `receipt_generator` | `tuition/services/receipt-generator.ts` | Genera recibo de pago con datos de factura/cliente |

Estos se **rehacen** con la lógica de distribuidora (diferentes tablas, campos, mensajes) pero siguiendo el mismo patrón técnico (worker con metadata.queue, API con Kysely, HTML generator).

---

## Integración Entre Módulos

```
catalog (productos)
  └──→ dist_price_lists (precios por lista/cliente)
  └──→ dist_inventory (stock disponible)

customers (clientes)
  └──→ dist_credit (límite de crédito, estado de cuenta)
  └──→ dist_routes (asignación a ruta)
  └──→ dist_price_lists (lista asignada)

sales (pedidos/facturas)
  └──→ dist_credit (validar límite ANTES de confirmar pedido)
  └──→ dist_inventory (descontar stock al confirmar)
  └──→ dist_delivery (generar despacho)
  └──→ dist_commissions (calcular comisión al facturar)

dist_delivery (entregas)
  └──→ dist_inventory (devolución = entrada de stock)
  └──→ dist_credit (entrega confirmada = factura activa en cuenta)

payment_methods (pagos recibidos)
  └──→ dist_credit (pago = abono en cuenta del cliente)

ve_tax_books (libros fiscales)
  └──→ Se alimenta de sales (facturas emitidas = libro de ventas)
```

---

## Orden de Implementación

| Sprint | Módulo | Dependencias | Complejidad |
|--------|--------|-------------|-------------|
| 1 | `dist_credit` | customers | Alta (es el core del negocio) |
| 2 | `dist_price_lists` | catalog | Media |
| 3 | `dist_inventory` | catalog | Media-Alta |
| 4 | `dist_routes` | customers, staff | Media |
| 5 | `dist_delivery` | sales, dist_inventory, dist_routes | Media |
| 6 | `dist_reports` | todos los anteriores | Baja (solo lee datos) |
| 7 | `dist_commissions` | sales, staff | Media |
| 8 | `dist_portal` | dist_credit, dist_price_lists, sales | Media |

---

## Notas Técnicas

- Todos los módulos son `from: '@app'` — no modifican Open Mercato core
- Comunicación entre módulos via Kysely queries y event bus (no imports directos)
- Cada módulo sigue la estructura obligatoria: index.ts, acl.ts, setup.ts, di.ts, events.ts, data/, api/, backend/, i18n/
- Los precios se manejan en USD con equivalente VES a tasa del día (usa `venezuela_rates`)
- El IGTF se aplica automáticamente en pagos en divisas (ya implementado en `ve_tenant_defaults`)
- Feature toggles controlan qué ve cada tenant (un tenant de RE no ve módulos de distribución)
