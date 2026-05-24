import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Cursos',
  requireAuth: true,
  requireFeatures: ['academy_courses.view'],
  nav: {
    label: 'Cursos',
    group: 'main',
    order: 1
  },
}
