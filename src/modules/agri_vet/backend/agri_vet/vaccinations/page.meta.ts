import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_vet.view'],
  pageTitle: 'Vacunaciones',
  pageTitleKey: 'agri_vet.nav.vaccinations',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 31,
}
