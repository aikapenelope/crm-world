export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_inventory.reports'],
  pageTitle: 'Sin Movimiento',
  pageTitleKey: 'retail_inventory.nav.dead_stock',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Inventario Retail', labelKey: 'retail_inventory.nav.title', href: '/backend/retail_inventory' },
    { label: 'Sin Movimiento', labelKey: 'retail_inventory.nav.dead_stock' },
  ],
}
