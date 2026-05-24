/**
 * Valuación de Obra — PDF Document
 * Professional construction progress billing document (valuación parcial).
 */
// @ts-ignore
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import * as React from 'react'
import {
  COLORS, FONTS, FONT_SIZES, SPACING, PAGE,
  type OrgBranding, fmtDate, fmtAmount, docId,
} from '../../../lib/pdf/design'
import {
  baseStyles, DocHeader, StatusBanner, Section,
  DetailRow, DocFooter, AmountHighlight, SignatureBlock,
} from '../../../lib/pdf/components'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ValuacionPDFData = {
  org: OrgBranding

  // Project
  projectName: string
  projectCode: string
  clientName: string

  // Valuation
  valuationNumber: string
  periodFrom: string
  periodTo: string
  status: string
  invoiceNumber: string | null
  approvedBy: string | null
  approvedAt: string | null
  submittedAt: string | null
  notes: string | null
  currency: string

  // Financials
  totalContract: string
  previousBilled: string
  currentPeriod: string
  retentionAmount: string
  advanceDeduction: string
  netPayable: string
  exchangeRate: string | null
  amountVes: string | null

  // Lines
  lines: {
    item_number: string
    item_name: string
    unit: string | null
    contracted_quantity: string
    unit_price: string
    current_quantity: string
    current_amount: string
    accumulated_percent: string
  }[]

  id: string
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: '○ BORRADOR', color: COLORS.neutral },
  submitted: { label: '↑ ENVIADA PARA APROBACIÓN', color: COLORS.warning },
  approved: { label: '✓ APROBADA', color: COLORS.success },
  invoiced: { label: '◆ FACTURADA', color: COLORS.primaryLight },
  paid: { label: '✓ PAGADA', color: COLORS.success },
  rejected: { label: '✕ RECHAZADA', color: COLORS.danger },
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  financialTable: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  financialLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    flex: 1,
  },
  financialValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.text,
    textAlign: 'right',
    minWidth: 100,
  },
  financialRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primary,
    borderTopWidth: 0,
  },
  financialTotalLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  financialTotalValue: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textAlign: 'right',
  },
  linesTableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  linesRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  linesRowAlt: {
    backgroundColor: COLORS.gray50,
  },
  linesCellHeader: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  linesCell: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
    color: COLORS.text,
  },
  linesCellRight: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
    color: COLORS.text,
    textAlign: 'right',
  },
  deductionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: COLORS.primaryFade,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  deductionLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.primaryLight,
    flex: 1,
  },
  deductionValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.danger,
    textAlign: 'right',
    minWidth: 100,
  },
})

// ─── Document ─────────────────────────────────────────────────────────────────

