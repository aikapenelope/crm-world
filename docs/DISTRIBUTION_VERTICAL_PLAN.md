# Vertical Distribuidoras — Plan de Implementación

> CRM/ERP para distribuidoras venezolanas que manejan cuentas por cobrar, créditos, fuerza de ventas en ruta, y despacho de mercancía.

---

## Contexto Operativo (Venezuela)

Una distribuidora venezolana típicamente:

- Vende a crédito (30, 60, 90 días) a bodegas, minimarkets, farmacias, ferreterías
- Maneja 50-500 clientes activos con líneas de crédito asignadas
- Cobra en múltiples monedas (USD referencia, pago en VES a tasa del día, Zelle, Binance)
- Tiene vendedores en ruta (preventa: toma pedido → despacho al día siguiente)
- Maneja inventario de 500-5000 SKUs en uno o más almacenes
- El problema #1 es la mora: clientes que no pagan a tiempo
- Emite facturas con control fiscal (RIF, IVA 16%, IGTF 3%)
- Maneja listas de precios diferenciadas (mayorista, detallista, zona, volumen)
- Tiene rutas de distribución con camiones propios o tercerizados
- Necesita reportes diarios de cartera, ventas, y cobranza

### Sistemas que usan actualmente en VE

| Sistema | Tipo | Limitaciones |
|---|---|---|
| Saint Enterprise | ERP desktop | Caro, no cloud, interfaz antigua |
| Sistema Monica | Contable | Básico, no maneja rutas ni crédito avanzado |
| Profit Plus | ERP | Complejo, requiere servidor local |
| Excel | Manual | No escala, errores, sin automatización |
| A2 Softway | Administrativo | Limitado en CRM y cobranza |

### Oportunidad

Un sistema cloud, multi-moneda, con WhatsApp integrado para cobranza, portal del cliente, y fuerza de ventas móvil reemplaza a todos los anteriores con mejor UX y menor costo.

---

## Lo que Open Mercato Core YA Provee

| Necesidad | Módulo core | Notas |
|---|---|---|
| Clientes (empresas) | `customers` | Companies con custom fields, pipeline, actividades |
| Catálogo de productos | `catalog` | SKUs, categorías, variantes, precios |
| Órdenes de venta | `sales` (SalesOrder + Lines) | Multi-línea, ajustes, descuentos |
| Facturas | `sales` (SalesInvoice + Lines) | Facturación parcial, vinculada a órdenes |
| Notas de crédito | `sales` (SalesCreditMemo) | Devoluciones, ajustes |
| Pagos y asignaciones | `sales` (SalesPayment + Allocation) | Pago parcial, asignación a facturas |
| Cotizaciones | `sales` (SalesQuote) | Pre-orden con conversión a orden |
| Envíos/despachos | `sales` (SalesShipment + Items) | Tracking, peso, cantidades |
| Multi-moneda | `currencies` + `venezuela_rates` | USD/VES/EUR/USDT con tasas automáticas |
| Métodos de pago VE | `payment_methods` | Pago Móvil, Zelle, Binance, Transferencia, Efectivo |
| Impuestos VE | `ve_fiscal` + `ve_tenant_defaults` | IVA 16%, IGTF 3%, RIF, retenciones |
| Pipeline de ventas | `customers` (deals) | Kanban con etapas configurables |
| Automatización | `workflows` | Si mora > 30 días → suspender crédito |
| Notificaciones | `notifications` | Alertas de crédito, mora, stock bajo |
| Búsqueda | `search` | Buscar productos, clientes, facturas |
| Dashboard | `dashboards` | Widgets personalizados |
| Portal de clientes | `portal` + `customer_accounts` | Self-service para el cliente |
| Integraciones | `integrations` + `data_sync` | Conectar con otros sistemas |
| Webhooks | `webhooks` | Notificar a sistemas externos |
| AI Assistant | `ai_assistant` | Consultas por chat, análisis |

**Estimación: Open Mercato core cubre ~60% de las necesidades de una distribuidora.**

