import React from 'react'

const inventoryIcon = React.createElement(
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
  // Package icon (lucide)
  React.createElement('path', { d: 'M16.5 9.4 7.55 4.24' }),
  React.createElement('path', { d: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z' }),
  React.createElement('polyline', { points: '3.29 7 12 12 20.71 7' }),
  React.createElement('line', { x1: 12, y1: 22, x2: 12, y2: 12 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['dist_inventory.view'],
  pageTitle: 'Inventario',
  pageTitleKey: 'dist_inventory.nav.title',
  icon: inventoryIcon,
  pageGroup: 'Distribución',
  pageGroupKey: 'distribution',
  pageOrder: 30,
}
