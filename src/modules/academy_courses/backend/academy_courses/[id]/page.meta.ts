import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'
export const metadata: PageMetadata = { title: 'Detalle del Curso', requireAuth: true, requireFeatures: ['academy_courses.view'],
  pageGroup: 'Academia',
  pageGroupKey: 'nav.group.academy',
  navHidden: true,
}