import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  requireCustomerAuth: true,
  requireCustomerFeatures: ['agri_portal.view'],
  nav: {
    label: 'Mi Ciclo Actual',
    labelKey: 'agri_portal.nav.mi_ciclo',
    group: 'main',
    order: 10,
  },
}
