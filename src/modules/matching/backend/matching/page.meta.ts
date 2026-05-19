import type { PageMetadata } from '@open-mercato/shared/modules/registry'

export const metadata: PageMetadata = {
  title: 'Matching',
  group: 'Real Estate',
  icon: 'git-compare',
  order: 30,
  requireAuth: true,
  requireFeatures: ['matching.view'],
}