---

## Módulos Custom a Construir (8 módulos)

### Módulo 1: `credit_management` — Líneas de Crédito

**Propósito**: Asignar y controlar límites de crédito por cliente. Bloquear ventas cuando se excede el límite.

**Entidades:**

```
credit_lines
├── id, tenant_id, organization_id
├── customer_id (FK → customers.company)
├── credit_limit (decimal, USD)
├── current_balance (decimal — suma de facturas pendientes)
├── available_credit (decimal — limit - balance)
├── payment_terms_days: 15 | 30 | 45 | 60 | 90
├── status: active | suspended | blocked | under_review
├── risk_level: low | medium | high | critical
├── last_payment_date (nullable)
├── days_overdue_max (máximo días de mora actual)
├── credit_score (0-100, calculado por historial)
├── approved_by (user_id)
├── approved_at
├── suspension_reason (nullable)
├── notes
├── created_at, updated_at, deleted_at

credit_history (log de cambios)
├── id, tenant_id
├── credit_line_id (FK)
├── action: limit_increased | limit_decreased | suspended | reactivated | blocked | terms_changed
├── previous_value, new_value
├── reason
├── performed_by (user_id)
├── created_at
```

**Lógica de negocio:**
- Al crear una orden → verificar `available_credit >= order_total`
- Si no hay crédito → bloquear orden, notificar al gerente para aprobación
- Auto-suspender si `days_overdue_max > payment_terms_days`
- Auto-bloquear si `days_overdue_max > payment_terms_days * 2`
- Notificación al vendedor cuando crédito disponible < 20%
- Recalcular `current_balance` cada vez que se registra un pago
- Credit score basado en: historial de pagos, antigüedad, volumen

**UI:**
- `/backend/credit` — lista de clientes con su línea de crédito
- Semáforo visual: verde (>50% disponible), amarillo (20-50%), rojo (<20%), negro (bloqueado)
- Detalle por cliente: historial de cambios, facturas pendientes, score
- Aprobación de órdenes que exceden crédito (workflow)
- Botón "Suspender" / "Reactivar" con razón obligatoria

---

### Módulo 2: `accounts_receivable` — Cuentas por Cobrar

**Propósito**: Gestión de cobranza, aging, seguimiento, promesas de pago, WhatsApp.

**Entidades:**

```
receivable_entries (una por factura pendiente)
├── id, tenant_id, organization_id
├── customer_id (FK)
├── invoice_id (FK → sales.invoice)
├── invoice_number
├── invoice_date
├── due_date
├── original_amount, currency
├── amount_paid
├── balance (original - paid)
├── status: current | overdue_30 | overdue_60 | overdue_90 | overdue_90_plus | paid | written_off | in_dispute
├── days_overdue (calculado)
├── aging_bucket: current | 1_30 | 31_60 | 61_90 | 90_plus
├── last_collection_date (nullable)
├── last_collection_note (nullable)
├── assigned_collector (user_id, nullable)
├── priority: normal | high | urgent | legal
├── created_at, updated_at

collection_actions (historial de gestión de cobro)
├── id, tenant_id
├── receivable_id (FK)
├── customer_id (FK)
├── action_type: call | visit | whatsapp | email | promise | partial_payment | dispute | legal_notice | payment_plan
├── notes
├── promise_date (nullable)
├── promise_amount (nullable)
├── result: contacted | no_answer | promise_made | payment_received | refused | dispute_opened | will_call_back
├── next_action_date (nullable — cuándo hacer seguimiento)
├── performed_by (user_id)
├── created_at

payment_promises
├── id, tenant_id
├── customer_id (FK)
├── receivable_ids: json[] (puede cubrir varias facturas)
├── promised_amount
├── promised_date
├── status: pending | fulfilled | broken | partial | renegotiated
├── fulfilled_date (nullable)
├── fulfilled_amount (nullable)
├── broken_count (int — cuántas veces ha incumplido)
├── created_at, updated_at

payment_plans (planes de pago para morosos)
├── id, tenant_id, organization_id
├── customer_id (FK)
├── total_debt
├── installments (int)
├── installment_amount
├── frequency: weekly | biweekly | monthly
├── start_date
├── status: active | completed | defaulted
├── created_at, updated_at
```

