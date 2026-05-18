# CRM World

Plataforma SaaS multi-vertical construida sobre [Open Mercato](https://github.com/open-mercato/open-mercato). Un solo sistema que sirve a múltiples industrias con módulos especializados por rubro, compartiendo una base común de CRM, ventas, catálogo, y automatización.

## Verticales

| Vertical | Descripción |
|----------|-------------|
| **Retail & E-Commerce** | Lealtad, sincronización de inventario, gestión omnicanal |
| **Manufacturing** | Órdenes de producción, control de calidad, BOM |
| **Logistics & Distribution** | Flotas, rutas, almacén |
| **Real Estate** | Propiedades, contratos de arrendamiento, portal de inquilinos |
| **Education** | Inscripciones, cursos, portal de estudiantes |
| **Agriculture & Food** | Trazabilidad, cosecha, cumplimiento regulatorio |

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│           OPEN MERCATO (core MIT)                │
│  Auth · CRM · Catálogo · Ventas · Workflows     │
│  Search · AI · Portal · Notificaciones          │
└────────────────────┬────────────────────────────┘
                     │
      ┌──────────────┼──────────────────┐
      │              │                  │
 ┌────▼────┐   ┌────▼────┐      ┌─────▼─────┐
 │ Módulos │   │ Módulos │      │  Módulos  │
 │ Retail  │   │ Educac. │      │  Manufac. │
 └────┬────┘   └────┬────┘      └─────┬─────┘
      │              │                  │
 Tenants de     Tenants de        Tenants de
 retail         educación         manufactura
```

Cada tenant (cliente) ve solo los módulos de su vertical. La base es compartida.

## Stack

| Componente | Tecnología |
|---|---|
| Framework | Open Mercato v0.6.1 (Next.js 16, TypeScript, MikroORM 7) |
| Base de datos | PostgreSQL 17 + pgvector |
| Cache/Colas | Redis 7 |
| Búsqueda | Meilisearch 1.11 |
| Infraestructura | Hetzner Cloud (Pulumi IaC) |
| Deploy | Coolify 4.0 (git-push → auto-deploy) |
| TLS | Let's Encrypt automático |

## URLs

| Servicio | URL |
|---|---|
| Aplicación | https://mercato.novaincs.com |
| Panel de deploy | https://deploy.novaincs.com |
| Infra (Pulumi) | [mercatinfra](https://github.com/aikapenelope/mercatinfra) |

## Roadmap

### Fase 0 — Base (completada)
- [x] Servidor Hetzner provisionado con Pulumi
- [x] Coolify instalado y configurado
- [x] Open Mercato desplegado y corriendo
- [x] HTTPS con Let's Encrypt
- [x] Seguridad: fail2ban, UFW, encriptación, rate limiting
- [x] Backups automáticos diarios
- [x] Documentación de desarrollo

### Fase 1 — Regionalización y Base Compartida
- [ ] Configuración regional (moneda, idioma, timezone, formatos)
- [ ] Branding por tenant (logo, colores, nombre)
- [ ] Templates de email en español
- [ ] Módulo de documentos/compliance compartido
- [ ] Reportes base configurables

### Fase 2 — Primera Vertical
- [ ] Definir vertical inicial según primer cliente
- [ ] Diseñar entidades y flujos del rubro
- [ ] Desarrollar módulos (3-5 por vertical)
- [ ] Configurar feature toggles
- [ ] Probar con tenant de demo
- [ ] Primer cliente real

### Fase 3 — Segunda Vertical
- [ ] Repetir Fase 2 para el siguiente rubro
- [ ] Reutilizar módulos compartidos donde aplique

### Fase 4 — Escala
- [ ] Verticales restantes según demanda
- [ ] Portal de clientes personalizado por vertical
- [ ] Integraciones específicas (pasarelas de pago locales, carriers)
- [ ] Onboarding self-service por vertical

## Desarrollo

Ver [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) para la guía completa de desarrollo de módulos.

### Comandos rápidos

```bash
yarn dev              # Desarrollo local
yarn generate         # Regenerar módulos
yarn db:generate      # Crear migración
yarn db:migrate       # Aplicar migración
git push origin main  # Deploy automático
```

## Licencia

El código propio de este repositorio es privado. Open Mercato core es MIT.
