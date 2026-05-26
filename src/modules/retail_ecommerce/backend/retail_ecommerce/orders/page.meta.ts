export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_ecommerce.view'],
  pageTitle: 'Pedidos Online',
  pageTitleKey: 'retail_ecommerce.nav.orders',
  navHidden: true,
  breadcrumb: [
    { label: 'E-commerce', labelKey: 'retail_ecommerce.nav.title', href: '/backend/retail_ecommerce' },
    { label: 'Pedidos', labelKey: 'retail_ecommerce.nav.orders' },
  ],
  pageGroup: 'Retail',
  pageGroupKey: 'retail.nav.group',
  pageOrder: 200,
}