export function ValuacionObra({ data }: { data: ValuacionPDFData }) {
  const statusCfg = STATUS_CONFIG[data.status] ?? { label: data.status.toUpperCase(), color: COLORS.neutral }
  const billedPercent = parseFloat(data.totalContract) > 0
    ? ((parseFloat(data.previousBilled) + parseFloat(data.currentPeriod)) / parseFloat(data.totalContract) * 100).toFixed(1)
    : '0.0'

  return (
    <Document
      title={`Valuación ${data.valuationNumber}`}
      author={data.org.name}
      subject={`Valuación de Obra — ${data.projectName}`}
      creator="Aika Platform"
    >
      <Page size={PAGE.size} style={baseStyles.page}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <DocHeader
          org={data.org}
          docTitle="Valuación de Obra"
          docNumber={data.valuationNumber}
          accentColor="#1a3a2a"  // Dark green for construction
        />

        {/* Status banner */}
        <StatusBanner label={statusCfg.label} color={statusCfg.color} />

        {/* ── Content ────────────────────────────────────────────── */}
        <View style={baseStyles.content}>

          {/* Project + period info */}
          <View style={{ flexDirection: 'row', gap: SPACING.xl, marginBottom: SPACING.lg }}>
            <View style={{ flex: 1.5 }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Proyecto
              </Text>
              <Text style={{ fontSize: FONT_SIZES['2xl'], fontFamily: FONTS.bold, color: '#1a3a2a', marginTop: 2 }}>
                {data.projectName}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 1 }}>
                {data.projectCode}  ·  Cliente: {data.clientName}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Período de valuación
              </Text>
              <Text style={{ fontSize: FONT_SIZES.md, fontFamily: FONTS.bold, color: COLORS.text, marginTop: 2 }}>
                {fmtDate(data.periodFrom)} → {fmtDate(data.periodTo)}
              </Text>
              {data.invoiceNumber && (
                <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 2 }}>
                  Factura: {data.invoiceNumber}
                </Text>
              )}
            </View>
          </View>

          {/* Financial breakdown */}
          <Section title="Resumen Financiero">
            <View style={styles.financialTable}>
              {/* Contract + billed */}
              <View style={[styles.financialRow, { borderTopWidth: 0 }]}>
                <Text style={styles.financialLabel}>Monto total del contrato</Text>
                <Text style={styles.financialValue}>{fmtAmount(data.totalContract, data.currency)}</Text>
              </View>
              <View style={styles.financialRow}>
                <Text style={styles.financialLabel}>Facturado en períodos anteriores</Text>
                <Text style={styles.financialValue}>{fmtAmount(data.previousBilled, data.currency)}</Text>
              </View>
              <View style={[styles.financialRow, { backgroundColor: COLORS.primaryFade }]}>
                <Text style={[styles.financialLabel, { fontFamily: FONTS.bold, color: COLORS.primaryLight }]}>
                  Período actual ({billedPercent}% acum.)
                </Text>
                <Text style={[styles.financialValue, { fontFamily: FONTS.bold, color: COLORS.primaryLight }]}>
                  {fmtAmount(data.currentPeriod, data.currency)}
                </Text>
              </View>

              {/* Deductions */}
              {parseFloat(data.retentionAmount) > 0 && (
                <View style={styles.deductionRow}>
                  <Text style={styles.deductionLabel}>(-) Retención de garantía</Text>
                  <Text style={styles.deductionValue}>({fmtAmount(data.retentionAmount, data.currency)})</Text>
                </View>
              )}
              {parseFloat(data.advanceDeduction) > 0 && (
                <View style={styles.deductionRow}>
                  <Text style={styles.deductionLabel}>(-) Deducción de anticipo</Text>
                  <Text style={styles.deductionValue}>({fmtAmount(data.advanceDeduction, data.currency)})</Text>
                </View>
              )}

              {/* Net payable total */}
              <View style={styles.financialRowTotal}>
                <Text style={styles.financialTotalLabel}>Neto a pagar</Text>
                <Text style={styles.financialTotalValue}>{fmtAmount(data.netPayable, data.currency)}</Text>
              </View>
            </View>

            {/* VES equivalent */}
            {data.amountVes && data.exchangeRate && (
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted, marginTop: 4 }}>
                Equivalente: VES {parseFloat(data.amountVes).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                {'  ·  '}Tasa: {data.exchangeRate}
              </Text>
            )}
          </Section>

          {/* Valuation lines (if any) */}
          {data.lines.length > 0 && (
            <Section title={`Partidas Valuadas (${data.lines.length})`}>
              <View style={{ borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 4, overflow: 'hidden' }}>
                {/* Table header */}
                <View style={styles.linesTableHeader}>
                  <Text style={[styles.linesCellHeader, { width: '6%' }]}>#</Text>
                  <Text style={[styles.linesCellHeader, { flex: 1 }]}>Partida</Text>
                  <Text style={[styles.linesCellHeader, { width: '10%', textAlign: 'center' }]}>Und.</Text>
                  <Text style={[styles.linesCellHeader, { width: '12%', textAlign: 'right' }]}>Cantidad</Text>
                  <Text style={[styles.linesCellHeader, { width: '16%', textAlign: 'right' }]}>P. Unit.</Text>
                  <Text style={[styles.linesCellHeader, { width: '16%', textAlign: 'right' }]}>Monto</Text>
                  <Text style={[styles.linesCellHeader, { width: '10%', textAlign: 'right' }]}>Acum.</Text>
                </View>
                {/* Lines */}
                {data.lines.map((line, idx) => (
                  <View key={idx} style={[styles.linesRow, idx % 2 === 1 ? styles.linesRowAlt : {}]}>
                    <Text style={[styles.linesCell, { width: '6%', color: COLORS.textMuted }]}>
                      {line.item_number}
                    </Text>
                    <Text style={[styles.linesCell, { flex: 1 }]}>
                      {line.item_name}
                    </Text>
                    <Text style={[styles.linesCellRight, { width: '10%' }]}>
                      {line.unit ?? '—'}
                    </Text>
                    <Text style={[styles.linesCellRight, { width: '12%' }]}>
                      {parseFloat(line.current_quantity).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={[styles.linesCellRight, { width: '16%' }]}>
                      {parseFloat(line.unit_price).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={[styles.linesCellRight, { width: '16%', fontFamily: FONTS.bold }]}>
                      {fmtAmount(line.current_amount, data.currency)}
                    </Text>
                    <Text style={[styles.linesCellRight, { width: '10%', color: COLORS.primaryLight }]}>
                      {parseFloat(line.accumulated_percent).toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {/* Notes */}
          {data.notes && (
            <Section title="Observaciones">
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.text, lineHeight: 1.5 }}>
                {data.notes}
              </Text>
            </Section>
          )}

          {/* Signatures */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xl }}>
            <SignatureBlock label="Director de Obra" name={data.org.name} />
            <SignatureBlock
              label={data.approvedBy ? `Aprobado por: ${data.approvedBy}` : 'Aprobación'}
              name={data.approvedAt ? fmtDate(data.approvedAt) : undefined}
            />
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <DocFooter
          docCode={docId(data.id)}
          generatedAt={fmtDate(new Date())}
          note="Documento de valuación de obra — sujeto a revisión y aprobación por el comitente."
        />
      </Page>
    </Document>
  )
}
