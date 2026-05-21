/**
 * Recibo de Condominio — PDF Document
 * Professional receipt for condominium fee payments.
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
  DetailRow, DocFooter, AmountHighlight,
} from '../../../lib/pdf/components'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReciboPDFData = {
  org: OrgBranding
  buildingName: string

  // Receipt
  receiptNumber: string
  periodMonth: string
  issueDate: string | null

  // Unit / owner
  unitNumber: string
  ownerName: string
  aliquotPercent: string

  // Amounts
  amountUsd: string
  amountVes: string | null
  exchangeRate: string | null
  lateFeeAmount: string
  totalAmount: string
  paidAmount: string
  currency: string

  // Status
  status: string
  dueDate: string | null
  paidAt: string | null
  paymentMethod: string | null
  paymentReference: string | null

  // Meta
  id: string
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: '✓ PAGADO', color: COLORS.success },
  partial: { label: '◑ PAGO PARCIAL', color: COLORS.warning },
  pending: { label: '○ PENDIENTE', color: COLORS.warning },
  overdue: { label: '⚠ VENCIDO', color: COLORS.danger },
  cancelled: { label: '✕ CANCELADO', color: COLORS.neutral },
}

const METHOD_LABELS: Record<string, string> = {
  transfer: 'Transferencia bancaria',
  cash_usd: 'Efectivo USD',
  cash_ves: 'Efectivo VES',
  zelle: 'Zelle',
  binance: 'Binance / USDT',
  mobile_payment: 'Pago móvil',
  card: 'Tarjeta débito/crédito',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  buildingTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  buildingTagText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  amountLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
  },
  amountValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontFamily: FONTS.body,
    textAlign: 'right',
  },
  vesBadge: {
    backgroundColor: COLORS.gray100,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: SPACING.sm,
  },
  vesBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
  },
  watermark: {
    position: 'absolute',
    top: '45%',
    left: '20%',
    fontSize: 72,
    fontFamily: FONTS.bold,
    color: 'rgba(5, 150, 105, 0.06)',
    transform: 'rotate(-30deg)',
    letterSpacing: 8,
    textTransform: 'uppercase',
    zIndex: -1,
  },
})

// ─── Document ─────────────────────────────────────────────────────────────────

export function ReciboCondo({ data }: { data: ReciboPDFData }) {
  const statusCfg = STATUS_CONFIG[data.status] ?? { label: data.status.toUpperCase(), color: COLORS.neutral }
  const remaining = Math.max(0, parseFloat(data.totalAmount) - parseFloat(data.paidAmount))
  const isPaid = data.status === 'paid'
  const hasLateFee = parseFloat(data.lateFeeAmount) > 0

  return (
    <Document
      title={`Recibo ${data.receiptNumber}`}
      author={data.org.name}
      subject={`Cuota de Condominio — ${data.periodMonth}`}
      creator="Aika Platform"
    >
      <Page size={PAGE.size} style={[baseStyles.page, { paddingBottom: 0 }]}>
        {/* Watermark for paid receipts */}
        {isPaid && (
          <Text style={styles.watermark}>PAGADO</Text>
        )}

        {/* ── Header ─────────────────────────────────────────────── */}
        <DocHeader
          org={data.org}
          docTitle="Recibo de Condominio"
          docNumber={data.receiptNumber}
        />

        {/* Building sub-tag */}
        <View style={[baseStyles.header, { paddingTop: 0, paddingBottom: 12, marginTop: -1 }]}>
          <View style={styles.buildingTag}>
            <Text style={styles.buildingTagText}>🏢 {data.buildingName}</Text>
          </View>
        </View>

        {/* Status banner */}
        <StatusBanner label={statusCfg.label} color={statusCfg.color} />

        {/* ── Content ────────────────────────────────────────────── */}
        <View style={baseStyles.content}>

          {/* Período */}
          <View style={{ flexDirection: 'row', gap: SPACING.xl, marginBottom: SPACING.lg }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Período de la cuota
              </Text>
              <Text style={{ fontSize: FONT_SIZES['2xl'], fontFamily: FONTS.bold, color: COLORS.primary, marginTop: 2 }}>
                {data.periodMonth}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Fecha de vencimiento
              </Text>
              <Text style={{ fontSize: FONT_SIZES.lg, fontFamily: FONTS.bold, color: data.status === 'overdue' ? COLORS.danger : COLORS.text, marginTop: 2 }}>
                {fmtDate(data.dueDate)}
              </Text>
            </View>
          </View>

          {/* Propietario / Unidad */}
          <Section title="Datos del Propietario">
            <DetailRow label="Propietario" value={data.ownerName} bold />
            <DetailRow label="Unidad" value={data.unitNumber} />
            <DetailRow label="Alícuota" value={`${parseFloat(data.aliquotPercent).toFixed(5)}%`} />
          </Section>

          {/* Detalle del monto */}
          <Section title="Detalle del Cargo">
            <View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Cuota base</Text>
                <Text style={styles.amountValue}>{fmtAmount(data.amountUsd, data.currency)}</Text>
              </View>
              {hasLateFee && (
                <View style={styles.amountRow}>
                  <Text style={[styles.amountLabel, { color: COLORS.danger }]}>Recargo por mora</Text>
                  <Text style={[styles.amountValue, { color: COLORS.danger }]}>
                    {fmtAmount(data.lateFeeAmount, data.currency)}
                  </Text>
                </View>
              )}
              <View style={[styles.amountRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.amountLabel, { fontFamily: FONTS.bold, color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.3 }]}>
                  Total
                </Text>
                <Text style={[styles.amountValue, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.lg }]}>
                  {fmtAmount(data.totalAmount, data.currency)}
                </Text>
              </View>
            </View>

            {/* VES equivalent */}
            {data.amountVes && data.exchangeRate && (
              <View style={styles.vesBadge}>
                <Text style={styles.vesBadgeText}>
                  Equivalente en Bolívares: VES {parseFloat(data.amountVes).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  {'  ·  '}Tasa BCV: {data.exchangeRate}
                </Text>
              </View>
            )}
          </Section>

          {/* Payment info (if paid or partial) */}
          {(isPaid || data.status === 'partial') && (
            <Section title={isPaid ? 'Pago Registrado' : 'Pago Parcial'}>
              <DetailRow label="Monto pagado" value={fmtAmount(data.paidAmount, data.currency)} bold />
              {remaining > 0 && (
                <DetailRow label="Saldo pendiente" value={fmtAmount(remaining, data.currency)} />
              )}
              <DetailRow label="Fecha de pago" value={fmtDate(data.paidAt)} />
              {data.paymentMethod && (
                <DetailRow label="Método" value={METHOD_LABELS[data.paymentMethod] ?? data.paymentMethod} />
              )}
              {data.paymentReference && (
                <DetailRow label="Referencia" value={data.paymentReference} />
              )}
            </Section>
          )}

          {/* Total highlight */}
          <AmountHighlight
            label={isPaid ? 'Total Cancelado' : remaining > 0 ? 'Monto Pendiente' : 'Total a Pagar'}
            amount={fmtAmount(isPaid ? data.totalAmount : remaining > 0 ? remaining : data.totalAmount, data.currency)}
            color={isPaid ? COLORS.success : remaining > 0 ? COLORS.danger : COLORS.warning}
          />
        </View>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <DocFooter
          docCode={docId(data.id)}
          generatedAt={fmtDate(new Date())}
          note="Este recibo es válido como comprobante de pago de cuotas de condominio."
        />
      </Page>
    </Document>
  )
}
