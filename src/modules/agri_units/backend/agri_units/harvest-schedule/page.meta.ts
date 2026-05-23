import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_units.view'],
  pageTitle: 'Programa de Cosecha',
  pageTitleKey: 'agri_units.nav.harvest_schedule',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 12,
}
