import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  requireAuth: true,
  requireFeatures: ['isp_plans.manage'],
  pageTitle: 'Nuevo Plan',
  navHidden: true,
  pageGroup: 'ISP',
  pageGroupKey: 'nav.group.isp',
}