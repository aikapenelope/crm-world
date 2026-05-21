import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    superadmin: ['academy_courses.*'],
    admin: ['academy_courses.*'],
    employee: ['academy_courses.view'],
  },
  async seedDefaults({ em, tenantId, organizationId }) {
    // Course categories and levels are configured via dictionaries module
    // No DB seed needed — the defaults are in the UI dropdowns
  },
}

export default setup
