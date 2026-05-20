# Vertical Talleres Mecánicos — Plan Completo

> Plan de implementación para talleres mecánicos automotrices en Venezuela.
> Enfoque moderno: inspección digital con fotos (DVI), aprobación por WhatsApp, portal del cliente.

---

## Contexto del Negocio

Un taller mecánico en Venezuela:
- Recibe vehículos para diagnóstico, mantenimiento y reparación
- Necesita documentar el estado del vehículo al recibirlo (protección legal)
- Genera presupuestos que el cliente aprueba o rechaza
- Usa repuestos propios o que el cliente trae
- Cobra en múltiples monedas (USD, VES, Zelle, Pago Móvil)
- El pain #1 es la comunicación con el cliente (¿ya está listo? ¿cuánto cuesta?)
- El diferenciador moderno es la **inspección digital con fotos** (DVI)

---

## Flujo Principal del Taller

```
1. Cliente llega con vehículo
   └── Registrar vehículo (placa, marca, modelo, km)
   └── Tomar fotos del estado actual (antes)

2. Crear Orden de Servicio
   └── Motivo de ingreso (lo que reporta el cliente)
   └── Asignar técnico/mecánico

3. Diagnóstico + Inspección Digital (DVI)
   └── Técnico inspecciona el vehículo
   └── Toma fotos de problemas encontrados
   └── Marca/anota las fotos (círculos, flechas)
   └── Registra hallazgos por sistema (frenos, motor, suspensión, etc.)

4. Presupuesto
   └── Generar presupuesto (mano de obra + repuestos + IVA)
   └── Enviar al cliente por WhatsApp con fotos
   └── Cliente aprueba/rechaza items individuales

5. Reparación
   └── Técnico ejecuta el trabajo aprobado
   └── Registra repuestos usados (descuenta inventario)
   └── Toma fotos del trabajo terminado (después)
   └── Registra tiempo real de trabajo

6. Control de Calidad + Entrega
   └── Verificación final
   └── Generar factura
   └── Cobrar (multi-moneda VE)
   └── Entregar vehículo al cliente
```

---

## Módulos Core Reutilizados (ya activos)

| Módulo Core | Uso en talleres |
|---|---|
| `customers` | Clientes del taller (personas/empresas) |
| `planner` | Agenda de citas |
| `attachments` | Almacenamiento de fotos (uploads) |
| `sales` | Facturación |
| `notifications` | Alertas (vehículo listo, presupuesto enviado) |
| `portal` + `customer_accounts` | Portal del cliente |
| `workflows` | Automatización de status |

### Módulos fiscales VE (ya construidos)

| Módulo | Uso en talleres |
|---|---|
| `payment_methods` | Cobro multi-moneda (Pago Móvil, Zelle, etc.) |
| `ve_fiscal` | RIF, IVA 16%, IGTF |
| `ve_tax_books` | Libro de ventas (facturas emitidas) |
| `venezuela_rates` | Tasa de cambio BCV |

---

## Módulos Custom a Construir (7 módulos)

### Sprint 1: `auto_vehicles` — Registro de Vehículos

**Propósito**: Ficha del vehículo con fotos. Un cliente puede tener múltiples vehículos.

**Entidades:**

```
auto_vehicles
├── id, tenant_id, organization_id
├── customer_id (UUID → customers)
├── plate (placa: ABC123 o AB123CD)
├── brand (marca: Toyota, Chevrolet, Ford, etc.)
├── model (modelo: Corolla, Aveo, F-150)
├── year (año)
├── color
├── vin (nullable — no todos lo tienen en VE)
├── engine_type: 'gasoline' | 'diesel' | 'hybrid' | 'electric' | 'gas'
├── transmission: 'manual' | 'automatic'
├── current_km (kilometraje actual)
├── notes
├── is_active: boolean
├── created_at, updated_at, deleted_at

auto_vehicle_photos
├── id, tenant_id, organization_id
├── vehicle_id
├── photo_url (path al attachment)
├── photo_type: 'front' | 'rear' | 'left' | 'right' | 'interior' | 'engine' | 'damage' | 'other'
├── caption (descripción de la foto)
├── taken_at
├── created_at
```

**UI:**
- Lista de vehículos (DataTable con placa, marca, modelo, cliente)
- Ficha del vehículo (datos + galería de fotos + historial de servicios)
- Formulario de registro (datos + upload de fotos desde cámara)

---

### Sprint 2: `auto_service_orders` — Órdenes de Servicio

**Propósito**: El documento central del taller. Cada vez que un vehículo entra, se crea una orden.

**Entidades:**

