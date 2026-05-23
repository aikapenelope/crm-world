import { createModuleEvents } from '@open-mercato/shared/modules/events'

export const eventsConfig = createModuleEvents({
  moduleId: 'agri_quality',
  events: [
    { id: 'agri_quality.ccp.deviation_detected',   label: 'Desviación de PCC detectada — lote bloqueado', entity: 'ccp',            category: 'alert',     clientBroadcast: true },
    { id: 'agri_quality.nc.created',               label: 'No-conformidad creada',                       entity: 'non_conformity', category: 'crud',      clientBroadcast: true },
    { id: 'agri_quality.nc.decision_made',         label: 'Decisión tomada sobre no-conformidad',        entity: 'non_conformity', category: 'lifecycle', clientBroadcast: true },
    { id: 'agri_quality.nc.closed',                label: 'No-conformidad cerrada',                      entity: 'non_conformity', category: 'lifecycle' },
    { id: 'agri_quality.bpm.fail_detected',        label: 'Checklist BPM con hallazgos críticos',        entity: 'bpm_checklist',  category: 'alert',     clientBroadcast: true },
    { id: 'agri_quality.haccp_plan.activated',     label: 'Plan HACCP activado',                         entity: 'haccp_plan',     category: 'lifecycle' },
  ],
} as const)
