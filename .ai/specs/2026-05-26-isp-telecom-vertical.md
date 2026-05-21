# Vertical Telecomunicaciones / ISP — Spec

## Summary

Vertical completa para ISPs (Internet Service Providers) y operadores de telecomunicaciones en Venezuela. Gestiona el ciclo de vida completo del suscriptor: prospecto → instalación → servicio activo → cobranza recurrente → soporte técnico → retención o churn.

El mercado venezolano tiene características únicas que condicionan cada módulo: pagos en divisas con IGTF, facturación dual USD/VES, cortes eléctricos frecuentes como principal causa de averías, WhatsApp como canal primario de comunicación con clientes, y ecosistema tecnológico dominado por MikroTik + Ubiquiti + Huawei en last-mile.

**Mercado objetivo**: ISPs locales con 200–50.000 suscriptores. Desde microempresas familiares hasta operadoras regionales que compiten con CANTV/Inter/Netuno.

---

## Contexto operativo venezolano

### Realidad del mercado

- **Cientos de ISPs locales** operan en Venezuela, la mayoría PYMEs sin sistema integrado
- **WhatsApp** es el canal de soporte, ventas y cobranza para el 90% de los ISPs
- Los clientes pagan de forma **irregular**: no exactamente el día de vencimiento, sino cuando tienen el dinero o el dólar
- El **técnico de campo** es el recurso más escaso y costoso
- La **electricidad** (CORPOELEC) es la primera causa de averías: apagones programados (racionamiento) y no programados son cotidianos en todo el país

### Tecnologías de red predominantes en Venezuela

| Tecnología | Uso | Equipos típicos |
|---|---|---|
| **Wireless last-mile** | 70% de ISPs locales | Ubiquiti AirFiber, AirMax, LiteBeam; Cambium ePMP; MikroTik SXT/LHG |
| **Fibra GPON** | ISPs urbanos grandes | OLTs Huawei MA5800, ZTE C300; ONT HG8145/HG8247 |
| **Fibra dedicada P2P** | Clientes corporativos | Equipos WDWM, MediaConverter |
| **Coaxial (HFC)** | Legado | Algunos ISPs que heredaron infraestructura InterCable |
| **Microwave** | Backhaul entre nodos | Ubiquiti AirFiber, UBNT Rocket |

### Sistema de autenticación típico

- **PPPoE sobre Radius** (FreeRadius + MikroTik): 60% de ISPs locales
- **GPON con OLT**: autenticación por Serial/MAC de ONT
- **CGNat + gestión de velocidad**: via MikroTik Queue o Huawei HQoS
- Algunos ISPs más avanzados usan **Splynx**, **WHMCS** o **NOC Tools** — este sistema los reemplaza

### Ciclo de pago venezolano

```
Fecha de vencimiento
      ↓
+3 días: La mayoría paga (los más responsables)
+7 días: 70% ha pagado
+15 días: Solo clientes corporativos con acuerdo
+30 días: El ISP asume churn — suspende definitivamente
```

El ISP **no puede cortar de inmediato** porque el cliente puede pagar en cualquier momento del día via Pago Móvil y exige reconexión inmediata. La automatización de reconexión es un diferenciador clave.

### Problemas críticos que este sistema resuelve

1. **Gestión manual de cortes**: Hoy muchos ISPs tienen una hoja de Excel con morosos. El técnico corta manualmente en el router. Con este sistema, el corte es automático via API al Radius.
2. **Averías masivas sin comunicación**: Cuando cae un nodo, el ISP recibe 200 llamadas simultáneas a WhatsApp. Con este sistema, se notifica automáticamente a los afectados antes de que llamen.
3. **Deuda técnica en inventario**: Los CPEs (routers/antenas) de los clientes se pierden. El sistema lleva control de cada equipo con su número de serie, cliente asignado y estado.
4. **Comisiones de técnicos no trazables**: El técnico instaló, ¿le pagaron su comisión? El sistema lo registra.
5. **Clientes que desaparecen sin avisar**: El sistema detecta señales de churn antes de que se vayan.

---

## Módulos (9 total)

| Módulo | ID | Propósito |
|--------|----|-----------|
| Abonados | `isp_subscribers` | Corazón del sistema — registro y estado del servicio |
| Infraestructura de Red | `isp_network` | Nodos, CPE, fibra, impacto de averías |
| Planes y Tarifas | `isp_plans` | Catálogo de planes, velocidades, tecnologías |
| Facturación Recurrente | `isp_billing` | Ciclos, facturas, cobros, morosos |
| Soporte Técnico | `isp_support` | Tickets, averías, SLA, escalaciones |
| Técnicos de Campo | `isp_technicians` | Work orders, rutas, inventario móvil |
| Ventas y Cobertura | `isp_sales` | Pipeline, cobertura, comisiones |
| Monitoreo | `isp_monitoring` | Webhooks Zabbix/PRTG → acciones en Aika |
| Portal del Abonado | `isp_portal` | Autogestión: facturas, tickets, pagos |

---

## Módulo 1: `isp_subscribers` — Abonados

### Resumen
El registro central del suscriptor. Extiende la persona/empresa del módulo `customers` con los datos específicos de telecomunicaciones. Un suscriptor es un cliente que tiene un servicio activo (o en proceso de activación).

### Entidades

#### `isp_subscribers`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | gen_random_uuid() | PK |
| tenant_id | uuid | Sí | — | Multi-tenant |
| organization_id | uuid | Sí | — | Multi-tenant |
| customer_entity_id | uuid | No | null | FK → customers (person/company) |
| account_number | varchar(20) | Sí | — | Número de cuenta único (ej: ISP-00001) |
| subscriber_type | varchar(20) | Sí | 'residential' | residential/pyme/corporate/wholesale |
| service_status | varchar(30) | Sí | 'pending_installation' | Ver lifecycle |
| plan_id | uuid | No | null | FK → isp_plans |
| node_id | uuid | No | null | FK → isp_network_nodes |
| monthly_price_usd | decimal(10,2) | Sí | — | Precio en USD |
| installation_address | text | Sí | — | Dirección completa |
| installation_city | varchar(100) | Sí | — | Ciudad |
| installation_state | varchar(100) | No | null | Estado/municipio |
| coordinates_lat | decimal(10,7) | No | null | GPS lat |
| coordinates_lng | decimal(10,7) | No | null | GPS lng |
| reference_description | text | No | null | "Casa blanca, portón azul, frente a..." |
| cpe_id | uuid | No | null | FK → isp_cpe_deployments |
| ip_address | varchar(45) | No | null | IP asignada (IPv4 o IPv6) |
| mac_address | varchar(17) | No | null | MAC del CPE |
| pppoe_username | varchar(100) | No | null | Credencial Radius (si aplica) |
| billing_cycle_day | smallint | Sí | 1 | Día de vencimiento (1-28) |
| cut_policy_days | smallint | Sí | 7 | Días de gracia antes del corte |
| activation_date | date | No | null | Fecha de activación del servicio |
| last_payment_date | date | No | null | Última fecha de pago registrada |
| assigned_agent_id | uuid | No | null | FK → staff (agente comercial) |
| assigned_technician_id | uuid | No | null | FK → isp_field_technicians |
| technical_contact_name | varchar(255) | No | null | Para corporativos: contacto técnico |
| technical_contact_phone | varchar(30) | No | null | |
| notes | text | No | null | Notas internas |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |
| deleted_at | timestamptz | No | null | Soft delete |

