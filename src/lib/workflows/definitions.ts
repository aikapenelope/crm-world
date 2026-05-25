/**
 * Workflow definition registry for Aika Platform custom modules.
 *
 * All workflow definitions are inlined here as TypeScript objects to avoid
 * static import resolution issues with esbuild (generator) and Turbopack (next build).
 * Previously, each setup.ts imported its workflow JSON file directly, which caused
 * Turbopack "Module not found" errors and esbuild "Cannot read file" errors.
 *
 * Usage in setup.ts:
 *   import { seedModuleWorkflow } from '@/lib/workflows/seed-workflow'
 *   import { bomApprovalV1 } from '@/lib/workflows/definitions'
 *   await seedModuleWorkflow(ctx.em, scope, bomApprovalV1)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WorkflowDefinitionJson = Record<string, any>

/** Liquidación del Productor Integrado */
export const liquidacionProductorV1: WorkflowDefinitionJson = {
  "workflowId": "liquidacion_productor_v1",
  "workflowName": "Liquidación del Productor Integrado",
  "description": "Flujo de aprobación de la liquidación económica al productor integrado al final de cada ciclo de producción. El técnico de campo calcula la liquidación basándose en los resultados reales del ciclo (FCA, peso promedio, mortalidad). El gerente de producción revisa y aprueba el pago. Una vez aprobado, el productor recibe la notificación en su portal.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Agroindustria",
    "icon": "file-text",
    "entityType": "AgriProducerSettlement",
    "tags": [
      "produccion",
      "integrado",
      "liquidacion",
      "pago",
      "fca",
      "ciclo"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Liquidación Calculada",
        "stepType": "START",
        "description": "El técnico de campo registró los resultados finales del ciclo y calculó el monto de liquidación según las tablas del contrato de integración."
      },
      {
        "stepId": "revision_tecnico",
        "stepName": "Revisión del Técnico de Campo",
        "stepType": "USER_TASK",
        "description": "El técnico verifica que todos los datos del ciclo son correctos y propone la liquidación al gerente",
        "config": {
          "taskName": "Revisar y proponer liquidación al gerente",
          "description": "Verifique los datos del ciclo: FCA real vs objetivo, peso promedio, mortalidad, aves finales. Confirme que el cálculo es correcto y adjunte los reportes de campo si los hay.",
          "formFields": [
            {
              "id": "data_verified",
              "label": "¿Datos del ciclo verificados?",
              "type": "checkbox",
              "required": true
            },
            {
              "id": "flock_report_attached",
              "label": "¿Reporte final del lote adjunto?",
              "type": "checkbox"
            },
            {
              "id": "technical_notes",
              "label": "Observaciones técnicas del ciclo",
              "type": "textarea",
              "required": false
            },
            {
              "id": "technical_recommendation",
              "label": "Recomendación al productor para el próximo ciclo",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "aprobacion_gerencia",
        "stepName": "Aprobación del Gerente de Producción",
        "stepType": "USER_TASK",
        "description": "El gerente revisa la liquidación y decide si aprueba el pago al productor integrado",
        "config": {
          "taskName": "Aprobar liquidación del productor integrado",
          "description": "Revise el desempeño del productor en este ciclo comparado con los objetivos del contrato. Verifique el cálculo de bonos, penalizaciones y el monto total a pagar. Una vez aprobado, el productor será notificado en su portal.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobado — proceder con el pago"
                },
                {
                  "value": "adjust",
                  "label": "Ajustar montos — requiere recálculo"
                },
                {
                  "value": "hold",
                  "label": "En espera — faltan datos"
                }
              ]
            },
            {
              "id": "approved_amount_usd",
              "label": "Monto aprobado (USD) — dejar en blanco si igual al calculado",
              "type": "text"
            },
            {
              "id": "payment_instructions",
              "label": "Instrucciones de pago / notas para contabilidad",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "end_approved",
        "stepName": "Pago Autorizado",
        "stepType": "END",
        "description": "Liquidación aprobada. Notificar al productor en su portal y procesar el pago."
      },
      {
        "stepId": "end_adjust",
        "stepName": "Requiere Ajuste",
        "stepType": "END",
        "description": "Gerencia solicitó ajustes. El técnico debe recalcular la liquidación."
      },
      {
        "stepId": "end_hold",
        "stepName": "En Espera",
        "stepType": "END",
        "description": "Liquidación pausada esperando datos adicionales."
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "revision_tecnico"
      },
      {
        "from": "revision_tecnico",
        "to": "aprobacion_gerencia"
      },
      {
        "from": "aprobacion_gerencia",
        "to": "end_approved",
        "condition": "decision === 'approve'"
      },
      {
        "from": "aprobacion_gerencia",
        "to": "end_adjust",
        "condition": "decision === 'adjust'"
      },
      {
        "from": "aprobacion_gerencia",
        "to": "end_hold",
        "condition": "decision === 'hold'"
      }
    ]
  }
}

