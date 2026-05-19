# Guía de Operaciones — Aika Platform

> Cómo crear tenants, gestionar usuarios, monitorear el sistema, y operar el CRM día a día.

---

## 1. Arquitectura de Tenants

```
Aika Platform
├── Tenant 1 (Inmobiliaria ABC)
│   ├── Organization 1 (Oficina Caracas)
│   │   ├── Admin (tú o el dueño)
│   │   ├── Employee 1 (agente)
│   │   └── Employee 2 (agente)
│   └── Organization 2 (Oficina Valencia) — opcional
│       └── ...
├── Tenant 2 (Inmobiliaria XYZ)
│   └── Organization 1
│       ├── Admin
│       └── Employees
└── ...
```

- **Tenant** = cliente (empresa que paga). Aislamiento total de datos.
- **Organization** = unidad dentro del tenant (sucursal, equipo). Comparten datos del tenant.
- **User** = persona con acceso. Tiene roles (superadmin, admin, employee).

---

## 2. Crear un nuevo tenant (cliente)

### Vía CLI (SSH al servidor)

```bash
ssh -i <key-file> root@65.108.61.137

# Entrar al container de la app
docker exec -it app-dnts5dsaufpulbz33dp7vwmp-<ID> sh

# Crear tenant + organización + usuario admin
yarn mercato auth setup \
  --orgName "Inmobiliaria ABC" \
  --email "admin@inmobiliariabc.com" \
  --password "ContraseñaSegura123!" \
  --roles "superadmin,admin,employee"
```

Esto crea:
1. Un tenant nuevo
2. Una organización con el nombre dado
3. Un usuario admin con los roles especificados
4. Ejecuta `seedDefaults` (impuestos VE, diccionarios, métodos de pago, tipos de documento)

### Vía la UI (si Self-Service Onboarding está habilitado)

1. Ir a `https://mercato.novaincs.com/backend`
2. El primer usuario puede registrarse si `SELF_SERVICE_ONBOARDING_ENABLED=true`
3. Completa el wizard de onboarding
4. Se crea tenant + org + usuario automáticamente

### Verificar que se creó correctamente

```bash
docker exec -it app-<ID> sh
yarn mercato auth:list-users
```

---

## 3. Gestión de usuarios (lo hace el admin del tenant)

Una vez creado el tenant, el **admin del cliente** gestiona sus propios usuarios desde la UI:

### Agregar empleados

1. Login como admin → `https://mercato.novaincs.com/backend`
2. Ir a **Configuración** → **Usuarios** (sidebar)
3. Click **+ Nuevo usuario**
4. Llenar: nombre, email, contraseña temporal
5. Asignar rol: `employee` (o `admin` si es gerente)
6. Guardar

### Roles disponibles

| Rol | Permisos |
|-----|----------|
| `superadmin` | Todo. Solo para ti (operador de la plataforma) |
| `admin` | Gestión completa del tenant: usuarios, config, todos los módulos |
| `employee` | Operación diaria: ver/crear propiedades, transacciones, contactos |

### Permisos por módulo (RBAC)

Los permisos se asignan por features. Ejemplo para un agente:
- `properties.view`, `properties.create`, `properties.edit`
- `transactions.view`, `transactions.create`
- `matching.view`
- `customers.people.view`, `customers.people.manage`

El admin puede personalizar esto desde **Configuración** → **Roles**.

---

## 4. Flujo operativo del agente (usuario final)

### Día a día del agente inmobiliario:

1. **Login** → Dashboard con widgets (propiedades por estado, cierres recientes, pipeline)
2. **Agregar propiedad** → `/backend/properties/create`
3. **Subir imágenes** → Tab "Imágenes" en detalle de propiedad
4. **Publicar** → Usar texto generado + links a portales
5. **Registrar contacto** → `/backend/customers/people` (core)
6. **Registrar preferencias** → Para matching automático
7. **Ver matching** → Tab "Matching" en detalle de propiedad
8. **Registrar cierre** → `/backend/transactions/create`
9. **Ver reportes** → Dashboard widgets + monthly report API