**Funcionalidades clave:**
- **Aging report**: Cartera por antigüedad con totales por bucket
- **Cobro por WhatsApp**: Lista de morosos con wa.me links (mismo patrón que colegios)
- **Promesas de pago**: Registrar, dar seguimiento, marcar como cumplida/incumplida
- **Planes de pago**: Para clientes con deuda grande, fraccionar en cuotas
- **Auto-clasificación**: Worker cada 3 días que actualiza aging_bucket y status
- **Asignación de cobrador**: Distribuir cartera entre cobradores
- **Historial completo**: Cada llamada, visita, WhatsApp queda registrado
- **Alertas**: Promesa vencida, cliente sin gestión en X días, pago recibido

**UI:**
- `/backend/receivables` — aging dashboard (barras por bucket, totales)
- `/backend/receivables/aging` — tabla completa con filtros (bucket, vendedor, zona)
- `/backend/receivables/cobro` — página de cobro WhatsApp (igual que colegios)
- `/backend/receivables/promises` — promesas pendientes con countdown
- `/backend/receivables/customer/[id]` — estado de cuenta del cliente
- Dashboard widgets: DSO, total por cobrar, aging pie chart, top 10 morosos

---

### Módulo 3: `route_sales` — Fuerza de Ventas en Ruta

**Propósito**: Vendedores que visitan clientes, toman pedidos, cobran.

**Entidades:**

```
sales_routes
├── id, tenant_id, organization_id
├── name: "Ruta Norte", "Ruta Centro", "Ruta Sur"
├── code: "RN", "RC", "RS"
├── assigned_seller (user_id)
├── days_of_week: json[] (["lunes", "miércoles", "viernes"])
├── customer_sequence: json[] (customer_ids en orden de visita)
├── zone: "Norte" | "Centro" | "Sur" | "Este" | "Oeste"
├── estimated_duration_hours (decimal)
├── is_active: boolean
├── created_at, updated_at

route_visits (registro de cada visita)
├── id, tenant_id, organization_id
├── route_id (FK)
├── customer_id (FK)
├── seller_id (user_id)
├── visit_date
├── status: planned | visited | skipped | closed | no_one_home
├── visit_type: presale | delivery | collection | mixed
├── order_id (FK → sales.order, nullable)
├── order_amount (decimal, nullable)
├── collection_amount (decimal, nullable)
├── collection_method (nullable — pago_movil, zelle, etc.)
├── notes
├── gps_latitude, gps_longitude (nullable)
├── check_in_time, check_out_time (nullable)
├── photos: json[] (attachment_ids — fotos del estante, exhibición)
├── created_at

seller_targets (metas mensuales)
├── id, tenant_id
├── seller_id (user_id)
├── month: "2026-10"
├── target_sales (decimal, USD)
├── target_collections (decimal, USD)
├── target_visits (int)
├── target_new_customers (int)
├── actual_sales (decimal, calculado)
├── actual_collections (decimal, calculado)
├── actual_visits (int, calculado)
├── actual_new_customers (int, calculado)
├── achievement_percentage (decimal, calculado)
├── created_at, updated_at

seller_commissions
├── id, tenant_id
├── seller_id (user_id)
├── month: "2026-10"
├── sales_commission_rate (decimal, %)
├── collection_commission_rate (decimal, %)
├── total_sales, total_collections
├── commission_amount (calculado)
├── status: pending | approved | paid
├── created_at, updated_at
```

**UI:**
- `/backend/routes` — mapa de rutas con clientes asignados
- `/backend/routes/visits` — registro diario de visitas (hoy)
- `/backend/routes/targets` — metas vs real por vendedor (barras de progreso)
- `/backend/routes/commissions` — comisiones del mes
- Vista móvil optimizada para el vendedor en calle (tablet/teléfono)

