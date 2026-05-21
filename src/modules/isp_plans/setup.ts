import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['isp_plans.view', 'isp_plans.manage'],
    employee: ['isp_plans.view'],
  },

  async seedDefaults({ em, tenantId, organizationId }) {
    // Verificar si ya hay planes sembrados
    const existing = await (em as any).getKysely()
      .selectFrom('isp_service_plans')
      .select(['id'])
      .where('tenant_id', '=', tenantId)
      .executeTakeFirst()

    if (existing) return

    const { v4 } = await import('uuid')
    const now = new Date()

    // Planes residenciales típicos de un ISP venezolano
    const residentialPlans = [
      { name: 'Básico 10M',    download_mbps: 10,  upload_mbps: 5,   monthly_price_usd: '15.00', sort_order: 1 },
      { name: 'Estándar 20M',  download_mbps: 20,  upload_mbps: 10,  monthly_price_usd: '25.00', sort_order: 2 },
      { name: 'Plus 50M',      download_mbps: 50,  upload_mbps: 25,  monthly_price_usd: '35.00', sort_order: 3 },
      { name: 'Fibra 100M',    download_mbps: 100, upload_mbps: 100, monthly_price_usd: '45.00', sort_order: 4, technology: 'fiber', is_symmetric: true },
    ]

    const pymePlans = [
      { name: 'PYME Básico 50M',  download_mbps: 50,  upload_mbps: 25,  monthly_price_usd: '50.00', target_segment: 'pyme', sort_order: 5 },
      { name: 'PYME Plus 100M',   download_mbps: 100, upload_mbps: 50,  monthly_price_usd: '75.00', target_segment: 'pyme', sort_order: 6 },
      { name: 'PYME Pro 200M',    download_mbps: 200, upload_mbps: 200, monthly_price_usd: '120.00', target_segment: 'pyme', sort_order: 7, technology: 'fiber', is_symmetric: true },
    ]

    const kysely = (em as any).getKysely()
    for (const plan of [...residentialPlans, ...pymePlans]) {
      await kysely.insertInto('isp_service_plans').values({
        id: v4(),
        tenant_id: tenantId,
        organization_id: organizationId,
        name: plan.name,
        technology: (plan as any).technology ?? 'wireless',
        download_mbps: plan.download_mbps,
        upload_mbps: plan.upload_mbps,
        is_symmetric: (plan as any).is_symmetric ?? false,
        monthly_price_usd: plan.monthly_price_usd,
        installation_fee_usd: '0.00',
        target_segment: (plan as any).target_segment ?? 'residential',
        is_active: true,
        is_promotional: false,
        sort_order: plan.sort_order,
        created_at: now,
        updated_at: now,
      }).execute()
    }

    // Addons estándar
    const addons = [
      { name: 'IP Fija',               monthly_price_usd: '5.00' },
      { name: 'Soporte Prioritario',   monthly_price_usd: '15.00' },
    ]
    for (const addon of addons) {
      await kysely.insertInto('isp_plan_addons').values({
        id: v4(),
        tenant_id: tenantId,
        organization_id: organizationId,
        name: addon.name,
        monthly_price_usd: addon.monthly_price_usd,
        is_active: true,
        created_at: now,
        updated_at: now,
      }).execute()
    }
  },
}
export default setup
