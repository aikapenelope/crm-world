export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_inventory.count'],
  pageTitle: 'Ejecutar Conteo',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Inventario Retail', labelKey: 'retail_inventory.nav.title', href: '/backend/retail_inventory' },
    { label: 'Conteos', labelKey: 'retail_inventory.nav.counts', href: '/backend/retail_inventory/counts' },
    { label: 'Ejecutar' },
  ],
}
