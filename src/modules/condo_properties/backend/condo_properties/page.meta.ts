import React from 'react'

const buildingIcon = React.createElement(
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
  // Building icon
  React.createElement('rect', { width: 16, height: 20, x: 4, y: 2, rx: 2, ry: 2 }),
  React.createElement('path', { d: 'M9 22v-4h6v4' }),
  React.createElement('path', { d: 'M8 6h.01' }),
  React.createElement('path', { d: 'M16 6h.01' }),
  React.createElement('path', { d: 'M12 6h.01' }),
  React.createElement('path', { d: 'M12 10h.01' }),
  React.createElement('path', { d: 'M12 14h.01' }),
  React.createElement('path', { d: 'M16 10h.01' }),
  React.createElement('path', { d: 'M16 14h.01' }),
  React.createElement('path', { d: 'M8 10h.01' }),
  React.createElement('path', { d: 'M8 14h.01' }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['condo_properties.view'],
  pageTitle: 'Condominios',
  pageTitleKey: 'condo_properties.nav.title',
  icon: buildingIcon,
  pageGroup: 'Condominios',
  pageGroupKey: 'condominios',
  pageOrder: 10,
}
