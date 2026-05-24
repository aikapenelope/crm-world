/**
 * Reporte de Turno — PDF Document
 * OEE total vs. interno, producción real vs. plan, paros por categoría.
 */
// @ts-ignore
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import * as React from 'react'
import {
  COLORS, FONTS, FONT_SIZES, SPACING, PAGE,
  type OrgBranding, fmtDate, docId,
} from '../../../lib/pdf/design'
import {
  baseStyles, DocHeader, Section, DetailRow, DocFooter, SignatureBlock,
} from '../../../lib/pdf/components'

export type ReporteTurnoData = {
  org: OrgBranding
  report_number: string
  shift_date: string
  shift_type: string
  work_center_name: string | null
  workers_count: number
  planned_production: number
  actual_production: number
  production_uom: string | null
  total_downtime_hrs: number
  electrical_downtime_hrs: number
  internal_downtime_hrs: number
  oee_total_pct: number
  oee_internal_pct: number
  observations: string | null
  supervisor_name: string | null
  id: string
}

const SHIFT_LABEL: Record<string, string> = { morning: 'Mañana', afternoon: 'Tarde', night: 'Noche' }

const s = StyleSheet.create({
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING[3] },
  kpiCard: { flex: 1, padding: 10, borderRadius: 4, borderWidth: 0.5, alignItems: 'center' },
  kpiLabel: { fontSize: FONT_SIZES.xs, color: COLORS.neutral, marginBottom: 2, textAlign: 'center' },
  kpiValue: { fontSize: FONT_SIZES['2xl'], fontFamily: FONTS.bold, textAlign: 'center' },
  kpiSub: { fontSize: FONT_SIZES.xs, textAlign: 'center', marginTop: 2 },
  bar: { height: 8, borderRadius: 4, marginTop: 3 },
})

function OeeCard({ label, value, benchmark }: { label: string; value: number; benchmark: number }) {
  const color = value >= benchmark ? COLORS.success : value >= benchmark * 0.76 ? COLORS.warning : COLORS.danger
  const bgColor = value >= benchmark ? '#F0FDF4' : value >= benchmark * 0.76 ? '#FFFBEB' : '#FEF2F2'
  const pct = Math.min(value / 100, 1)
  return (
    <View style={[s.kpiCard, { borderColor: color, backgroundColor: bgColor }]}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, { color }]}>{value.toFixed(1)}%</Text>
      <Text style={[s.kpiSub, { color: COLORS.neutral }]}>
        {value >= 85 ? 'World-class ✓' : value >= 65 ? 'Aceptable' : 'Requiere atención'}
      </Text>
      <View style={{ width: '100%', height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginTop: 4 }}>
        <View style={[s.bar, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  )
}

export function ReporteTurnoPdf({ data: d }: { data: ReporteTurnoData }) {
  const productionPct = d.planned_production > 0 ? (d.actual_production / d.planned_production * 100).toFixed(1) : '—'
  const electricalPctOfTotal = d.total_downtime_hrs > 0 ? (d.electrical_downtime_hrs / d.total_downtime_hrs * 100).toFixed(0) : '0'

  return (
    <Document title={`Reporte Turno ${d.report_number}`} author={d.org.name}>
      <Page size="A4" style={baseStyles.page}>
        <DocHeader
          org={d.org}
          title="Reporte de Turno"
          subtitle={`${SHIFT_LABEL[d.shift_type] ?? d.shift_type} | ${fmtDate(d.shift_date)} | ${d.work_center_name ?? 'Planta General'}`}
          docId={docId('RT', d.id)}
        />

        <View style={{ paddingHorizontal: PAGE.padding, paddingTop: SPACING[3] }}>
          {/* Datos del turno */}
          <Section title="Datos del Turno">
            <View style={{ flexDirection: 'row', gap: SPACING[3] }}>
              <View style={{ flex: 1 }}>
                <DetailRow label="Reporte N°" value={d.report_number} />
                <DetailRow label="Turno" value={SHIFT_LABEL[d.shift_type] ?? d.shift_type} />
                <DetailRow label="Línea / Centro" value={d.work_center_name ?? 'General'} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Operarios en turno" value={String(d.workers_count)} />
                <DetailRow label="Supervisor" value={d.supervisor_name ?? '—'} />
              </View>
            </View>
          </Section>

          {/* OEE */}
          <Section title="OEE — Eficiencia Global del Equipo">
            <View style={s.kpiRow}>
              <OeeCard label="OEE Total" value={d.oee_total_pct} benchmark={85} />
              <OeeCard label="OEE Interno (sin CORPOELEC)" value={d.oee_internal_pct} benchmark={85} />
            </View>
            <View style={{ padding: SPACING[2], backgroundColor: '#EFF6FF', borderRadius: 3, borderLeftWidth: 3, borderLeftColor: COLORS.primaryLight }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.primaryLight }}>
                OEE Total incluye paros por CORPOELEC. OEE Interno excluye fuerza mayor — mide eficiencia real del equipo y del equipo de producción.
              </Text>
            </View>
          </Section>

          {/* Producción */}
          <Section title="Producción del Turno">
            <View style={s.kpiRow}>
              <View style={[s.kpiCard, { borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 }]}>
                <Text style={s.kpiLabel}>Producción planificada</Text>
                <Text style={[s.kpiValue, { color: COLORS.primary }]}>{d.planned_production.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
                <Text style={[s.kpiSub, { color: COLORS.neutral }]}>{d.production_uom ?? 'unidades'}</Text>
              </View>
              <View style={[s.kpiCard, { borderColor: Number(productionPct) >= 90 ? COLORS.success : COLORS.warning, backgroundColor: Number(productionPct) >= 90 ? '#F0FDF4' : '#FFFBEB' }]}>
                <Text style={s.kpiLabel}>Producción real</Text>
                <Text style={[s.kpiValue, { color: Number(productionPct) >= 90 ? COLORS.success : COLORS.warning }]}>{d.actual_production.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
                <Text style={[s.kpiSub, { color: COLORS.neutral }]}>{productionPct}% del plan</Text>
              </View>
            </View>
          </Section>

          {/* Paros */}
          <Section title="Registro de Paros">
            <View style={{ flexDirection: 'row', gap: SPACING[3] }}>
              <View style={{ flex: 1 }}>
                <DetailRow label="Paros totales" value={`${d.total_downtime_hrs.toFixed(2)} horas`} />
                <DetailRow label="Paros internos (controlables)" value={`${d.internal_downtime_hrs.toFixed(2)} horas`} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Paros CORPOELEC (fuerza mayor)" value={`${d.electrical_downtime_hrs.toFixed(2)} horas`} />
                <DetailRow label="CORPOELEC % del total" value={`${electricalPctOfTotal}%`} />
              </View>
            </View>
          </Section>

          {/* Observaciones */}
          {d.observations && (
            <Section title="Observaciones del Supervisor">
              <View style={{ padding: SPACING[2], backgroundColor: COLORS.gray50, borderRadius: 3 }}>
                <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, lineHeight: 1.5 }}>{d.observations}</Text>
              </View>
            </Section>
          )}

          <SignatureBlock lines={[
            { label: 'Supervisor de Turno', name: d.supervisor_name ?? '' },
            { label: 'Gerente de Producción', name: '' },
          ]} />
        </View>

        <DocFooter org={d.org} pageLabel="Reporte de Turno" />
      </Page>
    </Document>
  )
}
