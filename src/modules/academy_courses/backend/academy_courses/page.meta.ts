import type { PageMetadata } from '@open-mercato/shared/modules/registry'
import React from 'react'

export const metadata: PageMetadata = {
  title: 'Cursos',
  requireAuth: true,
  requireFeatures: ['academy_courses.view'],
  nav: {
    label: 'Cursos',
    group: 'academy',
    order: 1,
    icon: React.createElement('svg', {
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
    },
      React.createElement('path', { d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' }),
      React.createElement('path', { d: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' }),
    ),
  },
}
