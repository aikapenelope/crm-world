import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Inscripciones',
  requireAuth: true,
  requireFeatures: ['academy_enrollments.view'],
  nav: {
    label: 'Inscripciones',
    group: 'main',
    order: 4
  },
}
