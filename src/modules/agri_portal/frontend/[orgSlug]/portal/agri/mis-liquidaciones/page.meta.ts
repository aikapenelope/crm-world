import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  requireCustomerAuth: true,
  requireCustomerFeatures: ['agri_portal.view'],
  nav: {
    label: 'Mis Liquidaciones',
    labelKey: 'agri_portal.nav.mis_liquidaciones',
    group: 'main',
    order: 20,
  },
}
