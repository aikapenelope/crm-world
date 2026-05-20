# Roadmap de Verticales y Módulos Regionales

> Mapa completo de todas las verticales planificadas, módulos regionales VE, y estado actual.

---

## Módulos Regionales Venezuela — Estado

### YA CONSTRUIDOS (funcionando)

| Módulo | Qué cubre | Estado |
|---|---|---|
| `venezuela_rates` | Tasas USD/VES/EUR/USDT via DolarApi (BCV + paralelo) | Completo |
| `payment_methods` | 7 métodos: Pago Móvil, Zelle, Binance, Efectivo USD/VES, Transferencia, Débito | Completo |
| `ve_fiscal` | RIF/Cédula validación, IVA config, IGTF config, contribuyente especial, retenciones config | Completo |
| `ve_tenant_defaults` | Auto-config: tasas IVA, diccionarios, formato dirección, numeración docs, IGTF hook | Completo |

### POR CONSTRUIR (módulos fiscales complementarios)

#### `ve_tax_books` — Libros de Compra/Venta IVA

**Propósito**: Registro de facturas emitidas y recibidas para declaración de IVA mensual. NO es facturación electrónica SENIAT — es el registro manual de montos que el contador usa para declarar.

**Entidades:**
```
tax_book_entries
├── id, tenant_id, organization_id
├── book_type: 'sales' | 'purchases'
├── period_month: "2026-10"
├── entry_date
├── document_type: 'factura' | 'nota_credito' | 'nota_debito' | 'comprobante_retencion'
├── document_number
├── control_number (nullable — solo si tiene)
├── counterpart_rif (RIF del cliente/proveedor)
├── counterpart_name
├── is_exempt: boolean (operación exenta)
├── taxable_base (base imponible)
├── tax_rate (16, 8, 15, 0)
├── tax_amount (monto IVA)
├── igtf_amount (monto IGTF, si aplica)
├── withholding_amount (retención IVA, si aplica)
├── total_amount
├── currency, exchange_rate
├── payment_method_code (nullable)
├── notes
├── created_at, updated_at, deleted_at
```

**Funcionalidades:**
- Registro manual de facturas emitidas (ventas)
- Registro manual de facturas recibidas (compras)
- Cálculo automático de IVA según tasa
- Cálculo automático de IGTF si pago en divisas
- Resumen mensual: base imponible, IVA débito fiscal, IVA crédito fiscal
- Exportar a Excel para el contador

---

#### `ve_withholdings` — Retenciones IVA/ISLR

**Propósito**: Cálculo y registro de retenciones cuando la empresa es agente de retención.

**Entidades:**
```
withholding_records
├── id, tenant_id, organization_id
├── type: 'iva' | 'islr'
├── period_month
├── supplier_rif, supplier_name
├── invoice_number, invoice_date
├── invoice_amount, tax_amount
├── withholding_rate (75% IVA, o % ISLR según actividad)
├── withholding_amount (calculado)
├── voucher_number (número de comprobante de retención)
├── status: 'pending' | 'applied' | 'declared'
├── declared_at (nullable)
├── created_at, updated_at
```

**Funcionalidades:**
- Auto-calcular retención IVA (75% del IVA) al registrar compra
- Auto-calcular retención ISLR según actividad del proveedor
- Generar comprobante de retención (para entregar al proveedor)
- Resumen quincenal para declaración (IVA se declara quincenalmente para agentes)

---

#### `ve_tax_reports` — Reportes Fiscales

**Propósito**: Generar los reportes que el contador necesita para declarar.

**Reportes:**
- Resumen IVA mensual (débito - crédito = a pagar/a favor)
- Libro de ventas del período (formato SENIAT)
- Libro de compras del período (formato SENIAT)
- Resumen de retenciones IVA (quincenal)
- Resumen de retenciones ISLR (mensual)
- Resumen IGTF del período
- Exportar todo a Excel/CSV

---

### Sobre Facturación Electrónica SENIAT

La Providencia 102/121 (marzo 2025) obliga a facturación digital con XML firmado para contribuyentes especiales y grandes empresas. Sin embargo:

- La mayoría de PyMEs en VE aún usan factura en papel con número de control manual
- La homologación SENIAT es costosa y compleja (requiere certificado digital, software homologado)
- Nuestro sistema NO implementa facturación electrónica SENIAT
- Lo que hacemos es **llevar el registro de montos** para que el contador declare

Si en el futuro se necesita facturación electrónica, sería un módulo separado (`ve_einvoice`) que:
- Genera XML según formato SENIAT
- Firma digitalmente con certificado
- Envía al portal fiscal
- Almacena respuesta/acuse

Pero eso es un proyecto aparte, no prioritario para PyMEs.

---

## Verticales — Estado y Próximos Pasos

### Completadas

| Vertical | Módulos | Estado |
|---|---|---|
| **Real Estate** | 8 módulos (properties, transactions, matching, portal, docs, publishing, ML sync, market intel) | Completa + UI |
| **Education / Colegios** | 10 módulos (students, enrollment, tuition, grades, attendance, calendar, comms, docs, portal, migration) | Completa + UI |

