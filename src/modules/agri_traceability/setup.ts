import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'
import { recallV1 as recallDef } from '@/lib/workflows/definitions'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['agri_traceability.*'],
    employee: ['agri_traceability.view'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Recall de Producto
    // Inicio → aprobación del GM → ejecución con lista de clientes afectados.
    // Clase I requiere notificación al INSAI en < 24 horas.
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      recallDef,
    )
  },
}

export default setup
