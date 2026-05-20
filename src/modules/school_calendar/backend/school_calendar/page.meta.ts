import React from 'react'

const calendarIcon = React.createElement(
  'svg',
  { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' },
  React.createElement('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }),
  React.createElement('line', { x1: 16, y1: 2, x2: 16, y2: 6 }),
  React.createElement('line', { x1: 8, y1: 2, x2: 8, y2: 6 }),
  React.createElement('line', { x1: 3, y1: 10, x2: 21, y2: 10 }),
)

export const metadata = {
  requireAuth: true,
  requireFeatures: ['school_calendar.view'],
  pageTitle: 'Calendario Escolar',
  pageTitleKey: 'school_calendar.nav.title',
  icon: calendarIcon,
  pageGroup: 'Education',
  pageGroupKey: 'education',
  pageOrder: 60,
}