#### Status lifecycle del servicio

```
pending_installation → active ← suspended_overdue
                              ← suspended_voluntary
                              ← active (reconexión)
active → suspended_overdue   (corte por mora, automático)
active → suspended_voluntary (solicitud del cliente)
active → cancelled           (cancelación definitiva)
active → pending_change_plan (en proceso de cambio de plan)
any → cancelled
```

- `pending_installation`: prospecto aprobado, esperando visita técnica
- `active`: servicio funcionando
- `suspended_overdue`: cortado automáticamente por falta de pago
- `suspended_voluntary`: el cliente pidió suspensión temporal (ej: vacaciones, mudanza próxima)
- `cancelled`: baja definitiva del servicio

#### `isp_subscriber_contracts`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | PK |
| tenant_id | uuid | Sí | — | |
| subscriber_id | uuid | Sí | — | FK |
| contract_number | varchar(30) | Sí | — | Correlativo |
| contract_type | varchar(20) | Sí | 'monthly' | monthly/annual/special |
| start_date | date | Sí | — | |
| end_date | date | No | null | Para contratos anuales |
| is_active | boolean | Sí | true | |
| monthly_price_usd | decimal(10,2) | Sí | — | Precio en el contrato |
| installation_fee_usd | decimal(10,2) | Sí | '0' | Cobro de instalación |
| deposit_usd | decimal(10,2) | Sí | '0' | Depósito por equipos |
| penalty_clause | text | No | null | Penalidad por cancelación anticipada |
| signed_at | timestamptz | No | null | Fecha de firma |
| document_url | text | No | null | Link al PDF del contrato |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |

### API Endpoints

| Método | Path | Feature | Descripción |
|--------|------|---------|-------------|
| GET | /api/isp-subscribers | isp_subscribers.view | Lista con filtros (estado, nodo, agente, plan, mora) |
| POST | /api/isp-subscribers | isp_subscribers.create | Crear abonado |
| PUT | /api/isp-subscribers | isp_subscribers.edit | Actualizar datos |
| DELETE | /api/isp-subscribers | isp_subscribers.delete | Baja (soft delete) |
| POST | /api/isp-subscribers/change-status | isp_subscribers.suspend | Cambiar estado del servicio |
| GET | /api/isp-subscribers/overdue | isp_subscribers.view | Lista de morosos con días de atraso |
| GET | /api/isp-subscribers/[id]/history | isp_subscribers.view | Historial de pagos + tickets |
| GET | /api/isp-subscribers/contracts | isp_subscribers.view | Contratos |
| POST | /api/isp-subscribers/contracts | isp_subscribers.manage_contracts | Crear contrato |

### RBAC Features

```
isp_subscribers.view               — Ver abonados (employee default)
isp_subscribers.create             — Crear abonados (employee default)
isp_subscribers.edit               — Editar datos del abonado (employee default)
isp_subscribers.delete             — Eliminar (admin)
isp_subscribers.suspend            — Suspender / reactivar servicio (employee)
isp_subscribers.manage_contracts   — Gestionar contratos (admin)
isp_subscribers.view_financials    — Ver info financiera / mora (employee)
```

### Admin Pages

| Ruta | Descripción |
|------|-------------|
| /backend/isp-subscribers | Lista principal: DataTable con filtros por estado, nodo, plan, mora |
| /backend/isp-subscribers/create | Formulario de alta de nuevo abonado |
| /backend/isp-subscribers/[id] | Detalle: tabs Info · Red · Facturación · Tickets · Historial |
| /backend/isp-subscribers/overdue | Lista de morosos con acciones masivas (notificar, suspender) |

### Seed defaults

```
subscriber_types: residential, pyme, corporate, wholesale
cut_policy_by_type: residential=7d, pyme=10d, corporate=15d, wholesale=acuerdo_especial
billing_cycle_days: 1 (default), configurable por abonado
```

### Events

```
isp_subscribers.subscriber.created           — Nuevo abonado registrado
isp_subscribers.subscriber.activated         — Servicio activado (instalación completada)
isp_subscribers.subscriber.suspended_overdue — Servicio suspendido por mora (clientBroadcast)
isp_subscribers.subscriber.reconnected       — Servicio reactivado tras pago
isp_subscribers.subscriber.cancelled         — Servicio cancelado definitivamente
isp_subscribers.subscriber.plan_changed      — Plan de servicio modificado
isp_subscribers.overdue.detected             — Abonado alcanzó días de gracia (trigger billing)
```

---

## Módulo 2: `isp_network` — Infraestructura de Red

### Resumen
Mapa de la infraestructura física y lógica del ISP. Permite calcular el impacto real de una avería: ¿cuántos suscriptores se ven afectados si cae el nodo Barquisimeto-Norte?

### Entidades

#### `isp_network_nodes`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | PK |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| name | varchar(100) | Sí | — | "Nodo-BQ-Norte", "POP-Principal-Caracas" |
| node_type | varchar(30) | Sí | — | pop_principal / nodo_distribucion / nodo_acceso / repetidora |
| status | varchar(20) | Sí | 'active' | active / degraded / offline / maintenance |
| city | varchar(100) | Sí | — | Ciudad donde está el nodo |
| address | varchar(500) | No | null | Dirección física |
| coordinates_lat | decimal(10,7) | No | null | GPS |
| coordinates_lng | decimal(10,7) | No | null | GPS |
| total_capacity_mbps | int | No | null | Capacidad total en Mbps |
| used_capacity_mbps | int | No | null | Uso actual (actualizado por monitoreo) |
| total_ports | smallint | No | null | Para switch/OLT: puertos totales |
| used_ports | smallint | No | null | Puertos en uso |
| equipment_model | varchar(100) | No | null | "Huawei MA5800-X17", "MikroTik CCR2004" |
| equipment_serial | varchar(100) | No | null | |
| power_provider | varchar(50) | No | null | "CORPOELEC", "Planta propia", "UPS 8h" |
| has_generator | boolean | Sí | false | ¿Tiene planta eléctrica? |
| battery_hours | smallint | No | null | Horas de autonomía de UPS/batería |
| parent_node_id | uuid | No | null | FK → mismo tabla (árbol de nodos) |
| monitoring_host | varchar(200) | No | null | Host en Zabbix/PRTG para correlación |
| last_outage_at | timestamptz | No | null | Último corte registrado |
| notes | text | No | null | |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |
| deleted_at | timestamptz | No | null | |

