/**
 * Guía de Despacho Sanitaria — PDF Document
 * Acompaña al lote de beneficio desde la planta al cliente.
 * Incluye resultados de inspección sanitaria y condiciones de transporte.
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

export type DespachoPdfData = {
  org: OrgBranding
  batch_number: string
  flock_number: string
  dispatch_date: string
  client_name: string | null
  client_rif: string | null
  carrier_name: string | null
  vehicle_plate: string | null
  driver_name: string | null
  birds_processed: number
  total_weight_kg: number
  yield_pct: number
  temperature_transport: string | null
  microbiological_result: string
  condemned_count: number
  notes: string | null
  approved_by: string | null
  id: string
}

const s = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: 8, marginBottom: (SPACING as any)[3] },
  statCard: { flex: 1, padding: 10, borderRadius: 4, backgroundColor: COLORS.gray50, borderWidth: 0.5, borderColor: COLORS.gray200, alignItems: 'center' },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.neutral, marginBottom: 2, textAlign: 'center' },
  statValue: { fontSize: FONT_SIZES.lg, fontFamily: FONTS.bold, color: COLORS.primary, textAlign: 'center' },
  qcBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
})

export function DespachoPdf({ data: d }: { data: DespachoPdfData }) {
  const microOk = d.microbiological_result === 'approved' || d.microbiological_result === 'aprobado'
  return (
    <Document title={`Guía Despacho ${d.batch_number}`} author={d.org.name}>
      <Page size="A4" style={baseStyles.page}>
        <DocHeader org={d.org} docTitle="Guía de Despacho Sanitaria" docNumber={`Lote de Beneficio ${d.batch_number} | ${fmtDate(d.dispatch_date)}`} />

        <StatusBanner label="APTO PARA DESPACHO" color={COLORS.success} />

        <View style={{ paddingHorizontal: PAGE.padding, paddingTop: (SPACING as any)[3] }}>
          {/* Origen */}
          <Section title="Identificación del Lote">
            <View style={{ flexDirection: 'row', gap: (SPACING as any)[3] }}>
              <View style={{ flex: 1 }}>
                <DetailRow label="Lote de beneficio" value={d.batch_number} />
                <DetailRow label="Lote de aves origen" value={d.flock_number} />
                <DetailRow label="Fecha de despacho" value={fmtDate(d.dispatch_date)} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Cliente / Destinatario" value={d.client_name ?? '—'} />
                <DetailRow label="RIF del cliente" value={d.client_rif ?? '—'} />
              </View>
            </View>
          </Section>

          {/* Estadísticas del lote */}
          <Section title="Estadísticas del Lote Procesado">
            <View style={s.statsGrid}>
              <View style={s.statCard}>
                <Text style={s.statLabel}>Aves procesadas</Text>
                <Text style={s.statValue}>{d.birds_processed.toLocaleString('es-VE')}</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statLabel}>Peso total</Text>
                <Text style={s.statValue}>{d.total_weight_kg.toLocaleString('es-VE', { minimumFractionDigits: 1 })} kg</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statLabel}>Rendimiento</Text>
                <Text style={s.statValue}>{d.yield_pct.toFixed(2)}%</Text>
              </View>
              <View style={[s.statCard, d.condemned_count > 0 ? { backgroundColor: '#FEF2F2', borderColor: COLORS.danger } : {}]}>
                <Text style={s.statLabel}>Decomisos</Text>
                <Text style={[s.statValue, d.condemned_count > 0 ? { color: COLORS.danger } : {}]}>{d.condemned_count}</Text>
              </View>
            </View>
          </Section>

          {/* Inspección sanitaria */}
          <Section title="Inspección Sanitaria">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: (SPACING as any)[3], marginBottom: (SPACING as any)[2] }}>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.neutral }}>Resultado microbiológico:</Text>
              <View style={[s.qcBadge, { backgroundColor: microOk ? '#DCFCE7' : '#FEF2F2' }]}>
                <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold, color: microOk ? COLORS.success : COLORS.danger }}>
                  {microOk ? '✓ APROBADO' : '✗ RECHAZADO'}
                </Text>
              </View>
            </View>
            {d.approved_by && <DetailRow label="Aprobado por (Médico Veterinario)" value={d.approved_by} />}
            {d.notes && (
              <View style={{ marginTop: (SPACING as any)[2], padding: (SPACING as any)[2], backgroundColor: COLORS.gray50, borderRadius: 3 }}>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.neutral }}>{d.notes}</Text>
              </View>
            )}
          </Section>

          {/* Transporte */}
          <Section title="Condiciones de Transporte">
            <View style={{ flexDirection: 'row', gap: (SPACING as any)[3] }}>
              <View style={{ flex: 1 }}>
                <DetailRow label="Transportista" value={d.carrier_name ?? '—'} />
                <DetailRow label="Placa del vehículo" value={d.vehicle_plate ?? '—'} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Conductor" value={d.driver_name ?? '—'} />
                <DetailRow label="Temperatura de transporte" value={d.temperature_transport ?? 'Ambiente controlado'} />
              </View>
            </View>
          </Section>

          <>{[
            { label: 'Inspector Sanitario', name: d.approved_by ?? '' },
            { label: 'Responsable de Despacho', name: '' },
            { label: 'Conductor / Transportista', name: d.driver_name ?? '' },
          ].map((s: any, i: number) => <SignatureBlock key={i} label={s.label} name={s.name} />)}</>
        </View>

        <DocFooter generatedAt={new Date().toLocaleDateString('es-VE')} />
      </Page>
    </Document>
  )
}