---

## 5. Monitoreo del sistema

### Verificar que la app está corriendo

```bash
# Desde tu máquina
curl -s -o /dev/null -w "%{http_code}" https://mercato.novaincs.com/backend
# Debe retornar 307 (redirect a login)
```

### Ver logs de la app

```bash
ssh -i <key-file> root@65.108.61.137
docker logs app-dnts5dsaufpulbz33dp7vwmp-<ID> --tail 50
```

### Ver estado de containers

```bash
docker ps --format '{{.Names}} {{.Status}}'
```

### Ver uso de recursos

```bash
free -h          # RAM
df -h /          # Disco
uptime           # Load average
```

### Ver deployments recientes en Coolify

```bash
docker exec coolify-db psql -U coolify -d coolify -c \
  "SELECT id, status, created_at FROM application_deployment_queues WHERE application_name = 'mercato-app' ORDER BY id DESC LIMIT 5;"
```

### Alertas a monitorear

| Señal | Acción |
|-------|--------|
| App container restarting | Revisar logs (`docker logs`) |
| RAM > 12 GB usada | Posible OOM en próximo build |
| Load > 10 sostenido | Algo está consumiendo CPU |
| Deploy failed | Revisar si es bug de Coolify (reintentar) o error de código |

---

## 6. Backups

### PostgreSQL (automático)

Cron job diario a las 3 AM:
```
/opt/mercato/backups/db-YYYYMMDD-HHMM.sql.gz
```

Retención: 30 días.

### Restaurar un backup

```bash
gunzip < /opt/mercato/backups/db-20260519-0300.sql.gz | \
  docker exec -i postgres-dnts5dsaufpulbz33dp7vwmp-<ID> \
  psql -U postgres -d mercato-saas
```

---

## 7. Actualizar la plataforma

### Actualizar Open Mercato

```bash
cd crm-world
yarn up '@open-mercato/*'
yarn generate
yarn db:migrate
git add -A && git commit -m "chore: upgrade open-mercato packages"
git push origin main
# Coolify auto-deploya
```

### Actualizar Coolify

```bash
ssh root@65.108.61.137
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

---

## 8. Troubleshooting común

| Problema | Solución |
|----------|----------|
| 502 Bad Gateway | App arrancando. Esperar 30s. Si persiste: `docker restart coolify-proxy` |
| App crashea en loop | Revisar logs. Probablemente error de entity types o DB |
| Deploy falla "No such container" | Bug de Coolify. Reintentar deploy |
| Deploy falla "Type error" | Error de código. Revisar el error y fixear |
| "Please provide type or entity" | Falta `columnType` en `@Property()`. Ver PATTERNS.md |
| Meilisearch no indexa | Verificar `OM_SEARCH_ENABLED=true` en env vars |
| Scheduler no corre | Verificar `AUTO_SPAWN_WORKERS=true` |

---

## 9. URLs importantes

| Recurso | URL |
|---------|-----|
| App (producción) | https://mercato.novaincs.com/backend |
| Coolify (deploy) | https://deploy.novaincs.com |
| Portal público | https://mercato.novaincs.com/p/[property-id] |
| Portal agente | https://mercato.novaincs.com/agente/[agent-id] |
| API docs | https://mercato.novaincs.com/api-docs |
| Repo código | https://github.com/aikapenelope/crm-world |
| Repo infra | https://github.com/aikapenelope/mercatinfra |

---

## 10. Credenciales actuales

| Recurso | Valor |
|---------|-------|
| Admin email | admin@mercato-saas.com |
| Admin password | M3rc4t0-Adm1n-2026! |
| Servidor IP | 65.108.61.137 |
| SSH key | En Pulumi stack output (`sshPrivateKey`) |
| Coolify API token | En Pulumi ESC (`mercato-secrets`) |
