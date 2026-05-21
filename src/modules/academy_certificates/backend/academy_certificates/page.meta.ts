import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Certificados',
  requireAuth: true,
  requireFeatures: ['academy_certificates.view'],
  nav: {
    label: 'Certificados',
    group: 'academy',
    order: 7,
    icon: React.createElement('svg', {
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
    },
      React.createElement('circle', { cx: 12, cy: 8, r: 6 }),
      React.createElement('path', { d: 'M15.477 12.89 17 22l-5-3-5 3 1.523-9.11' }),
    ),
  },
}
