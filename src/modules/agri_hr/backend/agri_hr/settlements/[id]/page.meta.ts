import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_hr.view'],
  pageTitle: 'Detalle Liquidación',
  navHidden: true,
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
}