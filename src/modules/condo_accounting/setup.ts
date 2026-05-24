import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['condo_accounting.*'],
    employee: ['condo_accounting.view'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Aprobación de Gasto Extraordinario
    // Flujo requerido por Ley de Propiedad Horizontal venezolana para gastos fuera del presupuesto
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      new URL('../examples/gasto-extraordinario.json', import.meta.url),
    )
  },
}

export default setup