---

### Módulo 4: `inventory_distribution` — Inventario Multi-Almacén

**Entidades:**

```
warehouses
├── id, tenant_id, organization_id
├── name, code, address, city
├── type: main | secondary | transit | returns
├── is_default: boolean
├── manager_id (user_id, nullable)
├── created_at, updated_at

stock_levels (stock por producto × almacén)
├── id, tenant_id
├── product_id (FK → catalog.product)
├── warehouse_id (FK)
├── quantity_on_hand
├── quantity_reserved (comprometido en órdenes no despachadas)
├── quantity_available (on_hand - reserved)
├── quantity_in_transit (en transferencia)
├── reorder_point (mínimo antes de alertar)
├── reorder_quantity (cuánto pedir al proveedor)
├── average_cost (decimal — costo promedio ponderado)
├── last_purchase_cost (decimal)
├── last_counted_at (nullable — último inventario físico)
├── updated_at

stock_movements (historial)
├── id, tenant_id
├── product_id, warehouse_id
├── movement_type: purchase | sale | transfer_in | transfer_out | adjustment_in | adjustment_out | return_in | return_out | damage | expiry
├── quantity (positivo = entrada, negativo = salida)
├── unit_cost (decimal)
├── reference_type: order | transfer | adjustment | purchase_order
├── reference_id
├── batch_number (nullable — para trazabilidad)
├── expiry_date (nullable — para productos perecederos)
├── notes
├── performed_by (user_id)
├── created_at

warehouse_transfers
├── id, tenant_id, organization_id
├── transfer_number (secuencial)
├── from_warehouse_id, to_warehouse_id
├── status: draft | approved | in_transit | received | cancelled
├── items: json[] ({ product_id, quantity, unit_cost })
├── total_items, total_value
├── approved_by (nullable)
├── shipped_at, received_at (nullable)
├── notes
├── created_at, updated_at

purchase_orders (órdenes de compra a proveedores)
├── id, tenant_id, organization_id
├── supplier_id (FK → customers.company con tag "proveedor")
├── order_number
├── status: draft | sent | partial | received | cancelled
├── items: json[] ({ product_id, quantity, unit_cost, received_quantity })
├── total_amount, currency
├── expected_date
├── warehouse_id (destino)
├── notes
├── created_at, updated_at
```

**UI:**
- `/backend/inventory` — stock actual por almacén (DataTable con alertas de mínimo)
- `/backend/inventory/movements` — historial de movimientos
- `/backend/inventory/transfers` — transferencias entre almacenes
- `/backend/inventory/purchases` — órdenes de compra
- `/backend/inventory/alerts` — productos bajo mínimo
- Dashboard widgets: valor de inventario, productos agotados, rotación

---

### Módulo 5: `delivery_routes` — Despacho y Entrega

**Entidades:**

```
delivery_vehicles
├── id, tenant_id, organization_id
├── plate_number, brand, model, year
├── type: truck | van | motorcycle
├── capacity_kg, capacity_m3
├── driver_name, driver_phone, driver_cedula
├── helper_name (nullable)
├── status: available | on_route | maintenance | inactive
├── fuel_type: gasoline | diesel
├── last_maintenance_date (nullable)
├── created_at, updated_at

delivery_trips (viajes de entrega)
├── id, tenant_id, organization_id
├── trip_number (secuencial del día)
├── vehicle_id (FK)
├── date
├── status: planning | loading | in_transit | delivering | completed | cancelled
├── orders: json[] ({ order_id, customer_id, customer_name, address, sequence })
├── total_orders, total_weight_kg, total_items
├── departure_time, return_time (nullable)
├── fuel_cost (nullable)
├── delivery_notes
├── created_at, updated_at

delivery_confirmations (confirmación por orden)
├── id, tenant_id
├── trip_id (FK)
├── order_id (FK)
├── status: delivered | partial | rejected | rescheduled
├── delivered_items (int)
├── rejected_items (int)
├── rejection_reason (nullable)
├── received_by_name (nullable)
├── received_by_cedula (nullable)
├── signature_attachment_id (nullable)
├── photo_attachment_id (nullable)
├── delivered_at
├── created_at
```

