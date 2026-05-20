import React from 'react'

const priceListIcon = React.createElement(
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
  // Tag icon (lucide)
  React.createElement('path', { d: 'M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z' }),
  React.createElement('path', { d: 'M7 7h.01' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['dist_price_lists.view'],
  pageTitle: 'Listas de Precios',
  pageTitleKey: 'dist_price_lists.nav.title',
  icon: priceListIcon,
  pageGroup: 'Distribución',
  pageGroupKey: 'distribution',
  pageOrder: 20,
}
