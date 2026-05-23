import type { PageMetadata } from '@open-mercato/shared/modules/registry'
export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['agri_quality.view'],
  pageTitle: 'Checklists BPM',
  pageTitleKey: 'agri_quality.nav.bpm',
  pageGroup: 'Agroindustria',
  pageGroupKey: 'nav.group.agri',
  pageOrder: 61,
}