/** Despacho Sanitario — Aprobación de Calidad */
export const despachoSanitario: WorkflowDefinitionJson = {
  "workflowId": "despacho_sanitario_v1",
  "workflowName": "Despacho Sanitario — Aprobación de Calidad",
  "description": "Flujo de aprobación obligatorio antes de despachar un lote de beneficio. El responsable de planta solicita el despacho; el jefe de control de calidad verifica los resultados microbiológicos, el rendimiento del lote y la documentación INSAI, y firma la autorización.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Agroindustria",
    "icon": "clipboard-check",
    "entityType": "AgriSlaughterBatch",
    "tags": [
      "beneficio",
      "calidad",
      "despacho",
      "sanitario",
      "insai"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Solicitud de Despacho",
        "stepType": "START",
        "description": "Responsable de planta solicita autorización para despachar el lote beneficiado"
      },
      {
        "stepId": "revision_calidad",
        "stepName": "Revisión de Control de Calidad",
        "stepType": "USER_TASK",
        "description": "El jefe de control de calidad revisa resultados microbiológicos, temperatura de canal, decomisos y documentación INSAI",
        "config": {
          "taskName": "Aprobar despacho sanitario del lote",
          "description": "Revise: resultado microbiológico del lote, temperatura de canal frío, porcentaje de decomisos vs normal, registros de vacunación y medicación del flock de origen. El despacho solo puede aprobarse si todos los parámetros están dentro de los límites.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobado — autorizar despacho"
                },
                {
                  "value": "hold",
                  "label": "En espera — falta documentación"
                },
                {
                  "value": "reject",
                  "label": "Rechazado — no cumple estándares"
                }
              ]
            },
            {
              "id": "microbiological_ok",
              "label": "¿Resultado microbiológico aprobado?",
              "type": "checkbox",
              "required": true
            },
            {
              "id": "temperature_ok",
              "label": "¿Temperatura de canal dentro del rango (<4°C)?",
              "type": "checkbox",
              "required": true
            },
            {
              "id": "insai_docs_ok",
              "label": "¿Documentación INSAI completa?",
              "type": "checkbox",
              "required": true
            },
            {
              "id": "observations",
              "label": "Observaciones / condicionantes",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "end_approved",
        "stepName": "Despacho Autorizado",
        "stepType": "END",
        "description": "Lote autorizado para despacho. Registrar dispatch_approved_by en el sistema."
      },
      {
        "stepId": "end_hold",
        "stepName": "En Espera",
        "stepType": "END",
        "description": "Lote en espera de documentación faltante antes de autorizar"
      },
      {
        "stepId": "end_rejected",
        "stepName": "Rechazado",
        "stepType": "END",
        "description": "Lote rechazado — no cumple estándares mínimos de calidad o inocuidad"
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "revision_calidad"
      },
      {
        "from": "revision_calidad",
        "to": "end_approved",
        "condition": "decision === 'approve'"
      },
      {
        "from": "revision_calidad",
        "to": "end_hold",
        "condition": "decision === 'hold'"
      },
      {
        "from": "revision_calidad",
        "to": "end_rejected",
        "condition": "decision === 'reject'"
      }
    ]
  }
}

/** No-Conformidad Crítica de PCC */
export const noConformidadCcp: WorkflowDefinitionJson = {
  "workflowId": "no_conformidad_ccp_v1",
  "workflowName": "No-Conformidad Crítica de PCC",
  "description": "Flujo de gestión de no-conformidades originadas en desviaciones de Puntos Críticos de Control (PCCs). Cuando un CCP supera su límite, el lote queda bloqueado automáticamente. El gerente de calidad investiga y decide la disposición del lote (retrabajo, destrucción, liberación con excepción documentada, o cuarentena). El flujo cumple los requisitos de HACCP Codex Alimentarius y las normas COVENIN venezolanas.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Agroindustria",
    "icon": "alert-octagon",
    "entityType": "AgriNonConformity",
    "tags": [
      "calidad",
      "haccp",
      "ccp",
      "no-conformidad",
      "inocuidad"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Desviación de PCC Detectada",
        "stepType": "START",
        "description": "Sistema detectó que el valor medido superó el límite crítico del PCC. Lote bloqueado automáticamente hasta decisión del gerente de calidad."
      },
      {
        "stepId": "investigacion",
        "stepName": "Investigación y Análisis de Causa Raíz",
        "stepType": "USER_TASK",
        "description": "El equipo de calidad investiga la causa raíz de la desviación antes de tomar una decisión sobre el lote afectado",
        "config": {
          "taskName": "Investigar causa raíz de la desviación",
          "description": "Revisar: parámetros del proceso al momento de la desviación, historial del equipo/sensor, condiciones ambientales, posible contaminación del lote. Documentar todos los hallazgos.",
          "formFields": [
            {
              "id": "root_cause",
              "label": "Causa raíz identificada",
              "type": "textarea",
              "required": true
            },
            {
              "id": "lot_risk",
              "label": "Evaluación de riesgo para el lote",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "high",
                  "label": "Alto riesgo — posible peligro para el consumidor"
                },
                {
                  "value": "medium",
                  "label": "Riesgo moderado — requiere análisis adicional"
                },
                {
                  "value": "low",
                  "label": "Bajo riesgo — desviación controlable"
                }
              ]
            },
            {
              "id": "additional_analysis_needed",
              "label": "¿Se requieren análisis adicionales?",
              "type": "checkbox"
            },
            {
              "id": "investigation_notes",
              "label": "Notas de investigación",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "decision_calidad",
        "stepName": "Decisión del Gerente de Calidad",
        "stepType": "USER_TASK",
        "description": "El gerente de calidad toma la decisión final sobre la disposición del lote basándose en la investigación",
        "config": {
          "taskName": "Decidir disposición del lote afectado",
          "description": "Basándose en la investigación de causa raíz y la evaluación de riesgo, determine la disposición del lote. La decisión debe ser proporcional al riesgo real para el consumidor y estar documentada con justificación.",
          "formFields": [
            {
              "id": "decision",
              "label": "Disposición del lote",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "rework",
                  "label": "Retrabajo — reprocesar bajo condiciones controladas"
                },
                {
                  "value": "destroy",
                  "label": "Destrucción — eliminar el lote completamente"
                },
                {
                  "value": "release",
                  "label": "Liberar — con desviación documentada y justificada"
                },
                {
                  "value": "hold",
                  "label": "Cuarentena — análisis adicionales requeridos"
                }
              ]
            },
            {
              "id": "corrective_action",
              "label": "Acción correctiva inmediata",
              "type": "textarea",
              "required": true
            },
            {
              "id": "preventive_action",
              "label": "Acción preventiva (para evitar recurrencia)",
              "type": "textarea",
              "required": true
            },
            {
              "id": "decision_justification",
              "label": "Justificación de la decisión",
              "type": "textarea",
              "required": true
            }
          ]
        }
      },
      {
        "stepId": "end_rework",
        "stepName": "Retrabajo Autorizado",
        "stepType": "END",
        "description": "Lote enviado a reproceso bajo condiciones controladas. Documentar procedimiento de retrabajo."
      },
      {
        "stepId": "end_destroy",
        "stepName": "Destrucción Autorizada",
        "stepType": "END",
        "description": "Lote destruido. Documentar método de destrucción, cantidad y evidencia fotográfica."
      },
      {
        "stepId": "end_release",
        "stepName": "Lote Liberado con Excepción",
        "stepType": "END",
        "description": "Lote liberado con desviación documentada y justificación del gerente de calidad."
      },
      {
        "stepId": "end_hold",
        "stepName": "Cuarentena",
        "stepType": "END",
        "description": "Lote en cuarentena hasta recibir resultados de análisis adicionales."
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "investigacion"
      },
      {
        "from": "investigacion",
        "to": "decision_calidad"
      },
      {
        "from": "decision_calidad",
        "to": "end_rework",
        "condition": "decision === 'rework'"
      },
      {
        "from": "decision_calidad",
        "to": "end_destroy",
        "condition": "decision === 'destroy'"
      },
      {
        "from": "decision_calidad",
        "to": "end_release",
        "condition": "decision === 'release'"
      },
      {
        "from": "decision_calidad",
        "to": "end_hold",
        "condition": "decision === 'hold'"
      }
    ]
  }
}

