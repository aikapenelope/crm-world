import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  requireCustomerAuth: true,
  requireCustomerFeatures: ['agri_portal.view'],
  nav: {
    label: 'Mis Datos',
    labelKey: 'agri_portal.nav.mis_datos',
    group: 'main',
    order: 30,
  },
}
