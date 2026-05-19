# Changelog — Aika Platform (CRM World)

## 2026-05-19 — Real Estate UI + Cleanup

### UI Funcional (PR #1 merged)
- **Properties list**: DataTable con filtros (tipo, operación, estado), búsqueda, paginación, row actions
- **Properties create**: CrudForm con campos agrupados (info, precio, specs, ubicación)
- **Properties edit**: CrudForm pre-populated con datos existentes
- **Transactions list**: DataTable con filtros tipo/status, comisión, fecha cierre
- **Matching list**: DataTable con score badges, criterios matched

### Fixes
- Eliminados todos los imports cross-module (Turbopack restriction)
- Módulos usan Kysely queries (`em.getKysely()`) para leer tablas de otros módulos
- matching/data usa enums locales en vez de importar de properties

### Cleanup Coolify
- Eliminada app duplicada que generaba builds fallidos (17 failed)
- Eliminado proyecto vacío "My first project"
- Solo queda "Mercato SaaS" con la app correcta configurada

### Documentación
- `docs/PROPI_FEATURES_MAP.md` — mapeo completo de features Propi vs implementación
- `docs/ROADMAP.md` — plan de lo que sigue por PRs
- `docs/CONTEXT.md` — contexto completo para continuación

---

## 2026-05-18 — Fundación e Infraestructura

### Infraestructura (mercatinfra)

- **Servidor Hetzner CX33** desplegado en Helsinki (65.108.61.137) via Pulumi
- **Coolify 4.0** instalado como PaaS (deploy.novaincs.com)
- **Firewall** configurado: SSH + HTTP + HTTPS + Coolify UI
- **SSH Key** ED25519 auto-generada, almacenada en Pulumi secrets
- **Red privada** 10.10.0.0/16 con subnet 10.10.1.0/24
- **Swap 4 GB** configurado para prevenir OOM durante builds
- **fail2ban** + **UFW** activos
- **Backups diarios** de PostgreSQL (cron, 30 días retención)
- **Secrets** centralizados en Pulumi ESC (aikapenelope-org/mercato-secrets)

### Aplicación (crm-world)

- **Open Mercato v0.6.1** scaffolded como standalone app
- **Docker Compose** hardened para producción (NODE_ENV=production, memory limits)
- **Dockerfile** corregido con NODE_OPTIONS para builds pesados
- **Dominios** configurados: mercato.novaincs.com (app) + deploy.novaincs.com (Coolify)
- **HTTPS** automático via Let's Encrypt (Coolify/Traefik)
- **Auto-deploy** en cada push a main

### Módulos Base Venezuela (aplican a todos los tenants)

#### `venezuela_rates` — Tasas de cambio
- Provider DolarApi (ve.dolarapi.com/v1)
- Tasas BCV oficial (USD/VES, EUR/VES)
- Tasas paralelo/Binance P2P (USD/VES, EUR/VES, USDT/VES)
- Seed de monedas: USD (base), VES, EUR, USDT
- Formatos venezolanos (coma decimal, punto miles)

#### `payment_methods` — Métodos de pago locales
- 7 métodos pre-configurados: Pago Móvil, Zelle, Binance, Efectivo USD, Efectivo VES, Transferencia, Débito
- Entidad de registro de pagos con estado (pending → confirmed/rejected)
- Cada método tiene moneda, referencia requerida, instrucciones
- Equivalente USD + tasa de cambio almacenados por pago
- Eventos emitidos en registro/confirmación/rechazo

#### `ve_fiscal` — Identificación fiscal
- Validación de RIF (J-12345678-9) con prefijos J/V/E/G/P/C
- Validación de Cédula (V-12345678, E-12345678)
- Tasas vigentes: IVA 16%, IVA reducido 8%, IVA lujo 15%, IGTF 3%
- Retenciones: IVA 75%, ISLR servicios 5%, ISLR compras 2%
- Entidad de config fiscal por tenant + identidad fiscal por cliente

#### `ve_tenant_defaults` — Auto-configuración de tenant
- Reemplaza VAT polaco por IVA venezolano al crear tenant
- Configura numeración de documentos (ORD-202605-00001, COT-202605-00001)
- Configura formato de dirección (street_first)
- Seed de diccionarios CRM (tipos de dirección, fuentes, industrias VE)
- Subscriber IGTF: auto-aplica 3% en pagos en divisas via event bus

### Vertical Real Estate — Sprint 1

#### `properties` — Propiedades inmobiliarias
- Entidades: properties, property_images, property_links
- Tipos: apartamento, casa, terreno, comercial, oficina, galpón, otro
- Operaciones: venta, alquiler, venta/alquiler
- Status lifecycle: draft → active → reserved → sold/rented/inactive
- Campos: precio, moneda, área, habitaciones, baños, parking, GPS, dirección
- Imágenes (max 10, via attachments core) con orden y cover flag
- Links externos (max 5): MercadoLibre, Facebook, Instagram, TikTok
- API CRUD con filtros (tipo, operación, status, ciudad, rango de precio)
- Eventos por cambio de status para workflows
- RBAC: view/create/edit (employee), delete/assign (admin)
- i18n español + inglés

### Documentación

- `README.md` — Overview del proyecto + roadmap
- `docs/DEVELOPMENT.md` — Guía completa de desarrollo de módulos
- `docs/FOUNDATION.md` — Documento fundacional (regionalización, decisiones)
- `docs/REAL_ESTATE_PLAN.md` — Plan completo de la vertical RE
- `.ai/specs/2026-05-18-venezuela-tenant-defaults.md` — Spec de auto-config
- `.ai/specs/2026-05-18-properties-module.md` — Spec de propiedades

---

## Qué sigue (próximos sprints)

### Sprint 2 — Real Estate Core (en progreso)
- [ ] `transactions` — Cierre de operación + comisiones
- [ ] `matching` — Motor de cruce contacto ↔ propiedad

### Sprint 3 — Real Estate Valor
- [ ] `property_portal` — Página pública /p/[id]
- [ ] `property_docs` — Ficha PDF con branding
- [ ] `property_publishing` — Texto + links a portales

### Sprint 4 — Inteligencia de Mercado
- [ ] `market_intelligence` — Tasación + KPIs por zona
- [ ] `mercadolibre_sync` — Sync de listings (módulo compartido)

### Pendiente (configuración)
- [ ] Configurar Resend API key para emails (mail.aikalabs.cc)
- [ ] Configurar DNS para email sending
- [ ] Primer tenant real de prueba

---

## Notas técnicas

### Patrones utilizados

Todos los módulos siguen los patrones documentados de Open Mercato:

| Patrón | Dónde se documenta |
|---|---|
| `ModuleSetupConfig` (onTenantCreated, seedDefaults) | `packages/core/AGENTS.md` → Module Setup |
| `makeCrudRoute` con CRUD factory | `packages/core/AGENTS.md` → API Routes |
| `RateProvider` interface para tasas | `packages/core/src/modules/currencies/services/providers/base.ts` |
| Event bus subscribers | `packages/events/AGENTS.md` |
| DI override via `di.ts` | `packages/core/AGENTS.md` → Extensibility Contract |
| Spec-driven development | `.ai/specs/AGENTS.md` |
| i18n con archivos JSON por locale | `packages/shared/AGENTS.md` |

### Sin hotfixes ni workarounds

- Ningún módulo modifica el core de Open Mercato
- Todo se integra via interfaces documentadas (DI, events, setup hooks)
- Las actualizaciones de Open Mercato (`yarn up '@open-mercato/*'`) no rompen nada
- Cada módulo es independiente y se puede desactivar sin afectar otros