/** Recall de Producto — Retiro de Mercado */
export const recallV1: WorkflowDefinitionJson = {
  "workflowId": "recall_v1",
  "workflowName": "Recall de Producto — Retiro de Mercado",
  "description": "Flujo de autorización y ejecución de un recall de producto terminado. Iniciado por el equipo de calidad cuando se detecta un peligro de inocuidad. El Gerente General (GM) aprueba el recall y autoriza las notificaciones a clientes e instituciones regulatorias (INSAI). Clase I requiere notificación al INSAI dentro de las 24 horas según normativa venezolana.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Agroindustria",
    "icon": "alert-triangle",
    "entityType": "AgriRecall",
    "tags": [
      "recall",
      "inocuidad",
      "trazabilidad",
      "insai",
      "retiro-mercado"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Recall Iniciado",
        "stepType": "START",
        "description": "Equipo de calidad detecta un peligro de inocuidad y crea el recall. Sistema genera automáticamente la lista de clientes afectados. Lote marcado como 'recalled'."
      },
      {
        "stepId": "aprobacion_gm",
        "stepName": "Aprobación del Gerente General",
        "stepType": "USER_TASK",
        "description": "El GM revisa el alcance del recall, los clientes afectados y la clase de riesgo. Autoriza el inicio de las notificaciones y comunicaciones regulatorias.",
        "config": {
          "taskName": "Aprobar y autorizar recall de producto",
          "description": "Revisar: clase de riesgo, clientes afectados, cantidades involucradas, causa del problema. Si es Clase I, se requiere notificación al INSAI en < 24 horas. Autorizar las comunicaciones necesarias.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobado — proceder con el recall"
                },
                {
                  "value": "investigate_more",
                  "label": "Ampliar investigación antes de decidir"
                },
                {
                  "value": "cancel",
                  "label": "Cancelar — evidencia insuficiente"
                }
              ]
            },
            {
              "id": "insai_notified",
              "label": "¿INSAI notificado?",
              "type": "checkbox"
            },
            {
              "id": "public_statement_needed",
              "label": "¿Se requiere comunicado público?",
              "type": "checkbox"
            },
            {
              "id": "client_notification_approved",
              "label": "Autorizar notificación a clientes",
              "type": "checkbox",
              "required": true
            },
            {
              "id": "gm_notes",
              "label": "Instrucciones del GM",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "ejecucion",
        "stepName": "Ejecución del Recall",
        "stepType": "USER_TASK",
        "description": "Equipo de calidad ejecuta el recall: notifica a clientes, coordina devoluciones, documenta cantidades recuperadas",
        "config": {
          "taskName": "Ejecutar y documentar el recall",
          "description": "Notificar a todos los clientes en la lista de afectados. Coordinar la devolución o destrucción del producto. Documentar las cantidades recuperadas de cada cliente.",
          "formFields": [
            {
              "id": "clients_notified_count",
              "label": "Clientes notificados",
              "type": "text",
              "required": true
            },
            {
              "id": "quantity_recovered_kg",
              "label": "Cantidad recuperada (kg)",
              "type": "text"
            },
            {
              "id": "destruction_method",
              "label": "Método de destrucción (si aplica)",
              "type": "textarea"
            },
            {
              "id": "execution_notes",
              "label": "Notas de ejecución",
              "type": "textarea",
              "required": true
            }
          ]
        }
      },
      {
        "stepId": "end_completed",
        "stepName": "Recall Completado",
        "stepType": "END",
        "description": "Recall ejecutado exitosamente. Generar informe final para archivo y reguladores."
      },
      {
        "stepId": "end_investigate",
        "stepName": "En Investigación Adicional",
        "stepType": "END",
        "description": "Recall pausado — se requiere más información antes de proceder."
      },
      {
        "stepId": "end_cancelled",
        "stepName": "Recall Cancelado",
        "stepType": "END",
        "description": "Recall cancelado por el GM. Documentar la justificación."
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "aprobacion_gm"
      },
      {
        "from": "aprobacion_gm",
        "to": "ejecucion",
        "condition": "decision === 'approve'"
      },
      {
        "from": "aprobacion_gm",
        "to": "end_investigate",
        "condition": "decision === 'investigate_more'"
      },
      {
        "from": "aprobacion_gm",
        "to": "end_cancelled",
        "condition": "decision === 'cancel'"
      },
      {
        "from": "ejecucion",
        "to": "end_completed"
      }
    ]
  }
}

