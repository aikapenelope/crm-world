import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'
export const metadata: PageMetadata = { title: 'Nuevo Curso', requireAuth: true, requireFeatures: ['academy_courses.manage'],
  pageGroup: 'Academia',
  pageGroupKey: 'nav.group.academy',
}