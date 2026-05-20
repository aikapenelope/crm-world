export const metadata = {
  requireAuth: true,
  requireFeatures: ['retail_loyalty.campaigns'],
  pageTitle: 'Nueva Campaña',
  pageTitleKey: 'retail_loyalty.campaign.create',
  hideFromNav: true,
  breadcrumb: [
    { label: 'Fidelización', labelKey: 'retail_loyalty.nav.title', href: '/backend/retail_loyalty' },
    { label: 'Campañas', labelKey: 'retail_loyalty.nav.campaigns', href: '/backend/retail_loyalty/campaigns' },
    { label: 'Nueva', labelKey: 'retail_loyalty.campaign.create' },
  ],
}
