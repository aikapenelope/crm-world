/**
 * Nota de Entrega / Remisión de Distribución — PDF Document
 * Professional delivery note for distribution orders.
 */
// @ts-ignore
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import * as React from 'react'
import {
  COLORS, FONTS, FONT_SIZES, SPACING, PAGE,
  type OrgBranding, fmtDate, docId,
} from '../../../lib/pdf/design'
import {
  baseStyles, DocHeader, StatusBanner, Section,
  DetailRow, DocFooter, SignatureBlock,
} from '../../../lib/pdf/components'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotaEntregaItem = {
  customer_name: string
  product_name: string
  product_sku: string | null
  quantity_dispatched: number
  unit: string | null
  status: string
  delivery_notes: string | null
}

export type NotaEntregaPDFData = {
  org: OrgBranding
  deliveryNumber: string
  dispatchDate: string
  status: string
  vehiclePlate: string | null
  driverName: string | null
  notes: string | null
  items: NotaEntregaItem[]
  totalItems: number
  deliveredItems: number
  id: string
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  preparing: { label: '⋯ PREPARANDO', color: COLORS.warning },
  dispatched: { label: '▶ DESPACHADO', color: COLORS.primaryLight },
  in_transit: { label: '↑ EN TRÁNSITO', color: COLORS.primaryLight },
  completed: { label: '✓ COMPLETADO', color: COLORS.success },
  partial: { label: '◑ PARCIAL', color: COLORS.warning },
}

const ITEM_STATUS: Record<string, string> = {
  pending: 'Pendiente',
  delivered: 'Entregado',
  partial: 'Parcial',
  returned: 'Devuelto',
  rejected: 'Rechazado',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  summaryBox: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: FONT_SIZES['3xl'],
    fontFamily: FONTS.bold,
    lineHeight: 1.2,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 2,
  },
})

// ─── Document ─────────────────────────────────────────────────────────────────

export function NotaEntregaDist({ data }: { data: NotaEntregaPDFData }) {
  const statusCfg = STATUS_CONFIG[data.status] ?? { label: data.status.toUpperCase(), color: COLORS.neutral }

  // Group items by customer
  const byCustomer = new Map<string, NotaEntregaItem[]>()
  for (const item of data.items) {
    const key = item.customer_name
    if (!byCustomer.has(key)) byCustomer.set(key, [])
    byCustomer.get(key)!.push(item)
  }

  return (
    <Document
      title={`Nota de Entrega ${data.deliveryNumber}`}
      author={data.org.name}
      subject="Nota de Entrega / Remisión"
      creator="Aika Platform"
    >
      <Page size={PAGE.size} style={baseStyles.page}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <DocHeader
          org={data.org}
          docTitle="Nota de Entrega / Remisión"
          docNumber={data.deliveryNumber}
          accentColor="#1a2f4a"
        />

        <StatusBanner label={statusCfg.label} color={statusCfg.color} />

        {/* ── Content ────────────────────────────────────────────── */}
        <View style={baseStyles.content}>

          {/* Summary cards */}
          <View style={styles.summaryBox}>
            <View style={[styles.summaryCard, { backgroundColor: COLORS.primaryFade }]}>
              <Text style={[styles.summaryNumber, { color: COLORS.primary }]}>{data.totalItems}</Text>
              <Text style={styles.summaryLabel}>Total ítems</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: '#ecfdf5' }]}>
              <Text style={[styles.summaryNumber, { color: COLORS.success }]}>{data.deliveredItems}</Text>
              <Text style={styles.summaryLabel}>Entregados</Text>
            </View>
            <View style={[styles.summaryCard, { backgroundColor: COLORS.gray50, flex: 2 }]}>
              <Text style={[styles.summaryNumber, { color: COLORS.text, fontSize: FONT_SIZES.xl }]}>
                {fmtDate(data.dispatchDate)}
              </Text>
              <Text style={styles.summaryLabel}>Fecha de despacho</Text>
            </View>
          </View>

          {/* Delivery details */}
          <Section title="Datos del Despacho">
            {data.vehiclePlate && <DetailRow label="Vehículo / Placa" value={data.vehiclePlate} />}
            {data.driverName && <DetailRow label="Conductor" value={data.driverName} />}
            {data.notes && <DetailRow label="Observaciones" value={data.notes} />}
          </Section>

          {/* Items grouped by customer */}
          {Array.from(byCustomer.entries()).map(([customerName, items], idx) => (
            <Section key={idx} title={`Cliente: ${customerName}`}>
              <View style={{ borderWidth: 0.5, borderColor: COLORS.border, borderRadius: 4, overflow: 'hidden' }}>
                {/* Table header */}
                <View style={{ flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 6, paddingHorizontal: 8 }}>
                  <Text style={{ flex: 1, fontSize: FONT_SIZES.xs, fontFamily: FONTS.bold, color: COLORS.white, textTransform: 'uppercase' }}>Producto</Text>
                  <Text style={{ width: 50, fontSize: FONT_SIZES.xs, fontFamily: FONTS.bold, color: COLORS.white, textAlign: 'center', textTransform: 'uppercase' }}>Cant.</Text>
                  <Text style={{ width: 40, fontSize: FONT_SIZES.xs, fontFamily: FONTS.bold, color: COLORS.white, textAlign: 'center', textTransform: 'uppercase' }}>Und.</Text>
                  <Text style={{ width: 70, fontSize: FONT_SIZES.xs, fontFamily: FONTS.bold, color: COLORS.white, textAlign: 'center', textTransform: 'uppercase' }}>Estado</Text>
                </View>

                {/* Item rows */}
                {items.map((item, i) => (
                  <View key={i} style={{
                    flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8,
                    borderTopWidth: 0.5, borderTopColor: COLORS.border,
                    backgroundColor: i % 2 === 1 ? COLORS.gray50 : COLORS.white,
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.body, color: COLORS.text }}>
                        {item.product_name}
                      </Text>
                      {item.product_sku && (
                        <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted }}>SKU: {item.product_sku}</Text>
                      )}
                    </View>
                    <Text style={{ width: 50, fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold, textAlign: 'center', color: COLORS.text }}>
                      {item.quantity_dispatched}
                    </Text>
                    <Text style={{ width: 40, fontSize: FONT_SIZES.sm, textAlign: 'center', color: COLORS.textMuted }}>
                      {item.unit ?? '—'}
                    </Text>
                    <Text style={{
                      width: 70, fontSize: FONT_SIZES.xs, textAlign: 'center', fontFamily: FONTS.bold,
                      color: item.status === 'delivered' ? COLORS.success : item.status === 'returned' ? COLORS.danger : COLORS.warning,
                    }}>
                      {ITEM_STATUS[item.status] ?? item.status}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          ))}

          {/* Signature blocks */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xl }}>
            <SignatureBlock label="Repartidor / Conductor" name={data.driverName ?? data.org.name} />
            <SignatureBlock label="Recibido conforme (cliente)" />
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <DocFooter
          docCode={docId(data.id)}
          generatedAt={fmtDate(new Date())}
          note="Nota de entrega — conserve este documento como comprobante de recepción."
        />
      </Page>
    </Document>
  )
}
