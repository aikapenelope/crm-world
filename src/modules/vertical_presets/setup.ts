import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    // Solo superadmin puede asignar y ver la vertical de un tenant.
    // El admin regular no tiene acceso a este módulo.
    superadmin: ['vertical_presets.view', 'vertical_presets.manage'],
  },
}

export default setup
