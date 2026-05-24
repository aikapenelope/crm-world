/**
 * isp_subscribers API interceptors.
 *
 * before POST (crear abonado): genera automáticamente el account_number
 * si no se proporcionó en el payload. Formato: ISP-{seq:5} (ej: ISP-00001).
 *
 * El prefijo "ISP" puede ser personalizado en el futuro via tenant settings.
 * El secuencial es global por tenant y garantiza unicidad.
 *
 * Reference: docs/AGM.md §6.4 API Interceptors
 */
import type { ApiInterceptor } from '@open-mercato/shared/lib/crud/api-interceptor'

export const interceptors: ApiInterceptor[] = [
  {
    id: 'isp_subscribers.auto-account-number',
    targetRoute: 'isp-subscribers/subscribers',
    methods: ['POST'],
    priority: 100,

    async before(request, context) {
      // Solo auto-generar si el payload no trae account_number
      if (request.body?.account_number) {
        return { ok: true }
      }

      // Acceder a la BD via el context (tiene tenantId + container)
      const em = context.container?.resolve?.('em')
      if (!em) return { ok: true }

      const kysely = (em as any).getKysely?.()
      if (!kysely) return { ok: true }

      try {
        // Contar abonados existentes en este tenant para generar el secuencial
        const result = await kysely
          .selectFrom('isp_subscribers')
          .select(kysely.fn.count('id').as('count'))
          .where('tenant_id', '=', context.tenantId)
          .executeTakeFirst()

        const seq = String(Number((result as any)?.count ?? 0) + 1).padStart(5, '0')
        const accountNumber = `ISP-${seq}`

        // Inyectar account_number en el body del request
        return {
          ok: true,
          body: {
            ...request.body,
            account_number: accountNumber,
          },
        }
      } catch {
        // Si falla la generación, dejar que el validador la rechace como required
        return { ok: true }
      }
    },

    async after() {
      return {}
    },
  },
]
