export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_pricing.alerts'],
  pageTitle: 'Alertas de Precio',
  pageTitleKey: 'retail_pricing.nav.alerts',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Pricing', labelKey: 'retail_pricing.nav.title', href: '/backend/retail_pricing' },
    { label: 'Alertas', labelKey: 'retail_pricing.nav.alerts' },
  ],
}
