import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'
export const metadata: PageMetadata = { title: 'Sesión de Clase', requireAuth: true, requireFeatures: ['academy_sessions.view'],
  pageGroup: 'Academia',
  pageGroupKey: 'nav.group.academy',
  navHidden: true,
}