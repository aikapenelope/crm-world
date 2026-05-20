import React from 'react'

const deliveryIcon = React.createElement(
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
  // Truck icon (lucide)
  React.createElement('path', { d: 'M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2' }),
  React.createElement('path', { d: 'M15 18H9' }),
  React.createElement('path', { d: 'M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14' }),
  React.createElement('circle', { cx: 17, cy: 18, r: 2 }),
  React.createElement('circle', { cx: 7, cy: 18, r: 2 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['dist_delivery.view'],
  pageTitle: 'Despachos',
  pageTitleKey: 'dist_delivery.nav.title',
  icon: deliveryIcon,
  pageGroup: 'Distribución',
  pageGroupKey: 'distribution',
  pageOrder: 50,
}
