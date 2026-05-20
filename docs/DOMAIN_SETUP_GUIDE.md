# Guía de Configuración de Dominio y Subdominios

> Plan paso a paso para migrar de `mercato.novaincs.com` a un dominio propio con subdominios por tenant.

---

## Arquitectura de Dominios

```
app.tudominio.com              → Panel admin (Super Admin + todos los tenants)
portal.tudominio.com           → Portal de clientes (representantes, compradores)
tudominio.com                  → Landing page (opcional)
```

Alternativa con subdominios por tenant:
```
admin.tudominio.com            → Super Admin
colegio-xyz.tudominio.com      → Tenant específico (custom domain)
inmobiliaria-abc.tudominio.com → Tenant específico (custom domain)
```

---

## Paso 1: Configurar DNS

En el panel del registrador de dominio (Namecheap, Cloudflare, GoDaddy, etc.):

```
Tipo    Nombre    Valor                TTL
A       @         65.108.61.137        300
A       *         65.108.61.137        300
CNAME   www       tudominio.com        300
```

El wildcard `*` permite que cualquier subdominio apunte al servidor sin configuración adicional.

**Verificar:**
```bash
dig tudominio.com +short
# Debe retornar: 65.108.61.137

dig app.tudominio.com +short
# Debe retornar: 65.108.61.137

dig cualquier-cosa.tudominio.com +short
# Debe retornar: 65.108.61.137
```

---

## Paso 2: Configurar Coolify

En el panel de Coolify (https://deploy.novaincs.com):

1. Ir a la app `mercato-app`
2. En "Domains", agregar:
   - `https://app.tudominio.com` (dominio principal)
   - `https://*.tudominio.com` (wildcard para subdominios de tenants)
3. Coolify/Traefik generará certificados TLS automáticamente via Let's Encrypt

**Nota**: Coolify 4.0+ soporta wildcard TLS con Let's Encrypt DNS challenge. Si el registrador soporta API (Cloudflare), se puede automatizar. Si no, usar HTTP challenge (funciona para dominios individuales, no wildcard).

**Alternativa sin wildcard TLS**: Usar dominios individuales por tenant y agregarlos manualmente en Coolify cuando se crea cada tenant.

---

## Paso 3: Variables de Entorno en Coolify

Actualizar las variables de entorno de la app:

```env
# Dominio principal
NEXT_PUBLIC_APP_URL=https://app.tudominio.com
NEXTAUTH_URL=https://app.tudominio.com

# Para custom domains por tenant (portal)
PLATFORM_PRIMARY_HOST=tudominio.com

# Mantener el dominio anterior como alias (transición)
# NEXT_PUBLIC_APP_URL_LEGACY=https://mercato.novaincs.com
```

---

## Paso 4: Configurar Open Mercato para Custom Domains

Open Mercato v0.6.1 soporta custom domains por tenant para el portal de clientes. Configurar en:

1. **Admin** → Directory → Organization → editar
2. Campo "Custom Domain": `colegio-xyz.tudominio.com`
3. Open Mercato verifica el dominio y lo activa

Para que funcione, el dominio debe apuntar al servidor (ya cubierto por el wildcard DNS).

---

## Paso 5: Traefik (si se usa docker-compose.fullapp.traefik.yml)

Si se activa Traefik como reverse proxy (recomendado para multi-dominio):

```yaml
# docker-compose.fullapp.traefik.yml
services:
  traefik:
    labels:
      - "traefik.http.routers.app.rule=Host(`app.tudominio.com`) || HostRegexp(`{subdomain:[a-z0-9-]+}.tudominio.com`)"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
```

**Nota**: Coolify ya maneja Traefik internamente. Solo necesitas configurar los dominios en la UI de Coolify.

---

## Paso 6: Migración (transición suave)

1. Configurar el nuevo dominio (pasos 1-4)
2. Verificar que funciona: `https://app.tudominio.com/backend`
3. Mantener `mercato.novaincs.com` activo como alias durante 30 días
4. Redirigir el dominio anterior al nuevo (301 redirect)
5. Después de 30 días, eliminar el dominio anterior

---

## Paso 7: Email (Resend)

Si se configura Resend para emails transaccionales:

1. Agregar dominio en Resend: `tudominio.com`
2. Configurar DNS records que Resend requiere (SPF, DKIM, DMARC)
3. Variable de entorno: `RESEND_FROM_EMAIL=notificaciones@tudominio.com`

---

## Checklist

- [ ] Dominio registrado y pagado
- [ ] DNS configurado (A + wildcard)
- [ ] DNS propagado (verificar con dig)
- [ ] Coolify: dominio agregado a la app
- [ ] TLS: certificado generado automáticamente
- [ ] Variables de entorno actualizadas
- [ ] Verificar login en nuevo dominio
- [ ] Verificar portal de clientes en subdominio
- [ ] Configurar Resend (opcional)
- [ ] Redirigir dominio anterior (después de 30 días)

---

## Notas

- **No se necesita Clerk**: Open Mercato tiene auth nativo (JWT + bcrypt + RBAC). Funciona bien para el caso de uso (admin crea usuarios, no hay self-service).
- **SSO es opcional**: Si en el futuro se necesita login con Google/Microsoft, se activa el módulo Enterprise SSO (OIDC).
- **El wildcard DNS es la clave**: Con `*.tudominio.com → servidor`, cualquier subdominio funciona sin configuración adicional.
- **Coolify maneja TLS**: No hay que configurar certificados manualmente.
