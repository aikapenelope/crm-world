import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_vet.view'],
  pageTitle: 'Programas de Vacunación',
  pageTitleKey: 'agri_vet.nav.programs',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 33,
}
