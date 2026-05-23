import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@app/lib/workflows/seed-workflow'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['mfg_orders.*'],
    employee: ['mfg_orders.view', 'mfg_orders.execute'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Escalación de Paro Prolongado
    // Se activa cuando un paro supera las 2 horas sin resolución.
    // Supervisor escala → gerente de mantenimiento interviene → confirma resolución.
    // Garantiza que la gerencia esté informada antes de comprometer fechas de entrega.
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      new URL('../examples/downtime-escalation-v1.json', import.meta.url),
    )
  },
}
export default setup
