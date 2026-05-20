# Guía de Implementación para Usuarios — Real Estate CRM

> Esta guía describe el flujo paso a paso para poner en producción un nuevo cliente (tenant) del CRM de Real Estate.

---

## Prerrequisitos

- Sistema desplegado y corriendo en `https://mercato.novaincs.com`
- Acceso a Super Admin (`/backend`)
- Módulos de Real Estate activos en `src/modules.ts`
- Feature toggles configurados para la vertical RE

---

## Paso 1: Crear Tenant y Organización

1. Acceder a Super Admin → Directory → Organizations
2. Crear nueva organización:
   - **Nombre**: Nombre de la inmobiliaria del cliente
   - **Slug**: identificador URL-friendly (ej: `inmobiliaria-xyz`)
3. El módulo `ve_tenant_defaults` auto-configura automáticamente:
   - Tasas de impuesto (IVA 16%, IGTF 3%)
   - Formato de dirección Venezuela
   - Diccionarios base (fuentes de lead, tipos de actividad)
   - Hook de IGTF en pagos en moneda extranjera
   - Monedas (USD, VES, EUR, USDT)
   - Métodos de pago (Pago Móvil, Zelle, Binance, Efectivo, Débito, Transferencia)

---

## Paso 2: Configurar Branding

1. Directory → Organization → Editar
2. Configurar:
   - Logo de la empresa (upload)
   - Nombre visible
   - Colores de marca (cuando esté disponible)
3. El sistema es white-label: el cliente nunca ve "Aika", solo su marca

---

## Paso 3: Crear Usuarios

1. Auth → Users → Create
2. Para el **admin del cliente**:
   - Email, nombre, contraseña temporal
   - Rol: `admin` (tiene `properties.*`, `transactions.*`, `matching.*`)
3. Para **agentes/empleados**:
   - Rol: `employee` (tiene `properties.view`, `properties.create`, `properties.edit`)
4. Enviar credenciales al cliente (manual hasta que Resend esté configurado)

---

## Paso 4: Configurar Pipeline de Ventas

1. Customers → Pipeline → Configurar etapas sugeridas para RE:
   - Contacto Inicial
   - Calificación
   - Visita Programada
   - Negociación
   - Documentación
   - Cierre
2. Las fuentes de lead ya están seedeadas:
   - Referido, Instagram, WhatsApp, Facebook, MercadoLibre, Portal Web, Llamada, Otro

---

## Paso 5: Configurar Tags

1. Customers → Tags → Crear tags relevantes:
   - **Por tipo de contacto**: Comprador, Vendedor, Inversor, Inquilino, Propietario
   - **Por temperatura**: Caliente, Tibio, Frío
   - **Por zona**: (según las zonas que maneje el agente)

---

## Paso 6: Cargar Propiedades

1. Properties → Create
2. Campos obligatorios:
   - Título descriptivo
   - Tipo (apartamento, casa, terreno, comercial, oficina, galpón, otro)
   - Operación (venta, alquiler, venta/alquiler)
   - Precio + moneda (USD por defecto)
   - Ciudad
3. Campos recomendados:
   - Área m², habitaciones, baños, parking
   - Dirección completa + GPS (latitud/longitud)
   - Tasa de comisión (default 5%)
   - Descripción detallada
4. Subir imágenes (hasta 10, marcar cover)
5. Agregar links externos (MercadoLibre, Facebook, Instagram)
6. Status inicial: `draft` → cambiar a `active` cuando esté lista para mostrar

---

## Paso 7: Cargar Contactos

1. Customers → People → Create
2. Datos mínimos: nombre, teléfono, email
3. Asignar tags (Comprador/Vendedor/etc.)
4. Asignar fuente de lead
5. Configurar preferencias de búsqueda (para matching):
   - Tipo de propiedad preferido
   - Ciudad preferida
   - Operación preferida
   - Presupuesto máximo
   - Área mínima
   - Habitaciones mínimas

---

## Paso 8: Operación Diaria

### Flujo del agente:

