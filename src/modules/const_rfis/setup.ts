import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'
import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'
import changeOrderDef from '../examples/change-order-approval.json'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    admin: ['const_rfis.*'],
    employee: ['const_rfis.view', 'const_rfis.manage'],
  },

  seedDefaults: async (ctx) => {
    const scope = { tenantId: ctx.tenantId, organizationId: ctx.organizationId }
    // Workflow: Change Order Approval
    // Flujo de 2 pasos: revisión técnica (residente de obra) → aprobación de dirección
    await seedModuleWorkflow(
      ctx.em as any,
      scope,
      changeOrderDef,
    )
  },
}

export default setup
