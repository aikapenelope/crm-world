import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Inscripciones',
  requireAuth: true,
  requireFeatures: ['academy_enrollments.view'],
  pageGroup: 'Academia',
  pageGroupKey: 'nav.group.academy',
  pageOrder: 40,
}