#### `isp_network_segments`

Tramos físicos entre nodos (fibra tendida o enlace inalámbrico).

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| node_from_id | uuid | Sí | — | FK nodo origen |
| node_to_id | uuid | Sí | — | FK nodo destino |
| segment_type | varchar(20) | Sí | — | fiber / wireless / coax |
| distance_km | decimal(8,2) | No | null | Distancia en km |
| capacity_mbps | int | No | null | Capacidad del tramo |
| status | varchar(20) | Sí | 'active' | active / degraded / offline |
| installation_date | date | No | null | |
| notes | text | No | null | "Tendido por Av. Libertador" |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |

#### `isp_cpe_inventory`

Inventario central de equipos (routers, ONTs, antenas) propios del ISP.

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| cpe_type | varchar(20) | Sí | — | router / ont / antenna / switch / other |
| brand | varchar(50) | Sí | — | "MikroTik", "Ubiquiti", "Huawei", "ZTE" |
| model | varchar(100) | Sí | — | "hAP ac3", "LiteBeam 5AC", "HG8145" |
| serial_number | varchar(100) | Sí | — | Número de serie (único) |
| mac_address | varchar(17) | No | null | |
| status | varchar(20) | Sí | 'in_stock' | in_stock / deployed / in_repair / written_off |
| purchase_price_usd | decimal(10,2) | No | null | Costo de adquisición |
| purchase_date | date | No | null | |
| notes | text | No | null | "Equipo reacondicionado", "llegó con pantalla rota" |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |
| deleted_at | timestamptz | No | null | |

#### `isp_cpe_deployments`

Registro de qué equipo está instalado en qué abonado.

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| cpe_id | uuid | Sí | — | FK → isp_cpe_inventory |
| subscriber_id | uuid | Sí | — | FK → isp_subscribers |
| installed_at | timestamptz | Sí | now() | |
| installed_by | uuid | No | null | FK → isp_field_technicians |
| uninstalled_at | timestamptz | No | null | null = activo |
| uninstall_condition | varchar(20) | No | null | good / damaged / stolen |
| notes | text | No | null | |
| created_at | timestamptz | Sí | now() | |

### API Endpoints

| Método | Path | Feature | Descripción |
|--------|------|---------|-------------|
| GET | /api/isp-network/nodes | isp_network.view | Lista de nodos |
| POST | /api/isp-network/nodes | isp_network.manage | Crear nodo |
| PUT | /api/isp-network/nodes | isp_network.manage | Actualizar nodo |
| DELETE | /api/isp-network/nodes | isp_network.manage | Eliminar nodo |
| GET | /api/isp-network/nodes/[id]/subscribers | isp_network.view | Abonados conectados a un nodo |
| POST | /api/isp-network/nodes/report-outage | isp_network.report_outage | Reportar caída de nodo (trigger masivo) |
| GET | /api/isp-network/segments | isp_network.view | Tramos de red |
| GET | /api/isp-network/cpe | isp_network.view | Inventario CPE |
| POST | /api/isp-network/cpe | isp_network.manage_cpe | Registrar equipo |
| PUT | /api/isp-network/cpe | isp_network.manage_cpe | Actualizar equipo |
| GET | /api/isp-network/cpe/stock | isp_network.view | CPEs disponibles en bodega |
| GET | /api/isp-network/dashboard | isp_network.view | KPIs: utilización nodos, stock, alertas |

### RBAC Features

```
isp_network.view            — Ver infraestructura (employee)
isp_network.manage          — Gestionar nodos y segmentos (admin)
isp_network.manage_cpe      — Gestionar inventario CPE (employee)
isp_network.report_outage   — Reportar avería de nodo (employee)
isp_network.view_capacity   — Ver métricas de capacidad (admin)
```

### Admin Pages

| Ruta | Descripción |
|------|-------------|
| /backend/isp-network | Mapa de nodos + métricas de capacidad |
| /backend/isp-network/nodes | Lista de nodos con estado y utilización |
| /backend/isp-network/nodes/[id] | Detalle: equipos · abonados conectados · historial averías |
| /backend/isp-network/cpe | Inventario CPE: stock en bodega + desplegados |

### Events

```
isp_network.node.outage_reported      — Nodo reportado como caído (clientBroadcast)
isp_network.node.restored             — Nodo recuperado (clientBroadcast)
isp_network.node.capacity_alert       — Utilización > 80% (alerta interna)
isp_network.cpe.deployed              — Equipo instalado en cliente
isp_network.cpe.uninstalled           — Equipo retirado de cliente
isp_network.cpe.low_stock             — Stock en bodega < umbral mínimo
```

---

## Módulo 3: `isp_plans` — Planes y Tarifas

### Resumen
Catálogo de planes de servicio. Define velocidades, tecnologías y precios. Se usa en el proceso de venta, facturación y en el aprovisionamiento automático.

### Entidades

#### `isp_service_plans`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| name | varchar(100) | Sí | — | "Plan Hogar 20M", "Plan PYME 100M" |
| description | text | No | null | |
| technology | varchar(20) | Sí | — | fiber / wireless / cable / dedicated |
| download_mbps | int | Sí | — | Velocidad de bajada |
| upload_mbps | int | Sí | — | Velocidad de subida |
| is_symmetric | boolean | Sí | false | ¿Velocidad simétrica? |
| monthly_price_usd | decimal(10,2) | Sí | — | Precio mensual en USD |
| installation_fee_usd | decimal(10,2) | Sí | '0' | Cargo de instalación |
| target_segment | varchar(20) | Sí | 'residential' | residential / pyme / corporate / wholesale |
| radius_profile | varchar(100) | No | null | Nombre del perfil en el servidor Radius |
| olt_profile | varchar(100) | No | null | Perfil en OLT para GPON |
| is_active | boolean | Sí | true | Plan disponible para venta |
| is_promotional | boolean | Sí | false | Plan temporal/promocional |
| promotional_until | date | No | null | Fecha fin de promoción |
| sort_order | smallint | Sí | 0 | Orden en la UI |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |
| deleted_at | timestamptz | No | null | |

#### `isp_plan_addons`

Servicios adicionales que se agregan a un plan base.

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| name | varchar(100) | Sí | — | "IP Fija", "Servicio de VoIP", "WiFi Mesh +1" |
| monthly_price_usd | decimal(10,2) | Sí | — | |
| is_active | boolean | Sí | true | |
| created_at | timestamptz | Sí | now() | |

