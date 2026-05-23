import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_vet.view'],
  pageTitle: 'Mortalidad',
  pageTitleKey: 'agri_vet.nav.mortality',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 32,
}
