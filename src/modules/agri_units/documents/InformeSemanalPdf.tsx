/**
 * Informe Semanal del Lote de Producción Avícola
 * Documento para el director de producción y el técnico de campo.
 * Incluye KPIs de la semana: FCA, IEP, mortalidad, peso y proyecciones.
 */
// @ts-ignore
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import * as React from 'react'
import {
  COLORS, FONTS, FONT_SIZES, SPACING, PAGE,
  type OrgBranding, fmtDate, docId,
} from '../../../lib/pdf/design'
import {
  baseStyles, DocHeader, Section, DetailRow, DocFooter,
} from '../../../lib/pdf/components'

export type WeeklyRecord = {
  week_number: number
  record_date: string
  live_count: number
  weekly_mortality: number
  avg_body_weight_g: number
  cumulative_feed_kg: number
  fca: number | null
  iep: number | null
}

export type InformeSemanalData = {
  org: OrgBranding
  flock_number: string
  species: string
  genetic_line: string | null
  farm_name: string | null
  start_date: string
  days_in_cycle: number
  initial_count: number
  current_week: number
  records: WeeklyRecord[]
  latest_fca: number | null
  latest_iep: number | null
  viability_pct: number | null
  mortality_threshold_pct: number
  planned_end_date: string | null
  report_date: string
  id: string
}

const s = StyleSheet.create({
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  kpiCard: { flex: 1, backgroundColor: COLORS.gray50, borderRadius: 4, padding: 8, alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.gray200 },
  kpiLabel: { fontSize: FONT_SIZES.xs, color: COLORS.neutral, marginBottom: 2 },
  kpiValue: { fontSize: FONT_SIZES.xl, fontFamily: FONTS.bold, color: COLORS.primary },
  kpiSub: { fontSize: FONT_SIZES.xs, color: COLORS.neutral },
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.primaryFade, paddingVertical: 4, paddingHorizontal: 6, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  tableRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: COLORS.gray200 },
  tableRowAlt: { backgroundColor: COLORS.gray50 },
  col1: { flex: 1, fontSize: FONT_SIZES.sm },
  col2: { flex: 2, fontSize: FONT_SIZES.sm, textAlign: 'right' },
  alert: { backgroundColor: '#FEF3C7', borderRadius: 4, padding: 8, marginTop: 8, flexDirection: 'row', gap: 6 },
  alertText: { fontSize: FONT_SIZES.sm, color: '#92400E', flex: 1 },
})

function KpiCard({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <View style={[s.kpiCard, alert ? { backgroundColor: '#FEF2F2', borderColor: COLORS.danger } : {}]}>
      <Text style={s.kpiLabel}>{label}</Text>
      <Text style={[s.kpiValue, alert ? { color: COLORS.danger } : {}]}>{value}</Text>
      {sub && <Text style={s.kpiSub}>{sub}</Text>}
    </View>
  )
}

