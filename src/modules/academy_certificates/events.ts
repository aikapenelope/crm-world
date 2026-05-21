import { createModuleEvents } from '@open-mercato/shared/modules/events'
export const eventsConfig = createModuleEvents({
  moduleId: 'academy_certificates',
  events: [
    { id: 'academy_certificates.certificate.issued', label: 'Certificado emitido', entity: 'certificate', category: 'lifecycle', clientBroadcast: true },
  ],
} as const)
