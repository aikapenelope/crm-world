import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Pagos',
  requireAuth: true,
  requireFeatures: ['academy_payments.view'],
  nav: {
    label: 'Cobros',
    group: 'main',
    order: 6
  },
}