### Seed defaults Venezuela

```
residential:
  - Básico 10Mbps/5Mbps wireless @ $15/mes
  - Estándar 20Mbps/10Mbps wireless @ $25/mes
  - Plus 50Mbps/25Mbps wireless @ $35/mes
  - Fibra 100Mbps simétrico @ $45/mes

pyme:
  - PYME Básico 50Mbps/25Mbps @ $50/mes
  - PYME Plus 100Mbps/50Mbps @ $75/mes
  - PYME Pro 200Mbps simétrico fiber @ $120/mes

addons:
  - IP Fija @ $5/mes
  - VoIP línea @ $10/mes
  - Soporte prioritario @ $15/mes
```

### API Endpoints

| Método | Path | Feature | Descripción |
|--------|------|---------|-------------|
| GET | /api/isp-plans | isp_plans.view | Lista de planes activos |
| POST | /api/isp-plans | isp_plans.manage | Crear plan |
| PUT | /api/isp-plans | isp_plans.manage | Editar plan |
| DELETE | /api/isp-plans | isp_plans.manage | Desactivar plan |
| GET | /api/isp-plans/addons | isp_plans.view | Servicios adicionales |
| POST | /api/isp-plans/addons | isp_plans.manage | Crear addon |

### RBAC Features

```
isp_plans.view    — Ver catálogo de planes (employee)
isp_plans.manage  — Crear/editar planes y precios (admin)
```

---

## Módulo 4: `isp_billing` — Facturación Recurrente

### Resumen
Motor de facturación mensual con lógica específica para ISPs en Venezuela: cargos en USD, conversión a VES al tipo BCV del día de emisión, IVA 16%, IGTF 3% en pagos en divisas, y control de morosos con política de corte configurable.

### Entidades

#### `isp_invoices`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| subscriber_id | uuid | Sí | — | FK |
| invoice_number | varchar(30) | Sí | — | FAC-202605-00001 (formato venezolano) |
| control_number | varchar(30) | No | null | Número de control SENIAT (si aplica) |
| period_month | varchar(7) | Sí | — | "2026-05" — período facturado |
| issue_date | date | Sí | — | Fecha de emisión |
| due_date | date | Sí | — | Fecha de vencimiento |
| status | varchar(20) | Sí | 'pending' | pending / partial / paid / overdue / cancelled / in_dispute |
| base_amount_usd | decimal(10,2) | Sí | — | Monto base del plan en USD |
| addons_amount_usd | decimal(10,2) | Sí | '0' | Cargos adicionales |
| discount_amount_usd | decimal(10,2) | Sí | '0' | Descuentos |
| subtotal_usd | decimal(10,2) | Sí | — | subtotal antes de impuestos |
| iva_rate | decimal(5,2) | Sí | '16.00' | % IVA |
| iva_amount_ves | decimal(18,2) | No | null | IVA en bolívares |
| bcv_rate | decimal(18,4) | No | null | Tasa BCV del día de emisión |
| total_usd | decimal(10,2) | Sí | — | Total a pagar en USD |
| total_ves | decimal(18,2) | No | null | Equivalente en VES (referencial) |
| paid_amount_usd | decimal(10,2) | Sí | '0' | Pagado hasta ahora |
| balance_usd | decimal(10,2) | Sí | — | Saldo pendiente |
| paid_at | timestamptz | No | null | Fecha del último pago |
| notes | text | No | null | |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |
| deleted_at | timestamptz | No | null | |

#### `isp_payments`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| invoice_id | uuid | Sí | — | FK → isp_invoices |
| subscriber_id | uuid | Sí | — | FK (desnormalizado para reportes) |
| payment_date | date | Sí | — | Fecha del pago |
| amount_usd | decimal(10,2) | Sí | — | Monto en USD o equivalente |
| currency | varchar(10) | Sí | 'USD' | USD / VES / USDT |
| payment_method | varchar(30) | Sí | — | zelle / pago_movil / efectivo_usd / efectivo_ves / transferencia / binance / otro |
| reference_number | varchar(100) | No | null | Número de referencia bancaria |
| igtf_applies | boolean | Sí | false | ¿Se aplica IGTF 3%? |
| igtf_amount_usd | decimal(10,2) | Sí | '0' | Monto IGTF |
| bcv_rate_at_payment | decimal(18,4) | No | null | Tasa BCV al momento del pago |
| amount_ves | decimal(18,2) | No | null | Monto en VES si pagó en bolívares |
| confirmed_by | uuid | No | null | FK → staff (quién confirmo el pago) |
| confirmed_at | timestamptz | No | null | |
| photo_receipt_url | text | No | null | Link a comprobante de pago |
| notes | text | No | null | |
| created_at | timestamptz | Sí | now() | |

#### `isp_billing_cycles`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| name | varchar(100) | Sí | — | "Ciclo 1 — Residencial día 1" |
| billing_day | smallint | Sí | 1 | Día del mes para facturar (1-28) |
| segment | varchar(20) | No | null | Si aplica a un segmento específico |
| is_active | boolean | Sí | true | |
| created_at | timestamptz | Sí | now() | |

### Proceso de facturación mensual (worker)

```
1. El día del billing_cycle, el worker genera facturas para todos los abonados activos de ese ciclo
2. Para cada factura:
   a. Consulta tasa BCV del día via venezuela_rates
   b. Calcula IVA 16% sobre el equivalente en VES
   c. Genera número de factura en formato FAC-{YYYYMM}-{seq}
   d. Marca estado: pending
3. Envía facturas por WhatsApp/email al abonado (Resend)
4. Worker de morosos: corre diariamente
   a. Identifica facturas vencidas más de X días según cut_policy_days del abonado
   b. Envía pre-notificación WhatsApp (3 días antes del corte)
   c. Al cumplir los días: emite evento isp_billing.cut_triggered
   d. isp_monitoring recibe el evento y ejecuta el corte en Radius/OLT
```

### API Endpoints

| Método | Path | Feature | Descripción |
|--------|------|---------|-------------|
| GET | /api/isp-billing/invoices | isp_billing.view | Lista de facturas con filtros |
| POST | /api/isp-billing/invoices | isp_billing.manage | Crear factura manual |
| PUT | /api/isp-billing/invoices | isp_billing.manage | Editar factura |
| POST | /api/isp-billing/invoices/generate | isp_billing.generate | Generar batch mensual |
| GET | /api/isp-billing/payments | isp_billing.view | Pagos recibidos |
| POST | /api/isp-billing/payments | isp_billing.register_payment | Registrar pago |
| GET | /api/isp-billing/overdue | isp_billing.view | Morosos por segmento |
| GET | /api/isp-billing/dashboard | isp_billing.view | KPIs: cobrado, pendiente, por vencer |
| GET | /api/isp-billing/invoices/[id]/pdf | isp_billing.view | PDF de factura |

