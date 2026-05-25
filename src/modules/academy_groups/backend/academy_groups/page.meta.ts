import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Grupos',
  requireAuth: true,
  requireFeatures: ['academy_groups.view'],
  pageGroup: 'Academia',
  pageGroupKey: 'nav.group.academy',
  pageOrder: 30,
}
