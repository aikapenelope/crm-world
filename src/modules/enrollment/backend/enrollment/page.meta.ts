import React from 'react'

const enrollmentIcon = React.createElement(
  'svg',
  {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  React.createElement('path', { d: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' }),
  React.createElement('rect', { x: 8, y: 2, width: 8, height: 4, rx: 1, ry: 1 }),
  React.createElement('path', { d: 'm9 14 2 2 4-4' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['enrollment.view'],
  pageTitle: 'Inscripciones',
  pageTitleKey: 'enrollment.nav.title',
  icon: enrollmentIcon,
  pageGroup: 'Education',
  pageGroupKey: 'education',
  pageOrder: 20,
}