### RBAC Features

```
isp_billing.view            — Ver facturas y pagos (employee)
isp_billing.manage          — Crear/editar facturas (admin)
isp_billing.register_payment — Registrar cobros (employee)
isp_billing.generate        — Ejecutar facturación masiva (admin)
isp_billing.cancel_invoice  — Cancelar facturas (admin)
isp_billing.view_reports    — Ver reportes financieros (admin)
```

### Events

```
isp_billing.invoice.generated            — Factura mensual creada
isp_billing.invoice.paid                 — Factura pagada (clientBroadcast)
isp_billing.invoice.partial_payment      — Pago parcial registrado
isp_billing.invoice.overdue              — Factura vencida (días de gracia pasados)
isp_billing.cut_triggered                — Corte por mora activado → provisioning
isp_billing.reconnect_triggered          — Pago recibido → reactivar servicio → provisioning
```

---

## Módulo 5: `isp_support` — Soporte Técnico

### Resumen
Sistema de tickets de soporte para el ISP. Maneja averías individuales y masivas (múltiples abonados afectados por el mismo nodo caído), con escalación automática y SLA configurable por segmento.

### Entidades

#### `isp_support_tickets`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| ticket_number | varchar(20) | Sí | — | TKT-202605-00001 |
| subscriber_id | uuid | No | null | FK (null si es avería masiva sin abonado específico) |
| node_id | uuid | No | null | FK → isp_network_nodes (para averías por nodo) |
| outage_id | uuid | No | null | FK → isp_outages (si es parte de avería masiva) |
| type | varchar(30) | Sí | — | fault / inquiry / plan_change / move / new_service / complaint |
| origin | varchar(20) | Sí | 'manual' | manual / whatsapp / phone / portal / automatic_monitoring |
| status | varchar(20) | Sí | 'open' | open / assigned / in_progress / pending_client / resolved / closed |
| priority | varchar(10) | Sí | 'normal' | low / normal / high / critical |
| subject | varchar(255) | Sí | — | Descripción breve |
| description | text | No | null | Detalle completo |
| solution | text | No | null | Solución aplicada |
| assigned_to | uuid | No | null | FK → isp_field_technicians |
| assigned_at | timestamptz | No | null | |
| resolved_at | timestamptz | No | null | |
| closed_at | timestamptz | No | null | |
| sla_hours | smallint | No | null | SLA en horas según tipo y segmento |
| sla_breached | boolean | Sí | false | ¿Se incumplió el SLA? |
| escalated_to | uuid | No | null | FK → staff (supervisor/gerente) |
| escalated_at | timestamptz | No | null | |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |

#### `isp_ticket_comments`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| ticket_id | uuid | Sí | — | FK |
| author_id | uuid | Sí | — | FK → staff |
| comment | text | Sí | — | |
| is_internal | boolean | Sí | true | false = visible al cliente en portal |
| created_at | timestamptz | Sí | now() | |

#### `isp_outages`

Averías masivas que agrupan múltiples tickets afectados por la misma causa (nodo caído).

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| node_id | uuid | Sí | — | FK → isp_network_nodes |
| outage_number | varchar(20) | Sí | — | AVR-202605-0001 |
| cause | varchar(30) | Sí | — | power_outage / fiber_cut / equipment_failure / maintenance / weather / theft / unknown |
| status | varchar(20) | Sí | 'active' | active / investigating / resolved |
| affected_subscribers | int | Sí | 0 | Calculado al crear la avería |
| started_at | timestamptz | Sí | now() | |
| resolved_at | timestamptz | No | null | |
| resolution_notes | text | No | null | |
| notified_subscribers | boolean | Sí | false | ¿Se envió notificación masiva? |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |

### SLA por defecto (configurable)

| Segmento | Tipo avería | SLA |
|---|---|---|
| Residencial | Fault | 24h |
| PYME | Fault | 8h |
| Corporativo | Fault | 4h |
| Masiva (>50 abonados) | Outage | 2h hasta escalación |

### API Endpoints

| Método | Path | Feature | Descripción |
|--------|------|---------|-------------|
| GET | /api/isp-support/tickets | isp_support.view | Lista tickets con filtros |
| POST | /api/isp-support/tickets | isp_support.create | Crear ticket |
| PUT | /api/isp-support/tickets | isp_support.manage | Actualizar ticket |
| POST | /api/isp-support/tickets/[id]/assign | isp_support.assign | Asignar técnico |
| POST | /api/isp-support/tickets/[id]/resolve | isp_support.resolve | Resolver ticket |
| GET | /api/isp-support/outages | isp_support.view | Averías masivas activas |
| POST | /api/isp-support/outages | isp_support.manage_outages | Crear avería masiva |
| POST | /api/isp-support/outages/[id]/resolve | isp_support.manage_outages | Cerrar avería |
| GET | /api/isp-support/dashboard | isp_support.view | KPIs: abiertos, por SLA, por tipo |

### RBAC Features

```
isp_support.view            — Ver tickets (employee)
isp_support.create          — Crear tickets (employee)
isp_support.manage          — Editar y gestionar tickets (employee)
isp_support.assign          — Asignar técnicos (employee)
isp_support.resolve         — Resolver y cerrar tickets (employee)
isp_support.manage_outages  — Gestionar averías masivas (admin)
isp_support.view_sla        — Ver métricas SLA (admin)
```

### Events

```
isp_support.ticket.created              — Ticket creado
isp_support.ticket.assigned             — Técnico asignado (clientBroadcast)
isp_support.ticket.resolved             — Ticket resuelto (clientBroadcast para portal)
isp_support.ticket.sla_breached         — SLA incumplido → escalación
isp_support.outage.created              — Avería masiva creada (clientBroadcast)
isp_support.outage.resolved             — Avería resuelta (clientBroadcast)
isp_support.outage.subscribers_notified — Notificación masiva enviada
```

---

## Módulo 6: `isp_technicians` — Técnicos de Campo

### Resumen
Gestión de los técnicos de instalación y mantenimiento. Work orders, agenda optimizada por zona, inventario móvil de equipos, y control de eficiencia.

### Entidades

#### `isp_field_technicians`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| staff_id | uuid | No | null | FK → staff (si tiene acceso al sistema) |
| name | varchar(255) | Sí | — | |
| phone | varchar(30) | Sí | — | Número WhatsApp |
| status | varchar(20) | Sí | 'available' | available / on_route / on_site / off_duty |
| coverage_zone | varchar(100) | No | null | "Zona Norte Caracas", "Barquisimeto Sur" |
| vehicle_plate | varchar(10) | No | null | Placa del vehículo |
| fuel_allowance_usd | decimal(8,2) | No | null | Asignación mensual de combustible |
| commission_per_install | decimal(8,2) | No | null | Comisión por instalación |
| notes | text | No | null | |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |
| deleted_at | timestamptz | No | null | |

