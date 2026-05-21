import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Pagos',
  requireAuth: true,
  requireFeatures: ['academy_payments.view'],
  nav: {
    label: 'Cobros',
    group: 'academy',
    order: 6,
    icon: React.createElement('svg', {
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
    },
      React.createElement('line', { x1: 12, y1: 1, x2: 12, y2: 23 }),
      React.createElement('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' }),
    ),
  },
}
