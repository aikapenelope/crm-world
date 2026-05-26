import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Orden de Servicio',
  requireAuth: true,
  requireFeatures: ['auto_service_orders.view'],
  pageGroup: 'Taller',
  pageGroupKey: 'automotive',
  navHidden: true,
}