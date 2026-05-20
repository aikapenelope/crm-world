export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_purchasing.view'],
  pageTitle: 'Detalle Orden de Compra',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Compras', labelKey: 'retail_purchasing.nav.title', href: '/backend/retail_purchasing' },
    { label: 'Detalle' },
  ],
}
