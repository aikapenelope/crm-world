# Aika — Documento Fundacional

## Identidad

| Campo | Valor |
|---|---|
| **Nombre de la plataforma** | Aika |
| **Tipo** | SaaS multi-vertical |
| **Mercado** | Venezuela |
| **Primera vertical** | Real Estate |
| **Marca visible al cliente** | La marca de cada tenant (white-label) |

## Regionalización

| Configuración | Valor |
|---|---|
| **País** | Venezuela |
| **Idioma principal** | Español |
| **Zona horaria** | America/Caracas (UTC-4) |
| **Formato de fecha** | DD/MM/YYYY |
| **Separador de miles** | Punto (1.000) |
| **Separador decimal** | Coma (0,50) |
| **Formato completo** | 1.000.000,50 |
| **Prefijo telefónico** | +58 |
| **Formato de teléfono** | +58 4XX-XXX-XXXX |

## Monedas

| Moneda | Código | Uso |
|---|---|---|
| **Dólar estadounidense** | USD | Moneda principal de referencia |
| **Euro** | EUR | Transacciones internacionales |
| **Bolívar** | VES | Moneda local legal |
| **USDT (Binance)** | USDT | Pagos crypto |

### Tasas de cambio

- Las tasas vienen de APIs externas
- Tasa BCV (Banco Central de Venezuela) para USD/VES oficial
- Tasa Binance para USDT/VES
- Tasa EUR se deriva de USD/EUR internacional
- Cada tenant puede configurar su propia tasa manual si lo prefiere
- Las tasas se actualizan automáticamente (frecuencia configurable)

### APIs de tasas a integrar

| Fuente | Qué provee | Prioridad |
|---|---|---|
| BCV / Monitor Dólar | USD/VES, EUR/VES | Alta |
| Binance P2P API | USDT/VES | Alta |
| ExchangeRate API (fallback) | USD/EUR, cruces internacionales | Media |

## Métodos de Pago

No se usa pasarela de pago online. Los pagos se registran manualmente como gestión interna.

| Método | Descripción | Aplica a |
|---|---|---|
| **Pago Móvil** | Transferencia instantánea entre bancos VE | Todos |
| **Zelle** | Transferencia USD (banco US) | Todos |
| **Binance** | Pago P2P en USDT | Todos |
| **Efectivo** | USD o VES en físico | Todos |
| **Débito** | Punto de venta | Retail |
| **Transferencia bancaria** | Transferencia nacional o internacional | Todos (principal en Real Estate) |

### Flujo de pago

```
Cliente paga (fuera del sistema) → Operador registra el pago en Aika → 
Sistema actualiza estado de la factura/contrato → Notificación al cliente
```

No hay cobro automático. El sistema solo registra y gestiona los pagos recibidos.

## Vertical: Real Estate (primera)

### Qué resuelve

Gestión de propiedades en alquiler y venta para inmobiliarias, administradores de edificios, y propietarios independientes en Venezuela.

### Entidades principales

| Entidad | Descripción |
|---|---|
| **Propiedades** | Inmuebles (apartamentos, casas, locales, terrenos) |
| **Unidades** | Subdivisiones de una propiedad (apto 4A, local 2B) |
| **Contratos** | Arrendamiento o venta con términos y condiciones |
| **Inquilinos** | Personas/empresas que arriendan (se vinculan al CRM) |
| **Pagos** | Registro de pagos recibidos por concepto de alquiler/venta |
| **Gastos** | Mantenimiento, servicios, condominio |
| **Documentos** | Contratos PDF, cédulas, RIF, solvencias |

### Flujos principales

1. **Publicar propiedad** → Cargar fotos, datos, precio → Disponible para mostrar
2. **Gestionar inquilino** → Contrato → Pagos mensuales → Renovación/desalojo
3. **Cobrar alquiler** → Generar factura → Registrar pago → Actualizar estado
4. **Control de gastos** → Registrar gasto → Asignar a propiedad → Reportes
5. **Portal del inquilino** → Ver su contrato, pagos, reportar problemas

### Monedas en Real Estate

- Alquileres se cobran en USD (referencia) con pago en VES a tasa del día
- Ventas en USD
- Gastos de condominio en VES
- El sistema muestra equivalencias automáticas

## Verticales Futuras

| Orden | Vertical | Primer caso de uso |
|---|---|---|
| 1 | **Real Estate** | Inmobiliarias y administradores de edificios |
| 2 | **Retail** | Tiendas y comercios con programa de lealtad |
| 3 | **Education** | Colegios y academias |
| 4 | **Manufacturing** | Fábricas y talleres |
| 5 | **Logistics** | Empresas de transporte y delivery |
| 6 | **Agriculture** | Fincas y agroindustria |

## Decisiones Técnicas

| Decisión | Elección | Razón |
|---|---|---|
| Framework | Open Mercato | Multi-tenant nativo, módulos, MIT |
| Hosting | Hetzner (Helsinki) | Costo/rendimiento, latencia aceptable para VE |
| Deploy | Coolify | Git-push deploy, TLS automático, UI de gestión |
| Moneda base del sistema | USD | Estabilidad, referencia universal en VE |
| Pasarela de pago | Ninguna | Pagos se registran manualmente (realidad VE) |
| White-label | Sí | Cada tenant ve su marca, no "Aika" |
| Idioma | Español único | Mercado venezolano |

## Emails

- Los emails transaccionales (invitaciones, resets de password, notificaciones) salen con la marca de cada tenant
- Se necesita un dominio configurado para envío (ej: `notificaciones@aika.com` o un dominio propio)
- Servicio recomendado: Resend (gratis hasta 3000 emails/mes) o SMTP propio
- Cada tenant puede personalizar el nombre del remitente

## Notas

- "Aika" es el nombre interno de la plataforma. Los clientes finales nunca ven este nombre.
- Cada tenant configura su propia marca, logo, y colores desde el panel de administración.
- El sistema es 100% en español para esta fase. Multi-idioma se agrega después si se expande a otros países.
