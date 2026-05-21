import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'
export const metadata: PageMetadata = {
  title: 'Detalle del Edificio',
  requireAuth: true,
  requireFeatures: ['condo_properties.view'],
}
