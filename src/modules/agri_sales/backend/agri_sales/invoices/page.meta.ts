import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_sales.view'],
  pageTitle: 'Facturas',
  pageTitleKey: 'agri_sales.nav.invoices',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 71,
}
