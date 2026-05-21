import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Detalle del Proyecto',
  requireAuth: true,
  requireFeatures: ['const_projects.view'],
}
