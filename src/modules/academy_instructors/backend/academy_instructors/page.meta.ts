import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Instructores',
  requireAuth: true,
  requireFeatures: ['academy_instructors.view'],
  nav: {
    label: 'Instructores',
    group: 'academy',
    order: 2,
    icon: React.createElement('svg', {
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
    },
      React.createElement('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
      React.createElement('circle', { cx: 9, cy: 7, r: 4 }),
      React.createElement('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
      React.createElement('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }),
    ),
  },
}