export function InformeSemanalPdf({ data: d }: { data: InformeSemanalData }) {
  const latestRecord = d.records[d.records.length - 1]
  const fcaStatus = d.latest_fca && d.latest_fca > 2.2 ? 'alert' : d.latest_fca && d.latest_fca > 2.0 ? 'warn' : 'ok'
  const iepStatus = d.latest_iep && d.latest_iep < 250 ? 'alert' : 'ok'

  return (
    <Document title={`Informe Semanal — ${d.flock_number}`} author={d.org.name}>
      <Page size="A4" style={baseStyles.page}>
        <DocHeader org={d.org} docTitle="Informe Semanal del Lote" docNumber={`Semana ${d.current_week} | ${fmtDate(d.report_date)}`} />

        {/* Identificación del lote */}
        <View style={{ paddingHorizontal: PAGE.padding, paddingTop: (SPACING as any)[4] }}>
          <Section title="Identificación del Lote">
            <View style={{ flexDirection: 'row', gap: (SPACING as any)[3] }}>
              <View style={{ flex: 1 }}>
                <DetailRow label="Lote" value={d.flock_number} />
                <DetailRow label="Especie" value={d.species} />
                <DetailRow label="Línea genética" value={d.genetic_line ?? '—'} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Granja" value={d.farm_name ?? '—'} />
                <DetailRow label="Inicio del ciclo" value={fmtDate(d.start_date)} />
                <DetailRow label="Días en ciclo" value={`${d.days_in_cycle} días`} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Aves iniciales" value={d.initial_count.toLocaleString('es-VE')} />
                <DetailRow label="Aves actuales" value={latestRecord ? latestRecord.live_count.toLocaleString('es-VE') : '—'} />
                <DetailRow label="Viabilidad" value={d.viability_pct != null ? `${d.viability_pct.toFixed(2)}%` : '—'} />
              </View>
            </View>
          </Section>

          {/* KPIs de la semana */}
          <Section title={`KPIs — Semana ${d.current_week}`}>
            <View style={s.kpiRow}>
              <KpiCard label="FCA" value={d.latest_fca?.toFixed(3) ?? '—'} sub="objetivo < 2.0" alert={fcaStatus === 'alert'} />
              <KpiCard label="IEP" value={d.latest_iep?.toFixed(1) ?? '—'} sub="objetivo > 300" alert={iepStatus === 'alert'} />
              <KpiCard label="Peso promedio" value={latestRecord ? `${(latestRecord.avg_body_weight_g / 1000).toFixed(3)} kg` : '—'} sub={`g: ${latestRecord?.avg_body_weight_g.toFixed(0) ?? '—'}`} />
              <KpiCard label="Mortalidad semanal" value={latestRecord ? latestRecord.weekly_mortality.toLocaleString('es-VE') : '—'} sub={`umbral: ${d.mortality_threshold_pct}%`} alert={latestRecord ? (latestRecord.weekly_mortality / d.initial_count) * 100 > d.mortality_threshold_pct : false} />
            </View>
          </Section>

          {/* Tabla de registros semanales */}
          <Section title="Historial de Registros Semanales">
            <View style={s.tableHeader}>
              <Text style={[s.col1, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Semana</Text>
              <Text style={[s.col2, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Aves vivas</Text>
              <Text style={[s.col2, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Mort.</Text>
              <Text style={[s.col2, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Peso prom (g)</Text>
              <Text style={[s.col2, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Alim acum (kg)</Text>
              <Text style={[s.col2, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>FCA</Text>
              <Text style={[s.col2, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>IEP</Text>
            </View>
            {d.records.map((r, i) => (
              <View key={r.week_number} style={[s.tableRow, i % 2 === 0 ? {} : s.tableRowAlt]}>
                <Text style={s.col1}>S{r.week_number}</Text>
                <Text style={s.col2}>{r.live_count.toLocaleString('es-VE')}</Text>
                <Text style={s.col2}>{r.weekly_mortality}</Text>
                <Text style={s.col2}>{r.avg_body_weight_g.toFixed(0)}</Text>
                <Text style={s.col2}>{r.cumulative_feed_kg.toFixed(1)}</Text>
                <Text style={[s.col2, r.fca && r.fca > 2.2 ? { color: COLORS.danger } : {}]}>{r.fca?.toFixed(3) ?? '—'}</Text>
                <Text style={[s.col2, r.iep && r.iep < 250 ? { color: COLORS.danger } : {}]}>{r.iep?.toFixed(1) ?? '—'}</Text>
              </View>
            ))}
          </Section>

          {/* Proyección */}
          {d.planned_end_date && (
            <Section title="Proyección al Cierre del Ciclo">
              <DetailRow label="Fecha planificada de cosecha" value={fmtDate(d.planned_end_date)} />
              <DetailRow label="Días restantes" value={`${Math.max(0, Math.ceil((new Date(d.planned_end_date).getTime() - Date.now()) / 86400000))} días`} />
            </Section>
          )}
        </View>

        <DocFooter generatedAt={new Date().toLocaleDateString('es-VE')} />
      </Page>
    </Document>
  )
}