```
auto_service_orders
├── id, tenant_id, organization_id
├── order_number (secuencial: OT-202605-00001)
├── vehicle_id (UUID → auto_vehicles)
├── customer_id (UUID → customers)
├── status: 'received' | 'diagnosis' | 'estimate_sent' | 'approved' | 'in_repair' | 'quality_check' | 'ready' | 'delivered' | 'cancelled'
├── received_at (fecha/hora de ingreso)
├── km_at_entry (km al ingresar)
├── customer_complaint (lo que reporta el cliente)
├── diagnosis_notes (hallazgos del técnico)
├── assigned_technician_id (UUID → staff)
├── estimated_completion (fecha estimada)
├── actual_completion (fecha real)
├── priority: 'low' | 'normal' | 'high' | 'urgent'
├── total_labor (monto mano de obra)
├── total_parts (monto repuestos)
├── total_amount (total con IVA)
├── currency
├── notes
├── created_at, updated_at, deleted_at

auto_service_order_items
├── id, tenant_id, organization_id
├── service_order_id
├── type: 'labor' | 'part'
├── description
├── quantity
├── unit_price
├── total_price
├── part_id (UUID → auto_parts, nullable)
├── is_approved: boolean (el cliente aprobó este item)
├── technician_notes
├── created_at, updated_at
```

**Status Workflow:**
```
received → diagnosis → estimate_sent → approved → in_repair → quality_check → ready → delivered
                                     ↘ cancelled (en cualquier punto)
```

**UI:**
- Board visual de órdenes por status (estilo Kanban)
- Lista de órdenes (DataTable con filtros)
- Detalle de orden (datos + items + fotos + timeline)
- Crear orden (seleccionar vehículo, motivo, técnico)

---

### Sprint 3: `auto_inspections` — Inspección Digital (DVI)

**Propósito**: El diferenciador moderno. El técnico documenta con fotos el estado del vehículo.

**Entidades:**

```
auto_inspections
├── id, tenant_id, organization_id
├── service_order_id
├── vehicle_id
├── type: 'intake' | 'diagnosis' | 'progress' | 'completion'
├── inspector_id (UUID → staff/technician)
├── status: 'in_progress' | 'completed' | 'sent_to_customer'
├── overall_condition: 'good' | 'fair' | 'needs_attention' | 'critical'
├── notes
├── sent_to_customer_at (cuando se envió por WhatsApp)
├── customer_viewed_at (cuando el cliente lo vio)
├── created_at, updated_at

auto_inspection_items
├── id, tenant_id, organization_id
├── inspection_id
├── system_category: 'brakes' | 'engine' | 'suspension' | 'electrical' | 'tires' | 'fluids' | 'body' | 'interior' | 'exhaust' | 'transmission' | 'cooling' | 'steering' | 'other'
├── item_name (ej: "Pastillas de freno delanteras")
├── condition: 'good' | 'fair' | 'needs_attention' | 'critical' | 'not_inspected'
├── notes
├── recommended_action (ej: "Reemplazar en próximos 5000 km")
├── urgency: 'none' | 'soon' | 'immediate'
├── created_at

auto_inspection_photos
├── id, tenant_id, organization_id
├── inspection_id
├── inspection_item_id (nullable — puede ser foto general)
├── photo_url
├── photo_type: 'before' | 'during' | 'after' | 'finding'
├── caption
├── annotations_json (nullable — marcas/círculos/flechas en JSON)
├── created_at
```

**Categorías de Inspección (sistemas del vehículo):**
- Frenos (pastillas, discos, líquido, mangueras)
- Motor (aceite, filtros, correas, bujías)
- Suspensión (amortiguadores, bujes, rótulas)
- Eléctrico (batería, alternador, luces, fusibles)
- Neumáticos (profundidad, presión, desgaste)
- Fluidos (aceite, refrigerante, frenos, dirección)
- Carrocería (pintura, golpes, óxido)
- Interior (tapicería, tablero, aire acondicionado)
- Escape (catalizador, silenciador, tubería)
- Transmisión (aceite, embrague, sincronizadores)
- Enfriamiento (radiador, mangueras, termostato)
- Dirección (cremallera, terminales, bomba)

**UI:**
- Formulario de inspección (checklist por sistema con condición)
- Upload de fotos por item (desde cámara del teléfono)
- Vista de inspección completa (galería + hallazgos)
- Botón "Enviar al cliente por WhatsApp"
- Vista pública de inspección (link compartible, sin auth)

---

### Sprint 4: `auto_parts` — Inventario de Repuestos

**Propósito**: Stock de repuestos del taller. Reutiliza el patrón de `dist_inventory`.

**Entidades:**

