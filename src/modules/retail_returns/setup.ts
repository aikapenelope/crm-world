import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'
import devolucionDef from '../examples/devolucion-fuera-politica.json'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['retail_returns.*'],
    employee: ['retail_returns.view', 'retail_returns.create'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Devolución Fuera de Política
    // Agente escala al gerente → autoriza devolución completa / solo cambio / rechaza
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      devolucionDef,
    )
  },
}

export default setup