**UI:**
- `/backend/delivery` — trips del día (planning board)
- `/backend/delivery/vehicles` — flota de vehículos
- `/backend/delivery/trip/[id]` — detalle del viaje con órdenes y confirmaciones
- Vista de carga: qué productos van en cada camión

---

### Módulo 6: `price_lists` — Listas de Precios

**Entidades:**

```
price_lists
├── id, tenant_id, organization_id
├── name: "Lista General", "Mayorista", "Detallista", "Zona Norte"
├── code: "GEN", "MAY", "DET", "ZN"
├── type: general | customer_group | zone | volume | promotional
├── currency: USD
├── margin_percentage (nullable — margen sobre costo)
├── is_default: boolean
├── valid_from, valid_until (nullable)
├── is_active: boolean
├── created_at, updated_at

price_list_items (precio por producto en cada lista)
├── id, tenant_id
├── price_list_id (FK)
├── product_id (FK → catalog.product)
├── unit_price (decimal)
├── min_quantity (int, default 1 — precio por volumen)
├── max_quantity (nullable)
├── discount_percentage (nullable — descuento sobre precio base)
├── created_at, updated_at

customer_price_assignments (qué lista tiene cada cliente)
├── id, tenant_id
├── customer_id (FK)
├── price_list_id (FK)
├── priority (int — si tiene varias, cuál aplica primero)
├── created_at
```

**Lógica:**
- Al crear una orden, resolver precio: customer assignment → price list → product price
- Si el cliente tiene lista "Mayorista" y compra >10 unidades → precio volumen
- Precios promocionales con fecha de vigencia
- Margen automático: si se define margin_percentage, el precio = costo × (1 + margin/100)

**UI:**
- `/backend/price-lists` — gestión de listas
- `/backend/price-lists/[id]` — productos y precios de una lista
- `/backend/price-lists/assign` — asignar listas a clientes
- Comparador: ver precio de un producto en todas las listas

---

### Módulo 7: `distributor_reports` — Reportes

No requiere entidades propias — son queries sobre los otros módulos.

**Reportes:**
- **Aging de cartera**: Por bucket (corriente, 30, 60, 90, 90+) con totales
- **Ventas por vendedor**: Mes actual vs meta, ranking
- **Ventas por producto**: Top 20 productos, unidades y monto
- **Ventas por cliente**: Top 20 clientes, frecuencia de compra
- **DSO (Days Sales Outstanding)**: Promedio de días para cobrar
- **Inventario valorizado**: Stock × costo promedio por almacén
- **Rotación de inventario**: Productos de alta/baja rotación
- **Clientes inactivos**: Sin compra en 30/60/90 días
- **Cumplimiento de rutas**: Visitas planificadas vs realizadas
- **Comisiones**: Resumen por vendedor
- **Rentabilidad por cliente**: Ventas - costo - descuentos - mora

**UI:**
- `/backend/reports` — hub de reportes con cards por categoría
- Cada reporte: filtros (fecha, vendedor, zona) + tabla + exportar Excel
- Dashboard widgets: KPIs principales (ventas hoy, cartera, DSO, stock alerts)

---

### Módulo 8: `distributor_portal` — Portal del Cliente

El cliente (bodega, farmacia, ferretería) accede a su portal y puede:

**Funcionalidades:**
- Ver facturas pendientes y pagadas
- Ver su crédito disponible y límite
- Hacer pedidos (repetir última orden o seleccionar productos)
- Ver historial de compras
- Descargar facturas en PDF
- Registrar un pago (sube comprobante, el admin confirma)
- Ver próxima visita del vendedor
- Chatear con su vendedor asignado

