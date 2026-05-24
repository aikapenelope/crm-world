/**
 * Orden de Trabajo de Mantenimiento — PDF Document
 * Instructivo para técnicos con repuestos requeridos y procedimiento.
 */
// @ts-ignore
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import * as React from 'react'
import {
  COLORS, FONTS, FONT_SIZES, SPACING, PAGE,
  type OrgBranding, fmtDate, docId,
} from '../../../lib/pdf/design'
import {
  baseStyles, DocHeader, StatusBanner, Section, DetailRow, DocFooter, SignatureBlock,
} from '../../../lib/pdf/components'

export type SparePart = {
  part_code: string
  part_name: string
  quantity: number
}

export type WorkOrderMaintPdfData = {
  org: OrgBranding
  wo_number: string
  equipment_code: string
  equipment_name: string
  work_type: string
  priority: string
  status: string
  description: string
  fault_description: string | null
  scheduled_date: string | null
  estimated_duration_hrs: number | null
  assigned_to_name: string | null
  spare_parts: SparePart[]
  work_performed: string | null
  actual_duration_hrs: number | null
  total_parts_cost_usd: number
  id: string
}

const WORK_TYPE: Record<string, string> = { preventive: 'Preventivo', corrective: 'Correctivo', predictive: 'Predictivo' }
const PRIORITY_COLOR: Record<string, string> = { critical: COLORS.danger, high: COLORS.warning, medium: COLORS.primaryLight, low: COLORS.neutral }
const PRIORITY_LABEL: Record<string, string> = { critical: 'CRÍTICA', high: 'ALTA', medium: 'MEDIA', low: 'BAJA' }

const s = StyleSheet.create({
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', borderWidth: 1 },
  spareRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: COLORS.gray200 },
  spareCode: { width: 80, fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold },
  spareName: { flex: 1, fontSize: FONT_SIZES.sm },
  spareQty: { width: 50, fontSize: FONT_SIZES.sm, textAlign: 'right' },
  checklist: { flexDirection: 'row', gap: 8, paddingVertical: 3 },
  checkbox: { width: 12, height: 12, borderWidth: 1, borderColor: COLORS.gray400, borderRadius: 2 },
  checkLabel: { fontSize: FONT_SIZES.sm, flex: 1 },
  stepBox: { padding: (SPACING as any)[3], backgroundColor: COLORS.gray50, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: COLORS.primaryLight, marginBottom: (SPACING as any)[2] },
})

export function WorkOrderMaintPdf({ data: d }: { data: WorkOrderMaintPdfData }) {
  const pColor = PRIORITY_COLOR[d.priority] ?? COLORS.neutral

  return (
    <Document title={`WO ${d.wo_number}`} author={d.org.name}>
      <Page size="A4" style={baseStyles.page}>
        <DocHeader
          org={d.org}
          docTitle={`Orden de Trabajo — ${WORK_TYPE[d.work_type] ?? d.work_type}`}
          docNumber={`WO ${d.wo_number} | ${d.equipment_code} — ${d.equipment_name}`}
        />

        <View style={{ paddingHorizontal: PAGE.padding, paddingTop: (SPACING as any)[3] }}>
          {/* Header info */}
          <Section title="Datos de la Orden">
            <View style={{ flexDirection: 'row', gap: (SPACING as any)[3], alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <DetailRow label="WO N°" value={d.wo_number} />
                <DetailRow label="Equipo" value={`${d.equipment_code} — ${d.equipment_name}`} />
                <DetailRow label="Tipo" value={WORK_TYPE[d.work_type] ?? d.work_type} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Fecha programada" value={d.scheduled_date ? fmtDate(d.scheduled_date) : '—'} />
                <DetailRow label="Duración estimada" value={d.estimated_duration_hrs ? `${d.estimated_duration_hrs}h` : '—'} />
                <DetailRow label="Técnico asignado" value={d.assigned_to_name ?? '—'} />
              </View>
              <View style={{ alignItems: 'center', paddingTop: 4 }}>
                <View style={[s.priorityBadge, { borderColor: pColor, backgroundColor: pColor + '1A' }]}>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold, color: pColor }}>
                    {PRIORITY_LABEL[d.priority] ?? d.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </Section>

          {/* Descripción del trabajo */}
          <Section title="Descripción del Trabajo a Realizar">
            <View style={s.stepBox}>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, lineHeight: 1.5 }}>{d.description}</Text>
            </View>
            {d.fault_description && (
              <View>
                <Text style={{ fontSize: FONT_SIZES.xs, fontFamily: FONTS.bold, color: COLORS.danger, marginBottom: 4 }}>Falla reportada:</Text>
                <View style={[s.stepBox, { borderLeftColor: COLORS.danger }]}>
                  <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, lineHeight: 1.5 }}>{d.fault_description}</Text>
                </View>
              </View>
            )}
          </Section>

          {/* Repuestos requeridos */}
          {d.spare_parts.length > 0 && (
            <Section title="Repuestos / Materiales Requeridos">
              <View style={{ borderWidth: 0.5, borderColor: COLORS.gray200, borderRadius: 3 }}>
                <View style={{ flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, backgroundColor: COLORS.primaryFade }}>
                  <Text style={[s.spareCode, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Código</Text>
                  <Text style={[s.spareName, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Descripción</Text>
                  <Text style={[s.spareQty, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Cant.</Text>
                  <View style={{ width: 16 }} />
                </View>
                {d.spare_parts.map((sp, i) => (
                  <View key={i} style={s.spareRow}>
                    <Text style={s.spareCode}>{sp.part_code}</Text>
                    <Text style={s.spareName}>{sp.part_name}</Text>
                    <Text style={s.spareQty}>{sp.quantity}</Text>
                    <View style={{ width: 12, height: 12, borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 2, alignSelf: 'center' }} />
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* Resultado (si completada) */}
          {(d.work_performed || d.actual_duration_hrs) && (
            <Section title="Trabajo Realizado (completar al cerrar)">
              {d.actual_duration_hrs && <DetailRow label="Duración real" value={`${d.actual_duration_hrs}h`} />}
              {d.total_parts_cost_usd > 0 && <DetailRow label="Costo de repuestos" value={`USD ${d.total_parts_cost_usd.toFixed(2)}`} />}
              {d.work_performed && (
                <View style={[s.stepBox, { marginTop: (SPACING as any)[2] }]}>
                  <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, lineHeight: 1.5 }}>{d.work_performed}</Text>
                </View>
              )}
            </Section>
          )}

          {/* Checklist de cierre */}
          <Section title="Checklist de Cierre (marcar al completar)">
            {[
              'Equipo revisado y en condiciones seguras de operación',
              'Repuestos utilizados registrados en el sistema',
              'Área de trabajo limpia y ordenada',
              'Equipo reiniciado y funcionando normalmente',
              'Duración real registrada en el sistema',
            ].map((item, i) => (
              <View key={i} style={s.checklist}>
                <View style={s.checkbox} />
                <Text style={s.checkLabel}>{item}</Text>
              </View>
            ))}
          </Section>

          <SignatureBlock lines={[
            { label: 'Técnico Ejecutor', name: d.assigned_to_name ?? '' },
            { label: 'Supervisor de Mantenimiento', name: '' },
            { label: 'Operador del Equipo (verificación)', name: '' },
          ]} />
        </View>

        <DocFooter generatedAt={new Date().toLocaleDateString(\'es-VE\')} />
      </Page>
    </Document>
  )
}
