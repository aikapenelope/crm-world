import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'
export const metadata: PageMetadata = { title: 'Detalle de Inscripción', requireAuth: true, requireFeatures: ['academy_enrollments.view'],
  pageGroup: 'Academia',
  pageGroupKey: 'nav.group.academy',
  navHidden: true,
}