/** Aprobación de Gasto Extraordinario */
export const gastoExtraordinario: WorkflowDefinitionJson = {
  "workflowId": "gasto_extraordinario_v1",
  "workflowName": "Aprobación de Gasto Extraordinario",
  "description": "Flujo de aprobación para gastos extraordinarios del condominio. El administrador propone el gasto, la junta de propietarios delibera y vota. Si se aprueba, el gasto queda registrado formalmente. Requerido por la Ley de Propiedad Horizontal venezolana para gastos fuera del presupuesto ordinario.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Condominios",
    "icon": "building",
    "entityType": "CondoAccountingEntry",
    "tags": [
      "condominio",
      "gasto",
      "junta",
      "aprobacion"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Inicio",
        "stepType": "START",
        "description": "El administrador envía el gasto a aprobación de la junta"
      },
      {
        "stepId": "junta_vota",
        "stepName": "Votación de la Junta",
        "stepType": "USER_TASK",
        "description": "La junta de propietarios delibera y vota el gasto extraordinario",
        "config": {
          "taskName": "Aprobar gasto extraordinario",
          "description": "Revise el gasto propuesto y emita su decisión. El gasto solo procede si la junta lo aprueba.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobado — proceder con el gasto"
                },
                {
                  "value": "reject",
                  "label": "Rechazado — no procede"
                }
              ]
            },
            {
              "id": "comments",
              "label": "Observaciones de la junta",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "check_decision",
        "stepName": "Evaluar decisión",
        "stepType": "AUTOMATED",
        "description": "Verifica el resultado de la votación",
        "config": {
          "activity": "evaluate_condition",
          "condition": "context.decision === 'approve'"
        }
      },
      {
        "stepId": "end_approved",
        "stepName": "Aprobado",
        "stepType": "END",
        "description": "Gasto aprobado por la junta — queda registrado en contabilidad"
      },
      {
        "stepId": "end_rejected",
        "stepName": "Rechazado",
        "stepType": "END",
        "description": "Gasto rechazado por la junta — no procede"
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "junta_vota"
      },
      {
        "from": "junta_vota",
        "to": "check_decision"
      },
      {
        "from": "check_decision",
        "to": "end_approved",
        "condition": "approved"
      },
      {
        "from": "check_decision",
        "to": "end_rejected",
        "condition": "rejected"
      }
    ]
  }
}

/** Aprobación de Change Order (RFI) */
export const changeOrderApproval: WorkflowDefinitionJson = {
  "workflowId": "change_order_approval_v1",
  "workflowName": "Aprobación de Change Order (RFI)",
  "description": "Flujo de aprobación formal para RFIs que implican cambio de alcance en construcción. Un change order modifica el contrato original: puede afectar el monto, el cronograma o ambos. Debe aprobarse formalmente antes de incluirse en la siguiente valuación.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Construcción",
    "icon": "hard-hat",
    "entityType": "ConstRfi",
    "tags": [
      "construccion",
      "change-order",
      "rfi",
      "aprobacion"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Inicio",
        "stepType": "START",
        "description": "RFI identificado como change order — inicia flujo de aprobación formal"
      },
      {
        "stepId": "revision_tecnica",
        "stepName": "Revisión Técnica",
        "stepType": "USER_TASK",
        "description": "El residente de obra o gerente técnico evalúa el impacto técnico del change order",
        "config": {
          "taskName": "Revisar impacto técnico del change order",
          "description": "Evalúe si el cambio es técnicamente necesario y justificado. Incluya el impacto estimado en costo y cronograma.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión técnica",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobación técnica — procede"
                },
                {
                  "value": "needs_revision",
                  "label": "Requiere revisión adicional"
                },
                {
                  "value": "reject",
                  "label": "Rechazado — no procede técnicamente"
                }
              ]
            },
            {
              "id": "technical_comments",
              "label": "Justificación técnica",
              "type": "textarea",
              "required": true
            },
            {
              "id": "cost_impact_confirmed",
              "label": "Impacto en costo confirmado (USD)",
              "type": "text",
              "required": false
            },
            {
              "id": "schedule_impact_days",
              "label": "Impacto en cronograma (días)",
              "type": "number",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "aprobacion_direccion",
        "stepName": "Aprobación de Dirección",
        "stepType": "USER_TASK",
        "description": "El director de obra o gerente de proyecto aprueba formalmente el change order",
        "config": {
          "taskName": "Aprobar change order — Dirección de obra",
          "description": "La revisión técnica fue aprobada. Emita la aprobación formal de la dirección para proceder.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobado — incluir en próxima valuación"
                },
                {
                  "value": "reject",
                  "label": "Rechazado — no procede"
                }
              ]
            },
            {
              "id": "comments",
              "label": "Observaciones de dirección",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "end_approved",
        "stepName": "Change Order Aprobado",
        "stepType": "END",
        "description": "Change order aprobado — puede incluirse en la siguiente valuación"
      },
      {
        "stepId": "end_revision",
        "stepName": "En Revisión",
        "stepType": "END",
        "description": "Requiere revisión adicional por el equipo técnico"
      },
      {
        "stepId": "end_rejected",
        "stepName": "Rechazado",
        "stepType": "END",
        "description": "Change order rechazado — no procede"
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "revision_tecnica"
      },
      {
        "from": "revision_tecnica",
        "to": "aprobacion_direccion",
        "condition": "decision === 'approve'"
      },
      {
        "from": "revision_tecnica",
        "to": "end_revision",
        "condition": "decision === 'needs_revision'"
      },
      {
        "from": "revision_tecnica",
        "to": "end_rejected",
        "condition": "decision === 'reject'"
      },
      {
        "from": "aprobacion_direccion",
        "to": "end_approved",
        "condition": "decision === 'approve'"
      },
      {
        "from": "aprobacion_direccion",
        "to": "end_rejected",
        "condition": "decision === 'reject'"
      }
    ]
  }
}