**UI (frontend/portal):**
- `/portal/dashboard` — resumen: crédito, facturas pendientes, último pedido
- `/portal/invoices` — lista de facturas con status y descarga PDF
- `/portal/orders` — hacer pedido nuevo o repetir
- `/portal/payments` — registrar pago (subir comprobante)
- `/portal/credit` — ver línea de crédito y disponible

---

## Funcionalidades Adicionales (Diferenciadores)

### WhatsApp Cobro (mismo patrón que Education)
- Lista de clientes morosos con monto, días de mora, teléfono
- Botón verde "Enviar" por cada cliente (wa.me link con mensaje pre-formateado)
- Mensaje incluye: facturas pendientes, monto total, métodos de pago
- "Enviar todos" para cobro masivo

### Alertas Inteligentes
- Cliente cerca del límite de crédito (80%)
- Producto bajo mínimo de stock
- Promesa de pago vencida (no cumplió)
- Cliente sin compra en 30+ días (riesgo de pérdida)
- Vendedor no cumplió meta de visitas
- Factura vencida sin gestión de cobro

### Integración con Tasas de Cambio
- Al facturar en USD, mostrar equivalente en VES a tasa del día
- Al registrar pago en VES, calcular automáticamente cuánto USD cubre
- Historial de tasas usadas por factura (para auditoría)

### Modo "Día de Cobro" (para el cobrador en calle)
- Buscar cliente → ver deuda → registrar pago → siguiente
- Optimizado para velocidad en tablet/teléfono
- Funciona con conexión intermitente (queue offline)

### AI Assistant para Distribuidoras
- "¿Cuánto debe el cliente X?"
- "¿Qué productos están agotados?"
- "¿Cuál es mi DSO este mes?"
- "Genera un reporte de aging"
- "¿Qué clientes no han comprado en 30 días?"

---

## Plan de Sprints

### PR #1 (Sprints 1-2): Credit Management + Accounts Receivable
- `credit_management` — entidades, API, UI (semáforo de crédito)
- `accounts_receivable` — entidades, API, aging, cobro WhatsApp, promesas

### PR #2 (Sprints 3-4): Route Sales + Price Lists
- `route_sales` — rutas, visitas, metas, comisiones
- `price_lists` — listas, items, asignaciones a clientes

### PR #3 (Sprints 5-6): Inventory + Delivery
- `inventory_distribution` — multi-almacén, stock, movimientos, transferencias, compras
- `delivery_routes` — vehículos, trips, confirmaciones

### PR #4 (Sprints 7-8): Reports + Portal + Polish
- `distributor_reports` — todos los reportes con UI
- `distributor_portal` — portal del cliente
- Dashboard widgets, alertas, integración AI

---

## Compatibilidad con Open Mercato

- Todos los módulos son `from: '@app'` — no modifican core
- Usan `makeCrudRoute` para APIs, `DataTable`/`CrudForm` para UI
- Comunicación con core via Kysely (no imports directos de entidades)
- Eventos tipados para integración con workflows
- Feature toggles para activar/desactivar por tenant
- seedDefaults para configuración automática al crear tenant
- i18n en español (es.json + en.json)

---

## Sobre SimplitPOS y Sistemas POS

SimplitPOS es un POS para punto de venta físico (retail al consumidor final). Para distribuidoras NO aplica directamente porque:

- Las distribuidoras no venden en mostrador al consumidor final
- Venden a crédito con factura, no cobro inmediato
- El flujo es: pedido → despacho → factura → cobro a 30/60/90 días

**Integración futura posible**: Si un cliente de la distribuidora tiene SimplitPOS en su tienda, se podría crear un módulo de "reposición automática" donde el POS del cliente envía una alerta cuando un producto baja de stock, y el sistema de la distribuidora genera un pedido sugerido. Esto requeriría que SimplitPOS exponga una API (actualmente no documentada públicamente).

**Alternativa**: Usar el módulo `distributor_portal` para que el cliente haga sus propios pedidos de reposición desde el portal web/móvil, sin depender de SimplitPOS.