### En Planificación

| Vertical | Documento | Módulos planificados |
|---|---|---|
| **Distribuidoras** | `docs/DISTRIBUTION_VERTICAL_PLAN.md` | 8 módulos (credit, AR, routes, inventory, delivery, prices, reports, portal) |

### Próximas a Definir

| # | Vertical | Mercado VE | Módulos core que usa | Custom necesario |
|---|---|---|---|---|
| 1 | **Retail / Comercio** | Tiendas, ferreterías, farmacias | catalog, sales, checkout | pos_interface, loyalty, stock_alerts |
| 2 | **Services / Agencias** | Marketing, diseño, consultoría | customers, planner, sales | projects, timesheets, proposals |
| 3 | **Healthcare / Clínicas** | Consultorios, laboratorios | customers, planner, attachments | patients, appointments, medical_records |
| 4 | **Beauty / Salones** | Peluquerías, spas, barberías | customers, planner, sales | bookings, staff_schedule, memberships |
| 5 | **Legal / Abogados** | Bufetes | customers, planner, attachments | cases, billing_hours, court_dates |
| 6 | **Automotive** | Concesionarios, talleres | customers, catalog, sales | vehicles, service_orders, appointments |
| 7 | **Restaurant / Food** | Restaurantes, delivery | catalog, sales, checkout | menu, kitchen_orders, tables |
| 8 | **Construction** | Constructoras | customers, sales, planner | projects, budgets, materials |
| 9 | **Property Management** | Admin edificios | customers, portal, sales | units, leases, condo_fees |
| 10 | **Fitness / Gym** | Gimnasios | customers, portal, sales | memberships, classes, attendance |

---

## Módulos Transversales (aplican a múltiples verticales)

Estos módulos se pueden construir una vez y reutilizar en varias verticales:

| Módulo | Aplica a | Qué hace |
|---|---|---|
| `ve_tax_books` | Distribuidoras, Retail, Services, cualquiera que facture | Libros IVA |
| `ve_withholdings` | Distribuidoras, Construction, cualquiera que sea agente | Retenciones |
| `ve_tax_reports` | Todos | Reportes para el contador |
| `whatsapp_cobro` (patrón) | Education, Distribuidoras, Services | Cobro masivo por wa.me |
| `receipt_generator` (patrón) | Education, Distribuidoras, Retail | Recibos como imagen |
| `csv_migration` (patrón) | Todos | Importar datos de sistema anterior |
| `overdue_worker` (patrón) | Education, Distribuidoras | Auto-marcar morosos |

---

## Prioridad de Implementación Sugerida

1. **Distribuidoras** — ya planificada, alto valor (cuentas por cobrar es el pain #1)
2. **Módulos fiscales VE** — transversal, aplica a todas las verticales
3. **Retail** — alto volumen de clientes potenciales
4. **Services/Agencias** — mercado creciente en VE (freelancers, agencias digitales)
5. **Healthcare** — nicho de alto valor (clínicas privadas)

---

## Integración Bancaria VE — Análisis

### Estado actual
- **Tasas de cambio**: Implementado (DolarApi → BCV + paralelo)
- **Conciliación bancaria**: NO implementado
- **Conexión directa con bancos**: NO viable (los bancos VE no tienen APIs públicas)

### Realidad VE
Los bancos venezolanos (Banesco, Mercantil, Provincial, BNC, BDV) NO ofrecen APIs para terceros. La "integración bancaria" en VE se hace de dos formas:

1. **Manual**: El admin descarga el estado de cuenta del banco (CSV/Excel) y lo sube al sistema para conciliar
2. **Scraping** (no recomendado): Algunos sistemas hacen scraping del portal bancario (frágil, puede violar TOS)

### Lo que podemos hacer
Un módulo `bank_reconciliation` que:
- Permite subir extracto bancario (CSV del banco)
- Parsea los movimientos (cada banco tiene formato diferente)
- Cruza automáticamente con pagos registrados (por referencia, monto, fecha)
- Marca como conciliados los que coinciden
- Lista los no conciliados para revisión manual

Esto es viable y útil sin necesitar API bancaria.

---

## Sobre IGTF y el Flujo Actual

El IGTF ya está implementado como subscriber (`ve_tenant_defaults/subscribers/igtf-hook.ts`):
- Se activa automáticamente cuando un pago se registra en moneda extranjera
- Aplica 3% sobre el total (incluyendo IVA)
- Funciona via el event bus de Open Mercato (`sales.tax.calculate.before`)

Lo que falta es que el IGTF se **registre en el libro de ventas** automáticamente. Eso lo haría el módulo `ve_tax_books` cuando se construya.

---

## Notas Técnicas

- Todos los módulos fiscales son `from: '@app'` — no modifican Open Mercato core
- Los cálculos de impuestos usan el pipeline de `sales` (hooks `calculate.before/after`)
- Las tasas se seedean automáticamente al crear tenant (`ve_tenant_defaults`)
- El sistema NO reemplaza al contador — le facilita los datos para declarar
- NO hay facturación electrónica SENIAT (solo registro de montos)