/** Aprobación de Límite de Crédito */
export const limiteCreditoApproval: WorkflowDefinitionJson = {
  "workflowId": "limite_credito_v1",
  "workflowName": "Aprobación de Límite de Crédito",
  "description": "Flujo de aprobación para aumentos o modificaciones del límite de crédito de distribuidores. El agente de ventas solicita el cambio con justificación; gerencia financiera evalúa el historial y aprueba, condiciona o rechaza.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Distribución",
    "icon": "credit-card",
    "entityType": "DistCreditLimit",
    "tags": [
      "distribucion",
      "credito",
      "limite",
      "aprobacion"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Inicio",
        "stepType": "START",
        "description": "Agente solicita cambio de límite de crédito para el distribuidor"
      },
      {
        "stepId": "revision_gerencia",
        "stepName": "Revisión de Gerencia Financiera",
        "stepType": "USER_TASK",
        "description": "El gerente financiero o de crédito evalúa el historial del distribuidor y decide",
        "config": {
          "taskName": "Aprobar cambio de límite de crédito",
          "description": "Revise el historial de pagos, saldo actual y la solicitud del agente. Determine si el nuevo límite es prudente.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobado — aplicar nuevo límite"
                },
                {
                  "value": "approve_conditional",
                  "label": "Aprobado con condiciones"
                },
                {
                  "value": "reject",
                  "label": "Rechazado — mantener límite actual"
                }
              ]
            },
            {
              "id": "approved_limit",
              "label": "Límite aprobado (USD)",
              "type": "text",
              "required": false
            },
            {
              "id": "conditions",
              "label": "Condiciones o restricciones",
              "type": "textarea",
              "required": false
            },
            {
              "id": "reason",
              "label": "Justificación de la decisión",
              "type": "textarea",
              "required": true
            }
          ]
        }
      },
      {
        "stepId": "end_approved",
        "stepName": "Aprobado",
        "stepType": "END",
        "description": "Nuevo límite de crédito aprobado — aplicar en el sistema"
      },
      {
        "stepId": "end_conditional",
        "stepName": "Aprobado con condiciones",
        "stepType": "END",
        "description": "Límite aprobado con condiciones específicas"
      },
      {
        "stepId": "end_rejected",
        "stepName": "Rechazado",
        "stepType": "END",
        "description": "Solicitud rechazada — mantener límite actual"
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "revision_gerencia"
      },
      {
        "from": "revision_gerencia",
        "to": "end_approved",
        "condition": "decision === 'approve'"
      },
      {
        "from": "revision_gerencia",
        "to": "end_conditional",
        "condition": "decision === 'approve_conditional'"
      },
      {
        "from": "revision_gerencia",
        "to": "end_rejected",
        "condition": "decision === 'reject'"
      }
    ]
  }
}

/** Aprobación de Inscripción Escolar */
export const inscripcionEscolar: WorkflowDefinitionJson = {
  "workflowId": "inscripcion_escolar_v1",
  "workflowName": "Aprobación de Inscripción Escolar",
  "description": "Flujo de admisión para instituciones que requieren revisión formal del comité antes de confirmar la inscripción de un estudiante. El comité de admisiones revisa documentos, evalúa cupos y emite la decisión.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Educación",
    "icon": "graduation-cap",
    "entityType": "EnrollmentApplication",
    "tags": [
      "educacion",
      "inscripcion",
      "admisiones",
      "aprobacion"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Inicio",
        "stepType": "START",
        "description": "Solicitud de inscripción recibida — inicia revisión del comité de admisiones"
      },
      {
        "stepId": "revision_admisiones",
        "stepName": "Revisión del Comité de Admisiones",
        "stepType": "USER_TASK",
        "description": "El comité de admisiones revisa los documentos del estudiante y evalúa disponibilidad de cupo",
        "config": {
          "taskName": "Decidir solicitud de inscripción",
          "description": "Revise los documentos presentados, el grado al que aplica y la disponibilidad de cupos. Emita la decisión del comité.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobado — confirmar inscripción"
                },
                {
                  "value": "waitlist",
                  "label": "Lista de espera — no hay cupo disponible"
                },
                {
                  "value": "reject",
                  "label": "Rechazado — no cumple requisitos"
                }
              ]
            },
            {
              "id": "documents_complete",
              "label": "¿Documentación completa?",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "yes",
                  "label": "Sí, completa"
                },
                {
                  "value": "pending",
                  "label": "Pendiente — solicitada al representante"
                }
              ]
            },
            {
              "id": "comments",
              "label": "Observaciones del comité",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "end_approved",
        "stepName": "Inscripción Aprobada",
        "stepType": "END",
        "description": "Inscripción aprobada — proceder con el proceso de matrícula"
      },
      {
        "stepId": "end_waitlist",
        "stepName": "Lista de Espera",
        "stepType": "END",
        "description": "En lista de espera — se notificará si se libera un cupo"
      },
      {
        "stepId": "end_rejected",
        "stepName": "Rechazada",
        "stepType": "END",
        "description": "Inscripción rechazada — no cumple requisitos de admisión"
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "revision_admisiones"
      },
      {
        "from": "revision_admisiones",
        "to": "end_approved",
        "condition": "decision === 'approve'"
      },
      {
        "from": "revision_admisiones",
        "to": "end_waitlist",
        "condition": "decision === 'waitlist'"
      },
      {
        "from": "revision_admisiones",
        "to": "end_rejected",
        "condition": "decision === 'reject'"
      }
    ]
  }
}

