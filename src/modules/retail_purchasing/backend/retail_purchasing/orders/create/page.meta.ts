export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_purchasing.create'],
  pageTitle: 'Nueva Orden de Compra',
  pageTitleKey: 'retail_purchasing.order.create',
  navHidden: true,
  breadcrumb: [
    { label: 'Compras', labelKey: 'retail_purchasing.nav.title', href: '/backend/retail_purchasing' },
    { label: 'Nueva Orden', labelKey: 'retail_purchasing.order.create' },
  ],
}
