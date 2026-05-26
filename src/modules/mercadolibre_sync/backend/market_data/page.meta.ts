import React from 'react'
import type { PageMetadata } from '@open-mercato/shared/modules/registry'

// chart-column-big icon — lucide-react (reemplaza bar-chart-3 renombrado en v1.x)
const icon = React.createElement(
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
  React.createElement('path', { d: 'M3 3v16a2 2 0 0 0 2 2h16' }),
  React.createElement('rect', { x: 15, y: 5, width: 4, height: 12, rx: 1 }),
  React.createElement('rect', { x: 7, y: 8, width: 4, height: 9, rx: 1 }),
)

export const metadata: PageMetadata = {
  title: 'Datos de Mercado',
  pageGroup: 'Inmobiliaria',
  pageGroupKey: 'nav.group.realestate',
  icon,
  pageOrder: 40,
  requireAuth: true,
  requireFeatures: ['properties.view'],
}