/** Aprobación de Cambio de BOM */
export const bomApprovalV1: WorkflowDefinitionJson = {
  "workflowId": "bom_approval_v1",
  "workflowName": "Aprobación de Cambio de BOM",
  "description": "Flujo de aprobación para cambios en el Bill of Materials. El ingeniero de proceso propone la nueva versión con los cambios y su justificación; el gerente de ingeniería o director técnico revisa, evalúa el impacto en costos y calidad, y aprueba o rechaza la activación. Sin aprobación, la nueva versión no puede usarse en órdenes de producción.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Manufactura",
    "icon": "layers",
    "entityType": "MfgBomHeader",
    "tags": [
      "bom",
      "ingenieria",
      "cambio",
      "aprobacion",
      "manufactura"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Cambio Propuesto",
        "stepType": "START",
        "description": "Ingeniero de proceso completó la nueva versión del BOM con los cambios y está solicitando aprobación para activarla."
      },
      {
        "stepId": "revision_ingenieria",
        "stepName": "Revisión de Ingeniería",
        "stepType": "USER_TASK",
        "description": "El gerente de ingeniería o director técnico revisa el cambio propuesto, evalúa el impacto en proceso, calidad y costos",
        "config": {
          "taskName": "Revisar y aprobar cambio de BOM",
          "description": "Revisar: qué componentes cambiaron, por qué, impacto en el rendimiento del proceso, impacto en calidad del producto, impacto en costo de producción. Verificar que los materiales alternativos propuestos estén calificados.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobado — activar nueva versión"
                },
                {
                  "value": "approve_conditional",
                  "label": "Aprobado con condiciones"
                },
                {
                  "value": "reject",
                  "label": "Rechazado — mantener versión actual"
                }
              ]
            },
            {
              "id": "quality_impact_ok",
              "label": "¿Impacto en calidad evaluado?",
              "type": "checkbox",
              "required": true
            },
            {
              "id": "cost_impact",
              "label": "Impacto en costo estimado",
              "type": "text",
              "required": false,
              "placeholder": "+5% / -3% / Sin impacto significativo"
            },
            {
              "id": "conditions",
              "label": "Condiciones o restricciones (si aplica)",
              "type": "textarea",
              "required": false
            },
            {
              "id": "rejection_reason",
              "label": "Motivo del rechazo (si aplica)",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "end_approved",
        "stepName": "Aprobado",
        "stepType": "END",
        "description": "BOM aprobado — activar nueva versión y archivar la anterior."
      },
      {
        "stepId": "end_conditional",
        "stepName": "Aprobado con Condiciones",
        "stepType": "END",
        "description": "BOM aprobado con condiciones específicas documentadas."
      },
      {
        "stepId": "end_rejected",
        "stepName": "Rechazado",
        "stepType": "END",
        "description": "Cambio rechazado — la versión anterior continúa activa."
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "revision_ingenieria"
      },
      {
        "from": "revision_ingenieria",
        "to": "end_approved",
        "condition": "decision === 'approve'"
      },
      {
        "from": "revision_ingenieria",
        "to": "end_conditional",
        "condition": "decision === 'approve_conditional'"
      },
      {
        "from": "revision_ingenieria",
        "to": "end_rejected",
        "condition": "decision === 'reject'"
      }
    ]
  }
}

/** Escalación de Paro Prolongado */
export const downtimeEscalationV1: WorkflowDefinitionJson = {
  "workflowId": "downtime_escalation_v1",
  "workflowName": "Escalación de Paro Prolongado",
  "description": "Flujo que se activa cuando un paro de producción supera las 2 horas sin resolución. El supervisor de turno documenta el paro y escala al gerente de mantenimiento (si es falla mecánica) o al gerente de planta (si es corte eléctrico o falta de material). El objetivo es formalizar la escalación y garantizar que la gerencia esté informada antes de que el paro afecte la entrega de pedidos confirmados.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Producción",
    "icon": "alert-octagon",
    "entityType": "MfgProductionDowntime",
    "tags": [
      "paro",
      "produccion",
      "escalacion",
      "mantenimiento",
      "manufactura"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Paro Escalado",
        "stepType": "START",
        "description": "El supervisor de turno ha reportado un paro > 2 horas sin resolución y solicita intervención de la gerencia."
      },
      {
        "stepId": "atencion_gerencia",
        "stepName": "Atención de Gerencia",
        "stepType": "USER_TASK",
        "description": "El gerente de mantenimiento o gerente de planta revisa el paro, asigna recursos y documenta el plan de acción para reanudar producción.",
        "config": {
          "taskName": "Intervenir y resolver paro prolongado",
          "description": "Revisar: causa raíz del paro, recursos disponibles para resolverlo, impacto en órdenes de producción con fecha comprometida, y si aplica: activar generador, llamar técnico especialista, buscar repuesto de emergencia.",
          "formFields": [
            {
              "id": "intervention_type",
              "label": "Tipo de intervención",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "technical_repair",
                  "label": "Reparación técnica en curso"
                },
                {
                  "value": "generator",
                  "label": "Activando generador / alternativa energética"
                },
                {
                  "value": "spare_part_ordered",
                  "label": "Repuesto solicitado — en espera"
                },
                {
                  "value": "resolved",
                  "label": "Resuelto — producción reiniciada"
                },
                {
                  "value": "production_rerouted",
                  "label": "Producción redirigida a otra línea"
                }
              ]
            },
            {
              "id": "estimated_resolution_hrs",
              "label": "Tiempo estimado para resolver (horas)",
              "type": "number",
              "required": true
            },
            {
              "id": "action_plan",
              "label": "Plan de acción detallado",
              "type": "textarea",
              "required": true
            },
            {
              "id": "orders_at_risk",
              "label": "Órdenes de producción en riesgo de incumplir fecha",
              "type": "textarea",
              "required": false
            },
            {
              "id": "customer_notification_needed",
              "label": "¿Notificar a clientes con pedidos afectados?",
              "type": "checkbox",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "seguimiento",
        "stepName": "Seguimiento Resolución",
        "stepType": "USER_TASK",
        "description": "Confirmar que el paro fue resuelto y la producción se reinició. Documentar tiempo total y causa raíz definitiva.",
        "config": {
          "taskName": "Confirmar resolución del paro",
          "description": "Confirmar: ¿se reinició la producción? ¿Se actualizó el registro de downtime con la duración real? ¿Se documentó la causa raíz para el análisis de modos de falla?",
          "formFields": [
            {
              "id": "resolution",
              "label": "Estado final",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "resolved_fully",
                  "label": "Resuelto completamente — producción normal"
                },
                {
                  "value": "resolved_partial",
                  "label": "Resuelto parcialmente — producción reducida"
                },
                {
                  "value": "escalated_external",
                  "label": "Escalado a servicio técnico externo"
                }
              ]
            },
            {
              "id": "root_cause_final",
              "label": "Causa raíz definitiva",
              "type": "textarea",
              "required": true
            },
            {
              "id": "preventive_action",
              "label": "Acción preventiva para evitar recurrencia",
              "type": "textarea",
              "required": false
            },
            {
              "id": "actual_duration_hrs",
              "label": "Duración total real del paro (horas)",
              "type": "number",
              "required": true
            }
          ]
        }
      },
      {
        "stepId": "end_resolved",
        "stepName": "Resuelto",
        "stepType": "END",
        "description": "Paro resuelto — producción reiniciada y causa raíz documentada."
      },
      {
        "stepId": "end_external",
        "stepName": "Escalado Externamente",
        "stepType": "END",
        "description": "Paro escalado a servicio técnico externo — seguimiento fuera del sistema."
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "atencion_gerencia"
      },
      {
        "from": "atencion_gerencia",
        "to": "seguimiento"
      },
      {
        "from": "seguimiento",
        "to": "end_resolved",
        "condition": "resolution === 'resolved_fully' || resolution === 'resolved_partial'"
      },
      {
        "from": "seguimiento",
        "to": "end_external",
        "condition": "resolution === 'escalated_external'"
      }
    ]
  }
}