#### `isp_work_orders`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| work_order_number | varchar(20) | Sí | — | OT-202605-00001 |
| type | varchar(30) | Sí | — | installation / repair / equipment_swap / uninstall / verification |
| status | varchar(20) | Sí | 'pending' | pending / scheduled / in_progress / completed / cancelled |
| priority | varchar(10) | Sí | 'normal' | low / normal / high / urgent |
| subscriber_id | uuid | No | null | FK |
| ticket_id | uuid | No | null | FK (si viene de un ticket) |
| technician_id | uuid | No | null | FK → isp_field_technicians |
| scheduled_date | date | No | null | Fecha programada |
| scheduled_time | varchar(10) | No | null | "08:00-10:00" ventana horaria |
| address | text | Sí | — | Dirección de la visita |
| coordinates_lat | decimal(10,7) | No | null | |
| coordinates_lng | decimal(10,7) | No | null | |
| instructions | text | No | null | "Llevar ONT Huawei HG8145, cliente en piso 3" |
| cpe_to_install_id | uuid | No | null | FK → isp_cpe_inventory (equipo a instalar) |
| cpe_installed_id | uuid | No | null | FK → isp_cpe_inventory (equipo que finalmente se instaló) |
| completion_notes | text | No | null | Notas del técnico al completar |
| completed_at | timestamptz | No | null | |
| km_traveled | decimal(8,2) | No | null | Kilómetros recorridos (para calcular combustible) |
| technician_signature_url | text | No | null | Foto de firma del cliente |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |

### API Endpoints

| Método | Path | Feature | Descripción |
|--------|------|---------|-------------|
| GET | /api/isp-technicians | isp_technicians.view | Lista de técnicos |
| POST | /api/isp-technicians | isp_technicians.manage | Crear técnico |
| PUT | /api/isp-technicians | isp_technicians.manage | Actualizar técnico |
| GET | /api/isp-technicians/work-orders | isp_technicians.view | Órdenes de trabajo |
| POST | /api/isp-technicians/work-orders | isp_technicians.manage | Crear OT |
| PUT | /api/isp-technicians/work-orders | isp_technicians.manage | Actualizar OT |
| POST | /api/isp-technicians/work-orders/[id]/complete | isp_technicians.complete_orders | Completar OT |
| GET | /api/isp-technicians/[id]/agenda | isp_technicians.view | Agenda del técnico |
| GET | /api/isp-technicians/dashboard | isp_technicians.view | KPIs: OTs por técnico, eficiencia |

### RBAC Features

```
isp_technicians.view            — Ver técnicos y OTs (employee)
isp_technicians.manage          — Crear/editar técnicos y OTs (admin)
isp_technicians.complete_orders — Registrar completación de OT (employee)
isp_technicians.view_reports    — Ver reportes de productividad (admin)
```

### Events

```
isp_technicians.work_order.created    — OT creada
isp_technicians.work_order.assigned   — OT asignada a técnico (clientBroadcast)
isp_technicians.work_order.completed  — OT completada (clientBroadcast)
isp_technicians.work_order.cancelled  — OT cancelada
isp_technicians.installation.done     — Instalación completada → activar suscriptor
```

---

## Módulo 7: `isp_sales` — Ventas y Cobertura

### Resumen
Pipeline comercial especializado para ISPs. Incluye verificación de cobertura geográfica, gestión de leads con sus canales de entrada predominantes en Venezuela (WhatsApp, Instagram, referidos), y cálculo automático de comisiones para agentes.

### Entidades

#### `isp_coverage_zones`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| name | varchar(100) | Sí | — | "Zona Norte Caracas — La Castellana" |
| city | varchar(100) | Sí | — | |
| node_id | uuid | Sí | — | FK → nodo que da servicio a esta zona |
| has_coverage | boolean | Sí | true | |
| technology_available | varchar(20) | Sí | — | fiber / wireless / both |
| max_speed_mbps | int | No | null | Velocidad máxima disponible en la zona |
| notes | text | No | null | "Cobertura limitada en el sector B" |
| polygon_geojson | text | No | null | GeoJSON del polígono de cobertura |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |

#### `isp_leads`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| name | varchar(255) | Sí | — | Nombre del prospecto |
| phone | varchar(30) | Sí | — | WhatsApp principal |
| email | varchar(255) | No | null | |
| address | text | Sí | — | Dirección de instalación |
| city | varchar(100) | Sí | — | |
| source | varchar(30) | Sí | 'whatsapp' | whatsapp / instagram / referral / website / cold_call / other |
| referral_subscriber_id | uuid | No | null | FK → isp_subscribers (referido por) |
| status | varchar(20) | Sí | 'new' | new / coverage_check / quoted / scheduled / installed / lost |
| coverage_status | varchar(20) | No | null | covered / not_covered / waitlist |
| coverage_zone_id | uuid | No | null | FK → isp_coverage_zones |
| interested_plan_id | uuid | No | null | FK → isp_service_plans |
| quote_sent_at | timestamptz | No | null | |
| installation_date | date | No | null | Fecha agendada |
| assigned_agent_id | uuid | No | null | FK → staff |
| lost_reason | varchar(50) | No | null | price / no_coverage / chose_competitor / not_responsive / other |
| notes | text | No | null | |
| created_at | timestamptz | Sí | now() | |
| updated_at | timestamptz | Sí | now() | |
| deleted_at | timestamptz | No | null | |

#### `isp_commissions`

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| agent_id | uuid | Sí | — | FK → staff |
| subscriber_id | uuid | Sí | — | FK → isp_subscribers |
| commission_type | varchar(20) | Sí | — | installation / retention_3m / retention_6m / upgrade |
| amount_usd | decimal(8,2) | Sí | — | |
| period_month | varchar(7) | No | null | Para comisiones de retención |
| status | varchar(20) | Sí | 'pending' | pending / approved / paid / cancelled |
| paid_at | date | No | null | |
| notes | text | No | null | |
| created_at | timestamptz | Sí | now() | |

### Pipeline stages

```
new → coverage_check → quoted → scheduled → installed (activo como suscriptor) → lost
              ↓ not_covered
         coverage_zone.waitlist (espera expansión)
```

### API Endpoints