```
auto_parts
├── id, tenant_id, organization_id
├── code (código interno o código universal)
├── name
├── brand (marca del repuesto)
├── category: 'brakes' | 'engine' | 'electrical' | 'suspension' | 'filters' | 'fluids' | 'body' | 'other'
├── compatible_brands (JSON array: ["Toyota", "Chevrolet"])
├── unit (unidad: pieza, litro, metro, juego)
├── cost_price (precio de costo)
├── sell_price (precio de venta)
├── currency
├── quantity_in_stock
├── reorder_point
├── location (ubicación en el taller: "Estante A3")
├── is_active: boolean
├── created_at, updated_at, deleted_at
```

**UI:**
- Lista de repuestos (DataTable con stock, precio, categoría)
- Crear/editar repuesto
- Alertas de stock bajo
- Buscar por compatibilidad (marca de vehículo)

---

### Sprint 5: `auto_estimates` — Presupuestos con Aprobación

**Propósito**: Generar presupuesto detallado y enviarlo al cliente para aprobación.

**Entidades:**

```
auto_estimates
├── id, tenant_id, organization_id
├── service_order_id
├── vehicle_id
├── customer_id
├── estimate_number (secuencial: PRES-202605-00001)
├── status: 'draft' | 'sent' | 'partially_approved' | 'approved' | 'rejected' | 'expired'
├── subtotal_labor
├── subtotal_parts
├── tax_amount (IVA)
├── igtf_amount (si aplica)
├── total_amount
├── currency
├── valid_until (fecha de vigencia)
├── sent_at
├── approved_at
├── customer_notes (respuesta del cliente)
├── wa_link (link de WhatsApp generado)
├── public_link (link público para ver el presupuesto)
├── created_at, updated_at, deleted_at

auto_estimate_items
├── id, tenant_id, organization_id
├── estimate_id
├── type: 'labor' | 'part'
├── description
├── quantity
├── unit_price
├── total_price
├── is_approved: boolean (el cliente aprobó este item específico)
├── declined_reason (nullable)
├── created_at
```

**UI:**
- Generar presupuesto desde orden de servicio
- Vista del presupuesto (items con precios)
- Botón "Enviar por WhatsApp" (genera link público)
- Vista pública del presupuesto (el cliente aprueba/rechaza items)
- Historial de presupuestos por orden

---

### Sprint 6: `auto_reports` — Reportes del Taller

**Propósito**: KPIs y métricas del negocio.

**Reportes:**
- Vehículos en taller (board por status)
- Productividad por mecánico (órdenes completadas, tiempo promedio)
- Ingresos por período (diario, semanal, mensual)
- Repuestos más usados
- Clientes frecuentes (top 10)
- Tiempo promedio de reparación
- Tasa de aprobación de presupuestos
- Órdenes por tipo de servicio

**UI:**
- Dashboard con cards de KPIs
- Filtros por período/mecánico

---

### Sprint 7: `auto_portal` — Portal del Cliente

**Propósito**: El cliente ve el status de su vehículo, fotos de la inspección, y aprueba presupuestos.

**Funcionalidades:**
- Ver status actual del vehículo ("En diagnóstico", "Listo para retirar")
- Ver fotos de la inspección (galería con hallazgos)
- Aprobar/rechazar items del presupuesto
- Ver historial de servicios del vehículo
- Recibir notificaciones de cambio de status

**UI (portal pages):**
- Dashboard (status actual + próxima cita)
- Inspección (galería de fotos + condición por sistema)
- Presupuesto (items con checkbox aprobar/rechazar)
- Historial (servicios anteriores)

---

## Diferenciadores vs. Talleres Tradicionales

| Taller Tradicional | Con Aika |
|---|---|
| Papel y lápiz | Todo digital |
| "Ya está listo" por teléfono | Notificación automática + portal |
| "Confíe en mí" | Fotos del problema real |
| Presupuesto verbal | Presupuesto detallado por WhatsApp |
| Sin historial | Historial completo por vehículo |
| Sin control de repuestos | Inventario con alertas |
| Sin métricas | Dashboard con KPIs |

---

## Notas Técnicas

- Las fotos se almacenan via el módulo `attachments` de Open Mercato (ya activo)
- El upload desde cámara usa `<input type="file" accept="image/*" capture="environment">` (HTML5 nativo)
- Las anotaciones en fotos (círculos, flechas) se guardan como JSON y se renderizan con Canvas/SVG
- Los links públicos (inspección, presupuesto) usan el patrón de `property_portal` (página sin auth)
- El envío por WhatsApp usa el patrón de `tuition/whatsapp-cobro` (wa.me links)
- Todos los módulos son `from: '@app'` — no modifican Open Mercato core