/** Autorización de Orden de Compra de Importación */
export const purchaseAuthorizationV1: WorkflowDefinitionJson = {
  "workflowId": "purchase_authorization_v1",
  "workflowName": "Autorización de Orden de Compra de Importación",
  "description": "Flujo de aprobación para órdenes de compra de importación que superan el umbral de autorización. El comprador propone la OC con el cálculo CIF completo; el gerente general o director financiero revisa el monto total, los términos y el proveedor, y aprueba o rechaza. Sin aprobación, la OC no puede enviarse al proveedor extranjero.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Compras",
    "icon": "shopping-cart",
    "entityType": "MfgPurchaseOrder",
    "tags": [
      "compras",
      "importacion",
      "autorizacion",
      "manufactura",
      "divisas"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "OC Propuesta",
        "stepType": "START",
        "description": "Comprador completó la OC con cotización FOB, flete, seguro, aranceles y cálculo CIF total. Solicita autorización para comprometer divisas."
      },
      {
        "stepId": "revision_gerencia",
        "stepName": "Revisión Gerencia General",
        "stepType": "USER_TASK",
        "description": "El gerente general o director financiero revisa: proveedor, monto CIF total, incoterm, país de origen y disponibilidad de divisas para este compromiso.",
        "config": {
          "taskName": "Revisar y autorizar OC de importación",
          "description": "Verificar: ¿el proveedor está homologado? ¿El precio CIF es competitivo vs. cotizaciones anteriores? ¿Hay disponibilidad de divisas para comprometer este monto? ¿El incoterm y las condiciones de pago son aceptables?",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobado — emitir OC al proveedor"
                },
                {
                  "value": "approve_with_conditions",
                  "label": "Aprobado con condiciones"
                },
                {
                  "value": "reject",
                  "label": "Rechazado — no procede"
                }
              ]
            },
            {
              "id": "forex_available",
              "label": "¿Divisas disponibles para este compromiso?",
              "type": "checkbox",
              "required": true
            },
            {
              "id": "conditions",
              "label": "Condiciones o instrucciones al comprador (si aplica)",
              "type": "textarea",
              "required": false
            },
            {
              "id": "rejection_reason",
              "label": "Motivo del rechazo (si aplica)",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "end_approved",
        "stepName": "Aprobada",
        "stepType": "END",
        "description": "OC autorizada — el comprador puede enviarla al proveedor e iniciar el proceso de divisas."
      },
      {
        "stepId": "end_conditional",
        "stepName": "Aprobada con Condiciones",
        "stepType": "END",
        "description": "OC aprobada con condiciones específicas documentadas."
      },
      {
        "stepId": "end_rejected",
        "stepName": "Rechazada",
        "stepType": "END",
        "description": "OC rechazada — requiere revisión del comprador antes de resubmitir."
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "revision_gerencia"
      },
      {
        "from": "revision_gerencia",
        "to": "end_approved",
        "condition": "decision === 'approve'"
      },
      {
        "from": "revision_gerencia",
        "to": "end_conditional",
        "condition": "decision === 'approve_with_conditions'"
      },
      {
        "from": "revision_gerencia",
        "to": "end_rejected",
        "condition": "decision === 'reject'"
      }
    ]
  }
}

