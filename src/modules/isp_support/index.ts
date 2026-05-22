import type { ModuleInfo } from '@open-mercato/shared/modules/registry'

export const metadata: ModuleInfo = {
  name: 'isp_support',
  title: 'Soporte Técnico ISP',
  version: '0.1.0',
  description: 'Tickets de soporte técnico, averías masivas, SLA por segmento y escalación automática. Integra con isp_network para correlacionar tickets con nodos caídos.',
}
export default metadata
