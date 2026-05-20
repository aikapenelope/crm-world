import React from 'react'

const projectsIcon = React.createElement(
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
  // HardHat icon (construction)
  React.createElement('path', { d: 'M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z' }),
  React.createElement('path', { d: 'M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5' }),
  React.createElement('path', { d: 'M4 15v-3a6 6 0 0 1 6-6h0' }),
  React.createElement('path', { d: 'M14 6h0a6 6 0 0 1 6 6v3' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['const_projects.view'],
  pageTitle: 'Construcción',
  pageTitleKey: 'const_projects.nav.title',
  icon: projectsIcon,
  pageGroup: 'Construcción',
  pageGroupKey: 'construccion',
  pageOrder: 10,
}
