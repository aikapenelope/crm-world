import React from 'react'

const routesIcon = React.createElement(
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
  // MapPin icon (lucide)
  React.createElement('path', { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' }),
  React.createElement('circle', { cx: 12, cy: 10, r: 3 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['dist_routes.view'],
  pageTitle: 'Rutas',
  pageTitleKey: 'dist_routes.nav.title',
  icon: routesIcon,
  pageGroup: 'Distribución',
  pageGroupKey: 'distribution',
  pageOrder: 40,
}
