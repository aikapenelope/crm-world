# Propi CRM — Feature Reference

Source features from the existing Propi CRM that serve as reference for the Aika Real Estate vertical.

## Feature Status Map

### 1. AUTENTICACION Y ACCESO
| Feature | Status | Notes |
|---------|--------|-------|
| Login (email) | DONE (Open Mercato core) | `auth` module |
| Roles (admin, employee) | DONE (Open Mercato core) | RBAC features |
| Bloqueo por expiración | N/A | No es SaaS público, no hay trial |
| Activación manual | N/A | Tenants se preconfiguran |

### 2. CONTACTOS
| Feature | Status | Notes |
|---------|--------|-------|
| CRUD completo | DONE (Open Mercato core) | `customers` module |
| Campos (nombre, email, tel, empresa, notas) | DONE | Core customers |
| Tags con colores | DONE | Core customers |
| Fuentes de lead | DONE | `ve_tenant_defaults` seedea fuentes VE |
| Preferencias de búsqueda | DONE | `matching` module (contact_preferences) |
| Importación CSV/vCard | PENDING | Needs data_sync adapter |
| Deduplicación | DONE | Core check-phone/check-email API |
| Búsqueda | DONE | Core search (Meilisearch) |
| Notas por contacto | DONE | Core activities/comments |
| Historial de actividad | DONE | Core activity timeline |
| Swipe actions (mobile) | N/A | PWA feature, not module |

### 3. PROPIEDADES
| Feature | Status | Notes |
|---------|--------|-------|
| CRUD completo | DONE | `properties` module |
| Campos (título, desc, tipo, operación, status, precio, área, hab, baños, parking, dirección, GPS) | DONE | All in PropertyEntity |
| Tipos (apartamento, casa, terreno, comercial, oficina, galpón, otro) | DONE | PropertyType enum |
| Operaciones (venta, alquiler, venta/alquiler) | DONE | PropertyOperation enum |
| Status lifecycle (draft→active→reserved→sold/rented/inactive) | DONE | PropertyStatus enum |
| Imágenes (hasta 10) | DONE | property_images entity + API |
| Tags | PENDING | Needs shared tag system or custom fields |
| Links externos (MercadoLibre, etc.) | DONE | property_links entity + API |
| Cierre de operación | DONE | `transactions` module |
| Publicación asistida (texto + links) | DONE | `property_publishing` module |
| Compartir (WhatsApp, copiar link) | DONE | property_publishing WhatsApp URL |
| Página pública /p/[id] | DONE | `property_portal` module |
| Ficha PDF | DONE (data layer) | `property_docs` — needs PDF renderer |
| Envío por email | PENDING | Needs Resend integration |
| Comparables automáticos | DONE | `market_intelligence` module |

### 4. PIPELINE (KANBAN)
| Feature | Status | Notes |
|---------|--------|-------|
| 7 etapas | DONE (Open Mercato core) | `customers` deals + pipeline stages |
| Drag & drop | DONE | Core Kanban UI |
| Activity log | DONE | Core activity timeline |
| Tags visibles | DONE | Core tags on cards |

### 5. CALENDARIO
| Feature | Status | Notes |
|---------|--------|-------|
| CRUD de citas | DONE (Open Mercato core) | `planner` module |
| Vinculación a contacto/propiedad | PARTIAL | Core links to contact; property link needs custom field |
| Vista calendario | DONE | Core FullCalendar |
| Status (scheduled, confirmed, completed, cancelled, no_show) | DONE | Core planner |

### 6. TAREAS
| Feature | Status | Notes |
|---------|--------|-------|
| CRUD | DONE (Open Mercato core) | `customers` todos |
| Filtros (pendientes, completadas, hoy, vencidas) | DONE | Core |
| Widget en dashboard | DONE | Core dashboards |

### 7. DOCUMENTOS
| Feature | Status | Notes |
|---------|--------|-------|
| Upload | DONE (Open Mercato core) | `attachments` module |
| Tipos (contrato, ID, escritura, avalúo, plano, factura) | PENDING | Needs dictionary config |
| Vinculación a contacto/propiedad | DONE | Core attachments link to entities |
| Descarga | DONE | Core |
| Storage quota | PENDING | Needs config per tenant |

