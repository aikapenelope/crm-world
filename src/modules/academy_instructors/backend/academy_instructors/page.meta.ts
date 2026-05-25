import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Instructores',
  requireAuth: true,
  requireFeatures: ['academy_instructors.view'],
  pageGroup: 'Academia',
  pageGroupKey: 'nav.group.academy',
  pageOrder: 20,
}
