import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Instructores',
  requireAuth: true,
  requireFeatures: ['academy_instructors.view'],
  nav: {
    label: 'Instructores',
    group: 'main',
    order: 2
  },
}
