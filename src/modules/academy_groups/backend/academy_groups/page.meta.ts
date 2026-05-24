import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Grupos',
  requireAuth: true,
  requireFeatures: ['academy_groups.view'],
  nav: {
    label: 'Grupos',
    group: 'main',
    order: 3
  },
}
