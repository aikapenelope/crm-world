import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: [
      'isp_billing.view', 'isp_billing.manage', 'isp_billing.register_payment',
      'isp_billing.generate', 'isp_billing.cancel_invoice', 'isp_billing.view_reports',
    ],
    employee: [
      'isp_billing.view', 'isp_billing.register_payment',
    ],
  },

  async seedDefaults({ em, tenantId, organizationId }) {
    // Verificar si ya hay ciclos de facturación sembrados
    const existing = await (em as any).getKysely()
      .selectFrom('isp_billing_cycles')
      .select(['id'])
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst()

    if (existing) return

    const { v4 } = await import('uuid')
    const now = new Date()

    // Crear ciclo de facturación por defecto: día 1 del mes
    await (em as any).getKysely().insertInto('isp_billing_cycles').values({
      id: v4(),
      tenant_id: tenantId,
      organization_id: organizationId,
      name: 'Ciclo 1 — Todos los abonados',
      billing_day: 1,
      segment: null,
      is_active: true,
      created_at: now,
      updated_at: now,
    }).execute()
  },
}
export default setup