| Método | Path | Feature | Descripción |
|--------|------|---------|-------------|
| GET | /api/isp-sales/leads | isp_sales.view | Pipeline de leads |
| POST | /api/isp-sales/leads | isp_sales.create_leads | Crear lead |
| PUT | /api/isp-sales/leads | isp_sales.manage_leads | Actualizar lead |
| POST | /api/isp-sales/leads/check-coverage | isp_sales.view | Verificar cobertura por dirección |
| GET | /api/isp-sales/coverage-zones | isp_sales.view | Zonas de cobertura |
| POST | /api/isp-sales/coverage-zones | isp_sales.manage_coverage | Crear zona |
| GET | /api/isp-sales/commissions | isp_sales.view_commissions | Lista de comisiones |
| POST | /api/isp-sales/commissions/approve | isp_sales.approve_commissions | Aprobar comisiones |
| GET | /api/isp-sales/dashboard | isp_sales.view | Embudo: leads, conversión, ingresos |

### RBAC Features

```
isp_sales.view                — Ver leads y cobertura (employee)
isp_sales.create_leads        — Crear leads (employee)
isp_sales.manage_leads        — Gestionar pipeline (employee)
isp_sales.manage_coverage     — Editar zonas de cobertura (admin)
isp_sales.view_commissions    — Ver comisiones (employee para las propias)
isp_sales.approve_commissions — Aprobar y pagar comisiones (admin)
```

### Events

```
isp_sales.lead.created          — Nuevo lead registrado
isp_sales.lead.coverage_checked — Cobertura verificada
isp_sales.lead.converted        — Lead convertido a suscriptor
isp_sales.lead.lost             — Lead perdido
isp_sales.commission.generated  — Comisión generada
```

---

## Módulo 8: `isp_monitoring` — Monitoreo e Integración

### Resumen
Módulo de integración sin backend propio. Recibe alertas de sistemas de monitoreo (Zabbix, PRTG, LibreNMS) via webhook y ejecuta acciones automatizadas en Aika: crear averías masivas, notificar suscriptores, activar cortes, y enviar reconexiones.

### Entidades

#### `isp_monitoring_events`

Log de eventos recibidos del sistema de monitoreo.

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| organization_id | uuid | Sí | — | |
| source | varchar(30) | Sí | — | zabbix / prtg / librenms / custom |
| event_type | varchar(30) | Sí | — | node_down / node_up / high_capacity / performance_degraded |
| node_id | uuid | No | null | FK → isp_network_nodes (si se pudo correlacionar) |
| monitoring_host | varchar(200) | Sí | — | "Nodo-BQ-Norte" (como lo llama el NMS) |
| raw_payload | text | Sí | — | JSON original del webhook |
| action_taken | varchar(50) | No | null | outage_created / subscribers_notified / ticket_created / ignored |
| action_id | uuid | No | null | ID de la acción creada (avería, ticket, etc.) |
| processed_at | timestamptz | No | null | |
| created_at | timestamptz | Sí | now() | |

#### `isp_provisioning_log`

Log de comandos enviados a Radius/OLT para activar, suspender o reactivar servicios.

| Columna | Tipo | Req | Default | Notas |
|---------|------|-----|---------|-------|
| id | uuid | Sí | — | |
| tenant_id | uuid | Sí | — | |
| subscriber_id | uuid | Sí | — | FK |
| action | varchar(20) | Sí | — | activate / suspend / reactivate / change_speed |
| target_system | varchar(20) | Sí | — | radius / olt_gpon / olt_wireless |
| command_sent | text | No | null | Comando ejecutado (log) |
| status | varchar(20) | Sí | 'pending' | pending / success / failed |
| response | text | No | null | Respuesta del sistema de red |
| triggered_by | varchar(30) | Sí | — | payment / overdue_cut / manual / monitoring |
| created_at | timestamptz | Sí | now() | |

### Flujo webhook de avería

```
Zabbix detecta nodo caído
    ↓ POST /api/isp-monitoring/webhook/zabbix
Sistema correlaciona host de Zabbix → NetworkNode
    ↓ si no encuentra nodo: loguea y sale
Obtiene lista de suscriptores activos en ese nodo
    ↓
Crea isp_outages: avería masiva con affected_subscribers count
    ↓ emite isp_monitoring.outage.detected
Crea isp_support_ticket: ticket de avería vinculado a la avería
    ↓
Envía notificación WhatsApp masiva a suscriptores afectados:
    "⚠️ Estimado cliente: detectamos una avería en su zona.
    Nuestro equipo técnico está trabajando en la solución.
    Le notificaremos cuando el servicio sea restaurado."
    ↓
Alerta interna al equipo técnico (notificación in-app)

-- Cuando Zabbix reporta recuperación --
POST /api/isp-monitoring/webhook/zabbix (trigger UP)
    ↓
Cierra la avería y el ticket
    ↓
Envía notificación de resolución a los abonados:
    "✅ El servicio ha sido restaurado en su zona.
    Gracias por su paciencia."
```

### Flujo de corte automático por mora

```
Worker isp_billing (diario) detecta abonado moroso
    ↓ emite isp_billing.cut_triggered
isp_monitoring suscribe al evento
    ↓
Envía comando de suspensión al sistema de autenticación:
    - Radius: deshabilita usuario PPPoE / aplica perfil "cortado"
    - OLT GPON: aplica DBA de 0 kbps al puerto del abonado
    - MikroTik: aplica queue de 0 kbps al IP del abonado
    ↓
Registra en isp_provisioning_log
    ↓
Cambia service_status del abonado a suspended_overdue

-- Cuando se registra el pago --
isp_billing emite isp_billing.reconnect_triggered
    ↓
isp_monitoring suscribe y ejecuta reactivación
    ↓ envía comando de reconexión
Cambia service_status a active
    ↓
WhatsApp al abonado: "✅ Tu servicio ha sido reactivado. ¡Gracias por tu pago!"
```

### API Endpoints

| Método | Path | Feature | Descripción |
|--------|------|---------|-------------|
| POST | /api/isp-monitoring/webhook/zabbix | — | Webhook sin auth (token secret en header) |
| POST | /api/isp-monitoring/webhook/prtg | — | Webhook PRTG |
| POST | /api/isp-monitoring/webhook/generic | — | Webhook genérico |
| POST | /api/isp-monitoring/provisioning/activate | isp_monitoring.provision | Activar servicio manual |
| POST | /api/isp-monitoring/provisioning/suspend | isp_monitoring.provision | Suspender servicio manual |
| POST | /api/isp-monitoring/provisioning/reactivate | isp_monitoring.provision | Reactivar servicio manual |
| GET | /api/isp-monitoring/events | isp_monitoring.view | Log de eventos del NMS |
| GET | /api/isp-monitoring/provisioning-log | isp_monitoring.view | Log de comandos Radius/OLT |

### RBAC Features

```
isp_monitoring.view      — Ver logs de monitoreo y aprovisionamiento (admin)
isp_monitoring.provision — Ejecutar comandos manuales de Radius/OLT (admin)
```

### Events