/** Disposición de No-Conformidad */
export const ncDispositionV1: WorkflowDefinitionJson = {
  "workflowId": "nc_disposition_v1",
  "workflowName": "Disposición de No-Conformidad",
  "description": "Flujo formal para investigar la causa raíz y decidir la disposición del material de una No-Conformidad de manufactura. El especialista de calidad documenta la investigación y propone disposición; el gerente de calidad o director técnico revisa y aprueba. Para NC críticas (riesgo de inocuidad), la aprobación es requerida por ley (BPF, HACCP).",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Calidad",
    "icon": "x-octagon",
    "entityType": "MfgNonconformance",
    "tags": [
      "calidad",
      "no-conformidad",
      "disposicion",
      "manufactura",
      "haccp"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "NC Abierta",
        "stepType": "START",
        "description": "No-Conformidad registrada. Especialista de calidad asignado para investigar."
      },
      {
        "stepId": "root_cause_investigation",
        "stepName": "Investigación de Causa Raíz",
        "stepType": "USER_TASK",
        "description": "El especialista de calidad investiga la causa raíz y determina el alcance del material afectado",
        "config": {
          "taskName": "Investigar causa raíz y proponer disposición",
          "description": "Documentar: ¿qué ocurrió exactamente? ¿Por qué? ¿Cuánto material está afectado? ¿Cuál es el riesgo? Proponer disposición del material.",
          "formFields": [
            {
              "id": "root_cause",
              "label": "Causa raíz identificada",
              "type": "textarea",
              "required": true,
              "placeholder": "Descripción detallada de la causa raíz..."
            },
            {
              "id": "proposed_disposition",
              "label": "Disposición propuesta",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "rework",
                  "label": "Retrabajo / Reproceso"
                },
                {
                  "value": "scrap",
                  "label": "Destrucción (baja)"
                },
                {
                  "value": "use_as_is",
                  "label": "Uso condicionado con desviación documentada"
                },
                {
                  "value": "return_to_supplier",
                  "label": "Devolución al proveedor"
                },
                {
                  "value": "downgrade",
                  "label": "Reclasificación a calidad inferior"
                }
              ]
            },
            {
              "id": "corrective_action",
              "label": "Acción correctiva propuesta",
              "type": "textarea",
              "required": true
            },
            {
              "id": "preventive_action",
              "label": "Acción preventiva propuesta",
              "type": "textarea",
              "required": false
            },
            {
              "id": "cost_estimate_usd",
              "label": "Costo estimado de la NC (USD)",
              "type": "number",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "disposition_approval",
        "stepName": "Aprobación de Disposición",
        "stepType": "USER_TASK",
        "description": "El gerente o director de calidad revisa la investigación y aprueba o rechaza la disposición propuesta",
        "config": {
          "taskName": "Revisar y aprobar disposición del material",
          "description": "Revisar la causa raíz documentada, la disposición propuesta y las acciones correctivas. Para NC críticas (inocuidad, BPF), verificar que la disposición cumple los requisitos regulatorios venezolanos.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Aprobado — ejecutar disposición propuesta"
                },
                {
                  "value": "approve_modified",
                  "label": "Aprobado con modificaciones"
                },
                {
                  "value": "reject",
                  "label": "Rechazado — requiere investigación adicional"
                }
              ]
            },
            {
              "id": "approval_notes",
              "label": "Observaciones del gerente de calidad",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "end_approved",
        "stepName": "Disposición Aprobada",
        "stepType": "END",
        "description": "Disposición aprobada — ejecutar acción sobre el material y cerrar NC."
      },
      {
        "stepId": "end_rejected",
        "stepName": "Devuelta a Investigación",
        "stepType": "END",
        "description": "Investigación insuficiente — NC devuelta para investigación adicional."
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "root_cause_investigation"
      },
      {
        "from": "root_cause_investigation",
        "to": "disposition_approval"
      },
      {
        "from": "disposition_approval",
        "to": "end_approved",
        "condition": "decision === 'approve' || decision === 'approve_modified'"
      },
      {
        "from": "disposition_approval",
        "to": "end_rejected",
        "condition": "decision === 'reject'"
      }
    ]
  }
}

/** Autorización de Devolución Fuera de Política */
export const devolucionFueraPolitica: WorkflowDefinitionJson = {
  "workflowId": "devolucion_fuera_politica_v1",
  "workflowName": "Autorización de Devolución Fuera de Política",
  "description": "Flujo de autorización para devoluciones que no cumplen la política estándar de la tienda (plazo vencido, sin recibo, condición inaceptable). El agente escala al gerente, quien evalúa el caso y decide si autoriza la devolución, ofrece solo cambio, o rechaza.",
  "version": 1,
  "enabled": true,
  "metadata": {
    "category": "Retail",
    "icon": "package-x",
    "entityType": "RetailReturn",
    "tags": [
      "retail",
      "devolucion",
      "politica",
      "autorizacion"
    ]
  },
  "definition": {
    "steps": [
      {
        "stepId": "start",
        "stepName": "Inicio",
        "stepType": "START",
        "description": "Agente escala devolución fuera de política al gerente"
      },
      {
        "stepId": "autorizacion_gerente",
        "stepName": "Autorización del Gerente",
        "stepType": "USER_TASK",
        "description": "El gerente de tienda evalúa el caso y decide si la excepción es válida",
        "config": {
          "taskName": "Autorizar devolución fuera de política",
          "description": "El agente está solicitando autorización para procesar una devolución que no cumple la política estándar. Evalúe el caso y emita su decisión.",
          "formFields": [
            {
              "id": "decision",
              "label": "Decisión",
              "type": "select",
              "required": true,
              "options": [
                {
                  "value": "approve",
                  "label": "Autorizar devolución completa"
                },
                {
                  "value": "approve_exchange",
                  "label": "Solo cambio — no reembolso"
                },
                {
                  "value": "reject",
                  "label": "Rechazar — no procede"
                }
              ]
            },
            {
              "id": "reason",
              "label": "Justificación de la excepción",
              "type": "textarea",
              "required": true
            },
            {
              "id": "customer_satisfaction",
              "label": "Acción de satisfacción al cliente",
              "type": "textarea",
              "required": false
            }
          ]
        }
      },
      {
        "stepId": "end_approved",
        "stepName": "Devolución Autorizada",
        "stepType": "END",
        "description": "Devolución completa autorizada — proceder con el reembolso"
      },
      {
        "stepId": "end_exchange",
        "stepName": "Solo Cambio Autorizado",
        "stepType": "END",
        "description": "Solo se autoriza cambio por otro producto — no reembolso"
      },
      {
        "stepId": "end_rejected",
        "stepName": "Rechazada",
        "stepType": "END",
        "description": "Devolución rechazada — no aplica excepción"
      }
    ],
    "transitions": [
      {
        "from": "start",
        "to": "autorizacion_gerente"
      },
      {
        "from": "autorizacion_gerente",
        "to": "end_approved",
        "condition": "decision === 'approve'"
      },
      {
        "from": "autorizacion_gerente",
        "to": "end_exchange",
        "condition": "decision === 'approve_exchange'"
      },
      {
        "from": "autorizacion_gerente",
        "to": "end_rejected",
        "condition": "decision === 'reject'"
      }
    ]
  }
}
