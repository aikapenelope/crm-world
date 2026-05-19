# Propi CRM — Feature Status (actualizado 2026-05-19)

## Resumen rápido

| Categoría | Total features | DONE | PENDING | DEFERRED |
|-----------|:-:|:-:|:-:|:-:|
| Autenticación | 4 | 2 | 0 | 0 |
| Contactos | 11 | 9 | 1 | 0 |
| Propiedades | 14 | 13 | 1 | 0 |
| Pipeline | 4 | 4 | 0 | 0 |
| Calendario | 4 | 3 | 1 | 0 |
| Tareas | 3 | 3 | 0 | 0 |
| Documentos | 5 | 4 | 1 | 0 |
| Inteligencia | 5 | 4 | 1 | 0 |
| Marketing | 4 | 4 | 0 | 0 |
| Messaging | 2 | 0 | 0 | 2 |
| Reportes | 3 | 3 | 0 | 0 |
| Comisiones | 3 | 3 | 0 | 0 |
| Matching | 4 | 4 | 0 | 0 |
| Notificaciones | 4 | 4 | 0 | 0 |
| Dashboard | 4 | 4 | 0 | 0 |
| Búsqueda | 2 | 2 | 0 | 0 |
| PWA | 2 | 2 | 0 | 0 |
| Páginas públicas | 2 | 2 | 0 | 0 |
| Configuración | 2 | 2 | 0 | 0 |
| **TOTAL** | **82** | **72** | **5** | **2** |

**Cobertura: 88% completo. 5 items pendientes, 2 diferidos.**

---

## Lo que falta (PENDING)

| # | Feature | Categoría | Dificultad | Bloquea primer cliente? |
|---|---------|-----------|:----------:|:-:|
| 1 | vCard import | Contactos | Baja | No |
| 2 | Property tags | Propiedades | Media | No (custom fields del core sirven) |
| 3 | Appointment → Property link | Calendario | Media | No |
| 4 | Storage quota per tenant | Documentos | Baja | No |
| 5 | Saved searches UI | Inteligencia | Baja | No |

## Lo que está DEFERRED (requiere APIs externas)

| # | Feature | Razón |
|---|---------|-------|
| 1 | Inbox unificado (IG, FB, WA) | Requiere Meta Business API + aprobación |
| 2 | WhatsApp templates | Requiere WhatsApp Business API + número verificado |

---

## Detalle por categoría (actualizado)

### 2. CONTACTOS
| Feature | Status |
|---------|--------|
| Importación CSV | **DONE** (Sprint 4 — csv-import adapter) |
| Importación vCard | PENDING |

### 3. PROPIEDADES
| Feature | Status |
|---------|--------|
| Tags | PENDING (usar custom fields del core como workaround) |
| Ficha PDF | **DONE** (Sprint 3 — HTML renderer + API) |
| Envío por email | **DONE** (estructura lista, falta Resend API key) |

### 7. DOCUMENTOS
| Feature | Status |
|---------|--------|
| Tipos de documento | **DONE** (Sprint 1 — dictionary seed) |
| Storage quota | PENDING |

### 8. INTELIGENCIA DE MERCADO
| Feature | Status |
|---------|--------|
| Búsquedas guardadas | PENDING (market_valuations ya guarda historial) |

### 9. MARKETING Y PUBLICACIÓN
| Feature | Status |
|---------|--------|
| Configuración de cuentas sociales | **DONE** (Sprint 4 — settings page) |

### 11. REPORTES
| Feature | Status |
|---------|--------|
| Reporte PDF | **DONE** (Sprint 3 — property sheet + monthly report) |
| Métricas | **DONE** (Sprint 2 — dashboard widgets) |
| Compartir con broker | **DONE** (Sprint 3 — agent portal /agente/[id]) |

### 13. MATCHING
| Feature | Status |
|---------|--------|
| Score multi-criterio | **DONE** (Sprint 2 — ScoringEngine) |
| Vista por propiedad | **DONE** (Sprint 1 — tab Matching en detail) |

### 15. DASHBOARD
| Feature | Status |
|---------|--------|
| Metric cards | **DONE** (Sprint 2 — 3 widgets) |
| Gráficas | **DONE** (Sprint 2 — pipeline summary) |

### 16. BÚSQUEDA GLOBAL
| Feature | Status |
|---------|--------|
| Propiedades en búsqueda | **DONE** (Sprint 1 — search.ts) |

### 18. PÁGINAS PÚBLICAS
| Feature | Status |
|---------|--------|
| /agente/[id] | **DONE** (Sprint 3 — agent portal) |

### 19. CONFIGURACIÓN
| Feature | Status |
|---------|--------|
| Branding | **DONE** (Sprint 4 — settings page) |
| Cuentas sociales | **DONE** (Sprint 4 — settings page) |
