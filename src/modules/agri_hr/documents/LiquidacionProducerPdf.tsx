/**
 * Liquidación del Productor Integrado — PDF Document
 * Resumen del ciclo completo con KPIs y desglose del pago al productor.
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

export type LiquidacionProducerData = {
  org: OrgBranding
  settlement_number: string
  flock_number: string
  producer_name: string
  farm_name: string | null
  cycle_start_date: string
  cycle_end_date: string
  initial_birds: number
  final_birds: number
  actual_mortality_pct: number
  actual_fca: number
  target_fca: number
  actual_avg_weight_kg: number
  target_weight_kg: number
  price_per_kg_usd: number
  base_payment_usd: number
  fca_bonus_usd: number
  weight_bonus_usd: number
  fca_penalty_usd: number
  total_payment_usd: number
  status: string
  payment_date: string | null
  notes: string | null
  id: string
}

const s = StyleSheet.create({
  kpiGrid: { flexDirection: 'row', gap: 6, marginBottom: (SPACING as any)[3] },
  kpiCard: { flex: 1, padding: (SPACING as any)[3], borderRadius: 4, borderWidth: 0.5 },
  kpiLabel: { fontSize: FONT_SIZES.xs, color: COLORS.neutral, marginBottom: 2 },
  kpiValue: { fontSize: FONT_SIZES.lg, fontFamily: FONTS.bold },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: COLORS.gray200 },
  payLabel: { fontSize: FONT_SIZES.sm, color: COLORS.text },
  payValue: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 6, backgroundColor: COLORS.primary, borderRadius: 3, marginTop: 4 },
  totalLabel: { fontSize: FONT_SIZES.base, fontFamily: FONTS.bold, color: COLORS.white },
  totalValue: { fontSize: FONT_SIZES.xl, fontFamily: FONTS.bold, color: COLORS.white },
})

const STATUS_COLORS: Record<string, string> = {
  calculated: COLORS.warning,
  approved: COLORS.primaryLight,
  paid: COLORS.success,
}
const STATUS_LABELS: Record<string, string> = {
  calculated: 'CALCULADA',
  approved: 'APROBADA',
  paid: 'PAGADA',
}

export function LiquidacionProducerPdf({ data: d }: { data: LiquidacionProducerData }) {
  const fcaGood    = d.actual_fca <= d.target_fca
  const weightGood = d.actual_avg_weight_kg >= d.target_weight_kg
  const viability  = d.initial_birds > 0 ? ((d.final_birds / d.initial_birds) * 100).toFixed(2) : '—'

  return (
    <Document title={`Liquidación ${d.settlement_number}`} author={d.org.name}>
      <Page size="A4" style={baseStyles.page}>
        <DocHeader org={d.org} docTitle="Liquidación del Productor Integrado" docNumber={`Ciclo ${d.flock_number} | ${fmtDate(d.cycle_start_date)} → ${fmtDate(d.cycle_end_date)}`} />

        <StatusBanner
          label={STATUS_LABELS[d.status] ?? d.status.toUpperCase()}
          color={STATUS_COLORS[d.status] ?? COLORS.neutral}
        />

        <View style={{ paddingHorizontal: PAGE.padding, paddingTop: (SPACING as any)[3] }}>
          {/* Identificación */}
          <Section title="Datos del Productor y Ciclo">
            <View style={{ flexDirection: 'row', gap: (SPACING as any)[3] }}>
              <View style={{ flex: 1 }}>
                <DetailRow label="Productor" value={d.producer_name} />
                <DetailRow label="Granja" value={d.farm_name ?? '—'} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Lote" value={d.flock_number} />
                <DetailRow label="Liquidación N°" value={d.settlement_number} />
              </View>
            </View>
          </Section>

          {/* KPIs del ciclo */}
          <Section title="Resultados del Ciclo">
            <View style={s.kpiGrid}>
              <View style={[s.kpiCard, { borderColor: fcaGood ? COLORS.success : COLORS.danger, backgroundColor: fcaGood ? '#F0FDF4' : '#FEF2F2' }]}>
                <Text style={s.kpiLabel}>FCA Real</Text>
                <Text style={[s.kpiValue, { color: fcaGood ? COLORS.success : COLORS.danger }]}>{d.actual_fca.toFixed(3)}</Text>
                <Text style={[s.kpiLabel, { marginTop: 2 }]}>Objetivo: {d.target_fca.toFixed(3)}</Text>
              </View>
              <View style={[s.kpiCard, { borderColor: weightGood ? COLORS.success : COLORS.warning, backgroundColor: weightGood ? '#F0FDF4' : '#FFFBEB' }]}>
                <Text style={s.kpiLabel}>Peso Promedio</Text>
                <Text style={[s.kpiValue, { color: weightGood ? COLORS.success : COLORS.warning }]}>{d.actual_avg_weight_kg.toFixed(3)} kg</Text>
                <Text style={[s.kpiLabel, { marginTop: 2 }]}>Objetivo: {d.target_weight_kg.toFixed(3)} kg</Text>
              </View>
              <View style={[s.kpiCard, { borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 }]}>
                <Text style={s.kpiLabel}>Viabilidad</Text>
                <Text style={[s.kpiValue, { color: COLORS.primary }]}>{viability}%</Text>
                <Text style={[s.kpiLabel, { marginTop: 2 }]}>Mort.: {d.actual_mortality_pct.toFixed(2)}%</Text>
              </View>
              <View style={[s.kpiCard, { borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 }]}>
                <Text style={s.kpiLabel}>Aves Finales</Text>
                <Text style={[s.kpiValue, { color: COLORS.primary }]}>{d.final_birds.toLocaleString('es-VE')}</Text>
                <Text style={[s.kpiLabel, { marginTop: 2 }]}>Iniciaron: {d.initial_birds.toLocaleString('es-VE')}</Text>
              </View>
            </View>
          </Section>

          {/* Desglose del pago */}
          <Section title="Desglose del Pago">
            <View style={s.payRow}>
              <Text style={s.payLabel}>Precio base</Text>
              <Text style={s.payValue}>USD {d.price_per_kg_usd.toFixed(4)}/kg</Text>
            </View>
            <View style={s.payRow}>
              <Text style={s.payLabel}>Pago base ({d.final_birds.toLocaleString('es-VE')} aves)</Text>
              <Text style={s.payValue}>USD {d.base_payment_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
            </View>
            {d.fca_bonus_usd > 0 && (
              <View style={s.payRow}>
                <Text style={s.payLabel}>+ Bonus FCA (cumplimiento objetivo)</Text>
                <Text style={[s.payValue, { color: COLORS.success }]}>+ USD {d.fca_bonus_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
              </View>
            )}
            {d.weight_bonus_usd > 0 && (
              <View style={s.payRow}>
                <Text style={s.payLabel}>+ Bonus Peso (sobre objetivo)</Text>
                <Text style={[s.payValue, { color: COLORS.success }]}>+ USD {d.weight_bonus_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
              </View>
            )}
            {d.fca_penalty_usd > 0 && (
              <View style={s.payRow}>
                <Text style={s.payLabel}>− Penalización FCA</Text>
                <Text style={[s.payValue, { color: COLORS.danger }]}>− USD {d.fca_penalty_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL A PAGAR</Text>
              <Text style={s.totalValue}>USD {d.total_payment_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
            </View>
            {d.payment_date && (
              <View style={{ marginTop: (SPACING as any)[2] }}>
                <DetailRow label="Fecha de pago" value={fmtDate(d.payment_date)} />
              </View>
            )}
            {d.notes && (
              <View style={{ marginTop: (SPACING as any)[2], padding: (SPACING as any)[2], backgroundColor: COLORS.gray50, borderRadius: 3 }}>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.neutral }}>{d.notes}</Text>
              </View>
            )}
          </Section>

          <>{[
            { label: 'Técnico de Campo', name: '' },
            { label: 'Gerente de Producción', name: '' },
            { label: 'Productor Integrado', name: d.producer_name },
          ].map((s: any, i: number) => <SignatureBlock key={i} label={s.label} name={s.name} />)}</>
        </View>

        <DocFooter generatedAt={new Date().toLocaleDateString('es-VE')} />
      </Page>
    </Document>
  )
}