### 8. INTELIGENCIA DE MERCADO
| Feature | Status | Notes |
|---------|--------|-------|
| Tasación (KPIs, rango P25-P75, comparables) | DONE | `market_intelligence` module |
| Sync MercadoLibre | DONE | `mercadolibre_sync` worker |
| KPIs por ciudad | DONE | Valuation API calculates per city |
| Comparables en propiedad | DONE | Valuation returns top 10 |
| Búsquedas guardadas | PENDING | market_valuations saves history |

### 9. MARKETING Y PUBLICACIÓN
| Feature | Status | Notes |
|---------|--------|-------|
| Publicación asistida (texto + links) | DONE | `property_publishing` |
| Links a Instagram/Facebook/TikTok | DONE | Just URLs, no API |
| Configuración de cuentas sociales | PENDING | Needs settings page |
| Token expiry warning | N/A | No Meta API integration |

### 10. MESSAGING
| Feature | Status | Notes |
|---------|--------|-------|
| Inbox unificado (IG, FB, WA) | DEFERRED | Requires Meta Business API |
| WhatsApp templates | DEFERRED | Requires WhatsApp Business API |

### 11. REPORTES
| Feature | Status | Notes |
|---------|--------|-------|
| Reporte PDF | PENDING | Needs PDF generation engine |
| Métricas (propiedades por status, contactos por fuente, etc.) | PARTIAL | Core dashboards + custom widgets needed |
| Compartir con broker | PENDING | Needs portal page |

### 12. COMISIONES
| Feature | Status | Notes |
|---------|--------|-------|
| Calculadora (precio × tasa) | DONE | `transactions` module (commission_rate × sale_price) |
| Por propiedad (tasa configurable) | DONE | commission_rate field in properties |
| Historial | DONE | transactions list filtered by completed |

### 13. MATCHING
| Feature | Status | Notes |
|---------|--------|-------|
| Motor de matching | DONE | `matching` module |
| Criterios (tipo, ciudad, presupuesto, operación) | DONE | contact_preferences entity |
| Score multi-criterio | DONE (structure) | Scoring engine needs implementation |
| Vista por propiedad | PENDING | Needs UI tab in property detail |

### 14. NOTIFICACIONES
| Feature | Status | Notes |
|---------|--------|-------|
| Tipos (cita próxima, tarea vencida, lead inactivo) | DONE (Open Mercato core) | `notifications` module |
| Generación por cron | DONE | Core scheduler |
| Campana + badge | DONE | Core UI |
| Mark as read | DONE | Core |

### 15. DASHBOARD
| Feature | Status | Notes |
|---------|--------|-------|
| Quick actions | DONE (Open Mercato core) | Core dashboards |
| Metric cards | PARTIAL | Needs RE-specific widgets |
| Gráficas | PARTIAL | Needs RE-specific charts |
| Actividad reciente | DONE | Core activity timeline |

### 16. BÚSQUEDA GLOBAL
| Feature | Status | Notes |
|---------|--------|-------|
| Multi-entidad | DONE (Open Mercato core) | Meilisearch |
| Propiedades en búsqueda | PENDING | Needs search.ts config |

### 17. PWA
| Feature | Status | Notes |
|---------|--------|-------|
| Service Worker | DONE (Open Mercato core) | Next.js PWA built-in |
| Install prompt | N/A | Standard browser behavior |

### 18. PÁGINAS PÚBLICAS
| Feature | Status | Notes |
|---------|--------|-------|
| /p/[id] (propiedad pública) | DONE | `property_portal` module |
| /agente/[id] (portal del agente) | PENDING | Needs agent portal page |

### 19. CONFIGURACIÓN
| Feature | Status | Notes |
|---------|--------|-------|
| Branding (nombre + logo) | PARTIAL | Core directory has name; logo needs custom field |
| Cuentas sociales | PENDING | Needs settings page |

---

## Summary: What's Left to Build

### High Priority (needed for first client)
1. Transactions create form (CrudForm page)
2. Search config for properties (search.ts — Meilisearch indexing)
3. Document type dictionary (contrato, escritura, avalúo, etc.)
4. Property tags (shared tag system or custom fields)
5. Dashboard widgets for RE (properties by status, pipeline, recent activity)

### Medium Priority (improves experience)
6. Agent portal page (/agente/[id])
7. PDF report generation (property sheet + monthly report)
8. CSV/vCard import adapter
9. Matching scoring engine implementation
10. Appointment link to property (custom field in planner)

### Low Priority (nice to have)
11. Social account settings page
12. Storage quota per tenant
13. Saved searches UI
14. RE-specific notification types (lead inactivo, propiedad sin actividad)
