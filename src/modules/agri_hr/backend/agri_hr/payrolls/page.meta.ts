import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_hr.view'],
  pageTitle: 'Nóminas Jornaleros',
  pageTitleKey: 'agri_hr.nav.payrolls',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 87,
}
