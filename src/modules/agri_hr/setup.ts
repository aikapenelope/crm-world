import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@app/lib/workflows/seed-workflow'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin:    ['agri_hr.*'],
    employee: ['agri_hr.view'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Liquidación del Productor Integrado
    // Técnico propone → gerente de producción aprueba → portal notifica al productor.
    // Con ajuste por FCA y peso vs objetivos del contrato de integración.
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      new URL('../examples/liquidacion-productor-v1.json', import.meta.url),
    )
  },
}

export default setup