```
isp_monitoring.outage.detected           — Avería detectada por NMS
isp_monitoring.service.suspended         — Servicio suspendido en red
isp_monitoring.service.reactivated       — Servicio reactivado en red
isp_monitoring.provisioning.failed       — Fallo al ejecutar comando de red (alerta)
```

---

## Módulo 9: `isp_portal` — Portal del Abonado

### Resumen
Portal de autogestión para el suscriptor. Permite consultar su estado de cuenta, ver facturas, reportar una avería, y ver el estado de sus tickets.

### Páginas del portal

| Ruta | Descripción |
|------|-------------|
| /[orgSlug]/portal/home | Dashboard: saldo, estado servicio, tickets abiertos |
| /[orgSlug]/portal/invoices | Mis facturas con links de pago |
| /[orgSlug]/portal/payments | Mis pagos registrados |
| /[orgSlug]/portal/tickets | Mis tickets de soporte |
| /[orgSlug]/portal/tickets/new | Reportar avería o solicitud |
| /[orgSlug]/portal/services | Mi plan y velocidad contratada |

### API Endpoints del portal

| Método | Path | Feature | Descripción |
|--------|------|---------|-------------|
| GET | /api/isp-portal/account | isp_portal.view_account | Datos del abonado |
| GET | /api/isp-portal/invoices | isp_portal.view_account | Mis facturas |
| GET | /api/isp-portal/tickets | isp_portal.view_tickets | Mis tickets |
| POST | /api/isp-portal/tickets | isp_portal.create_ticket | Crear ticket desde portal |
| POST | /api/isp-portal/report-payment | isp_portal.report_payment | Reportar pago (subir foto comprobante) |

### RBAC Features (customer)

```
isp_portal.view_account   — Ver datos de cuenta (customerRoleFeatures: portal_viewer)
isp_portal.view_tickets   — Ver mis tickets
isp_portal.create_ticket  — Crear ticket de soporte
isp_portal.report_payment — Reportar pago
```

---

## Integración con módulos de Open Mercato

| Módulo OM | Cómo se usa |
|---|---|
| `customers` | El abonado se vincula a una persona/empresa via `customer_entity_id` — datos de contacto, historial CRM |
| `venezuela_rates` | Tasa BCV para conversión USD→VES en facturas y pagos |
| `ve_fiscal` | IVA 16%, IGTF 3%, validación RIF del abonado corporativo |
| `payment_methods` | Registro de pagos con los 7 métodos venezolanos |
| `ve_tenant_defaults` | Auto-configura IVA venezolano al crear el tenant |
| `currencies` | Multi-moneda: USD base + VES + USDT |
| `notifications` | In-app alerts para técnicos y operadores |
| `attachments` | Fotos de comprobantes de pago, firma en OTs, fotos de instalación |
| `search` | Búsqueda Cmd+K de abonados, tickets, equipos |
| `customer_accounts` | Auth del portal del abonado |
| `workflows` | Flujos de aprobación para reconexiones especiales, créditos |
| `ai_assistant` | Asistente del Gerente ISP (ver §AI Agent) |

---

## AI Agent — Asistente del Gerente ISP

```typescript
// ai-agents.ts del módulo isp_reports (a crear en Phase 2)
{
  moduleId: 'isp_reports',
  label: 'Asistente del Gerente ISP',
  executionMode: 'chat',
  requiredFeatures: ['isp_subscribers.view', 'isp_billing.view'],
  allowedTools: [
    'isp_reports_summary',     // KPIs: abonados activos, mora, MRR
    'isp_billing_status',       // Estado de cobranza del mes
    'isp_outages_summary',      // Averías activas y resueltas
    'isp_technicians_status',   // Estado de OTs del día
    'isp_churn_risk',           // Abonados en riesgo de churn
  ],
  mutationPolicy: 'requires_approval',
}
```

---

## Phasing — Plan de implementación

### Phase 22-A — Core MVP (4 módulos fundamentales)

1. `isp_plans` — Catálogo de planes (el más simple, base para todo)
2. `isp_network` — Infraestructura: nodos + inventario CPE
3. `isp_subscribers` — Abonados con lifecycle completo
4. `isp_billing` — Facturación y cobros

**Entregable**: Se puede vender, activar, facturar y cobrar un abonado.

### Phase 22-B — Operaciones (3 módulos)

5. `isp_support` — Tickets y averías masivas
6. `isp_technicians` — Técnicos y work orders
7. `isp_sales` — Pipeline comercial y cobertura

**Entregable**: El ISP puede gestionar toda la operación diaria.

### Phase 22-C — Automatización (2 módulos)

8. `isp_monitoring` — Webhooks NMS + aprovisionamiento automático
9. `isp_portal` — Portal de autogestión del abonado

**Entregable**: Sistema completamente automatizado. Cortes y reconexiones sin intervención manual.

---

## Estimación de módulos y entidades

| Módulo | Entidades | Complejidad |
|--------|-----------|-------------|
| `isp_plans` | 2 | Baja |
| `isp_network` | 4 | Media |
| `isp_subscribers` | 2 | Alta (lifecycle + integraciones) |
| `isp_billing` | 3 | Alta (fiscal VE + worker batch) |
| `isp_support` | 3 | Media |
| `isp_technicians` | 2 | Media |
| `isp_sales` | 3 | Media |
| `isp_monitoring` | 2 | Alta (workers + integraciones externas) |
| `isp_portal` | 0 (consume existentes) | Baja |
| **Total** | **21 entidades** | |

---

## Decisiones técnicas

1. **Aprovisionamiento de red**: No integración directa en Phase 22-A. Los comandos a Radius/OLT son opcionales en 22-C. El sistema funciona completamente sin esa integración — solo que el corte/reconexión se haría manualmente.

2. **Número de cuenta único**: Generado automáticamente como `{TENANT_PREFIX}-{SEQ:5}` (ej: `NETBQ-00001`). El prefijo lo configura el ISP en sus settings de tenant.

3. **Facturación en USD con IVA en VES**: La factura muestra el monto en USD y el equivalente en VES según la tasa BCV del día de emisión. El IVA se calcula sobre el monto en VES. Esto sigue la práctica real de los ISPs venezolanos que cotizan en USD pero deben cumplir con el IVA en VES.

4. **WhatsApp**: Las notificaciones usan el worker de WhatsApp wa.me que ya existe en otros módulos. No requiere API oficial de WhatsApp Business en primera fase.

5. **Monitoreo de red**: La integración con Zabbix/PRTG es via webhook entrante. El ISP configura Zabbix para enviar alertas a la URL de webhook de Aika. No hay comunicación saliente de Aika a Zabbix en Phase 22-C básico.

---

## Changelog

- 2026-05-26: Spec inicial creado. Enriquecido con contexto operativo venezolano, tecnologías de red locales, flujos de facturación dual USD/VES, y ciclo de pago irregular venezolano.