```
1. Revisar Dashboard → métricas, pipeline, actividad reciente
2. Revisar Matching → contactos que cruzan con propiedades activas
3. Gestionar Pipeline → mover deals entre etapas (drag & drop)
4. Publicar propiedades → generar texto, compartir en portales
5. Compartir por WhatsApp → usar link público /p/[id]
6. Registrar actividades → llamadas, visitas, notas
7. Programar citas → Calendar
8. Completar tareas → Tasks
```

### Publicación de propiedades:

1. Properties → [propiedad] → Publishing
2. Generar texto pre-formateado (título, specs, precio, contacto)
3. Copiar y pegar en:
   - MercadoLibre: link directo a publicar
   - Facebook Marketplace: link directo
   - Instagram: copiar texto para caption
   - TikTok: copiar texto para descripción
   - WhatsApp: compartir link público /p/[id]

### Registrar cierre de operación:

1. Transactions → Create
2. Seleccionar propiedad + contacto (comprador/inquilino)
3. Tipo: venta o alquiler
4. Precio real de cierre + moneda
5. Método de pago
6. El sistema auto-calcula comisión (precio × tasa)
7. El sistema auto-cambia status de la propiedad (sold/rented)

---

## Paso 9: Inteligencia de Mercado

1. Market Intelligence → Tasación
2. Ingresar criterios: tipo, operación, ciudad, zona, área, habitaciones
3. El sistema devuelve:
   - Precio promedio y mediana
   - Rango P25-P75 (percentiles)
   - Precio por m²
   - Inventario disponible
   - Top 10 comparables del mercado
4. Datos provienen del sync diario de MercadoLibre

---

## Paso 10: Portal Público

- Cada propiedad activa tiene una página pública: `/p/[id]`
- Incluye: carousel de fotos, specs, precio, botón WhatsApp
- Compartir este link con clientes potenciales
- No requiere login para ver

---

## Funcionalidades Pendientes (Phase 6)

Las siguientes funcionalidades están planificadas pero aún no implementadas:

| Funcionalidad | Prioridad | Estado |
|---|---|---|
| Formulario de crear transacción (CrudForm) | Alta | Pendiente |
| Búsqueda de propiedades en Meilisearch | Alta | Pendiente |
| Diccionario de tipos de documento | Alta | Pendiente |
| Tabs de detalle de propiedad | Alta | Pendiente |
| Dashboard widgets RE | Alta | Pendiente |
| Notificaciones RE (lead inactivo, propiedad sin actividad) | Alta | Pendiente |
| Motor de scoring de matching | Media | Pendiente |
| Portal del agente (/agente/[id]) | Media | Pendiente |
| PDF de ficha de propiedad | Media | Pendiente |
| Reporte mensual PDF | Media | Pendiente |
| Importación CSV/vCard | Media | Pendiente |
| Configuración de cuentas sociales | Baja | Pendiente |

---

## Notas Importantes

1. **No es self-service**: Los tenants se crean y configuran manualmente por el admin
2. **No hay pasarela de pago**: Los pagos se registran manualmente (realidad Venezuela)
3. **Email no configurado aún**: Las invitaciones se envían manualmente hasta integrar Resend
4. **MercadoLibre es solo lectura**: El sync descarga datos del mercado, no publica propiedades
5. **Links a redes sociales son directos**: No hay integración API con Meta/Instagram/TikTok
6. **El sistema es PWA**: Los usuarios pueden instalarlo como app en el teléfono

---

## Estructura de Módulos por Vertical

Cuando se despliega para Real Estate, el usuario ve:

| Sección en Sidebar | Módulo | Fuente |
|---|---|---|
| Dashboard | `dashboards` | Core |
| Contactos | `customers` | Core |
| Propiedades | `properties` | @app (RE) |
| Transacciones | `transactions` | @app (RE) |
| Matching | `matching` | @app (RE) |
| Calendario | `planner` | Core |
| Inteligencia | `market_intelligence` | @app (RE) |
| Notificaciones | `notifications` | Core |
| Configuración | `configs`, `auth` | Core |

**NO aparece** (oculto por feature toggles):
- Catalog (productos, categorías)
- Sales (órdenes, facturas, envíos)
- Shipping Carriers
- Payment Gateways
- Checkout
- Content
- Módulos de otras verticales
