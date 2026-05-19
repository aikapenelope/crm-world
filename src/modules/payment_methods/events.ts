import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'payment_methods',
  events: [
    {
      id: 'payment_methods.payment.recorded',
      label: 'Pago registrado',
      entity: 'payment_record',
      description: 'Se registró un nuevo pago recibido.',
    },
    {
      id: 'payment_methods.payment.confirmed',
      label: 'Pago confirmado',
      entity: 'payment_record',
      description: 'Un pago fue confirmado por un operador.',
    },
    {
      id: 'payment_methods.payment.rejected',
      label: 'Pago rechazado',
      entity: 'payment_record',
      description: 'Un pago fue rechazado.',
    },
  ],
} as const)
