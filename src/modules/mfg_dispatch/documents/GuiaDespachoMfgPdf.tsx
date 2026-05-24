/**
 * Guía de Despacho de Producto Terminado Industrial
 * Acompaña el despacho de PT desde la planta al cliente industrial.
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

export type DispatchLine = {
  product_code: string
  product_name: string
  lot_number: string | null
  quantity: number
  uom: string
  unit_price_usd: number
  total_price_usd: number
}

export type GuiaDespachoMfgData = {
  org: OrgBranding
  dispatch_number: string
  sale_order_number: string
  customer_name: string
  customer_rif: string | null
  dispatch_date: string | null
  carrier_name: string | null
  vehicle_plate: string | null
  driver_name: string | null
  requires_temperature_control: boolean
  temperature_range: string | null
  lines: DispatchLine[]
  subtotal_usd: number
  iva_pct: number
  iva_amount_usd: number
  igtf_pct: number | null
  igtf_amount_usd: number
  total_usd: number
  notes: string | null
  id: string
}

const s = StyleSheet.create({
  tableHeader: { flexDirection: 'row', backgroundColor: COLORS.primaryFade, paddingVertical: 5, paddingHorizontal: 6 },
  tableRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: COLORS.gray200 },
  tableRowAlt: { backgroundColor: COLORS.gray50 },
  cProduct: { flex: 3, fontSize: FONT_SIZES.sm },
  cLot: { flex: 2, fontSize: FONT_SIZES.sm },
  cQty: { flex: 1, fontSize: FONT_SIZES.sm, textAlign: 'right' },
  cPrice: { flex: 2, fontSize: FONT_SIZES.sm, textAlign: 'right' },
  totalSection: { marginTop: (SPACING as any)[2], paddingRight: (SPACING as any)[2] },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: (SPACING as any)[4], paddingVertical: 3 },
  totalLabel: { fontSize: FONT_SIZES.sm, color: COLORS.neutral, width: 140, textAlign: 'right' },
  totalValue: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold, width: 100, textAlign: 'right' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: (SPACING as any)[4], paddingVertical: 5, backgroundColor: COLORS.primary, borderRadius: 3, marginTop: 3, paddingHorizontal: (SPACING as any)[2] },
  grandLabel: { fontSize: FONT_SIZES.base, fontFamily: FONTS.bold, color: COLORS.white, width: 140, textAlign: 'right' },
  grandValue: { fontSize: FONT_SIZES.xl, fontFamily: FONTS.bold, color: COLORS.white, width: 100, textAlign: 'right' },
  coldAlert: { flexDirection: 'row', gap: 6, padding: 8, backgroundColor: '#EFF6FF', borderRadius: 4, borderWidth: 0.5, borderColor: COLORS.primaryLight, marginBottom: (SPACING as any)[2] },
})

export function GuiaDespachoMfgPdf({ data: d }: { data: GuiaDespachoMfgData }) {
  const hasIgtf = d.igtf_amount_usd > 0 && d.igtf_pct

  return (
    <Document title={`Guía ${d.dispatch_number}`} author={d.org.name}>
      <Page size="A4" style={baseStyles.page}>
        <DocHeader
          org={d.org}
          docTitle="Guía de Despacho"
          docNumber={`${d.dispatch_number} | Pedido ${d.sale_order_number} | ${d.dispatch_date ? fmtDate(d.dispatch_date) : '—'}`}
        />

        <StatusBanner label="DESPACHO DE PRODUCTO TERMINADO" color={COLORS.primaryLight} />

        <View style={{ paddingHorizontal: PAGE.padding, paddingTop: (SPACING as any)[3] }}>
          {/* Cliente y transporte */}
          <Section title="Destinatario y Transporte">
            <View style={{ flexDirection: 'row', gap: (SPACING as any)[3] }}>
              <View style={{ flex: 1 }}>
                <DetailRow label="Cliente" value={d.customer_name} />
                {d.customer_rif && <DetailRow label="RIF" value={d.customer_rif} />}
                <DetailRow label="Pedido origen" value={d.sale_order_number} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Transportista" value={d.carrier_name ?? '—'} />
                <DetailRow label="Placa del vehículo" value={d.vehicle_plate ?? '—'} />
                <DetailRow label="Conductor" value={d.driver_name ?? '—'} />
              </View>
            </View>
          </Section>

          {/* Alerta de temperatura */}
          {d.requires_temperature_control && (
            <View style={s.coldAlert}>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.primaryLight, fontFamily: FONTS.bold }}>🌡 Control de Temperatura Requerido</Text>
              {d.temperature_range && <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.primary }}>Rango: {d.temperature_range}</Text>}
            </View>
          )}

          {/* Líneas de despacho */}
          <Section title="Detalle de Productos Despachados">
            <View style={s.tableHeader}>
              <Text style={[s.cProduct, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Producto</Text>
              <Text style={[s.cLot, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Lote PT</Text>
              <Text style={[s.cQty, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Cantidad</Text>
              <Text style={[s.cPrice, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>P. Unit.</Text>
              <Text style={[s.cPrice, { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs }]}>Total</Text>
            </View>
            {d.lines.map((l, i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                <View style={[s.cProduct, { gap: 1 }]}>
                  <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold }}>{l.product_code}</Text>
                  <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.neutral }}>{l.product_name}</Text>
                </View>
                <Text style={[s.cLot, { fontSize: FONT_SIZES.xs, color: COLORS.neutral }]}>{l.lot_number ?? '—'}</Text>
                <Text style={s.cQty}>{l.quantity.toLocaleString('es-VE', { minimumFractionDigits: 2 })} {l.uom}</Text>
                <Text style={s.cPrice}>USD {l.unit_price_usd.toFixed(4)}</Text>
                <Text style={[s.cPrice, { fontFamily: FONTS.bold }]}>USD {l.total_price_usd.toFixed(2)}</Text>
              </View>
            ))}
          </Section>

          {/* Totales */}
          <View style={s.totalSection}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>USD {d.subtotal_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>IVA {d.iva_pct}%</Text>
              <Text style={s.totalValue}>USD {d.iva_amount_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
            </View>
            {hasIgtf && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>IGTF {d.igtf_pct}%</Text>
                <Text style={s.totalValue}>USD {d.igtf_amount_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
              </View>
            )}
            <View style={s.grandTotalRow}>
              <Text style={s.grandLabel}>TOTAL</Text>
              <Text style={s.grandValue}>USD {d.total_usd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>

          {d.notes && (
            <View style={{ marginTop: (SPACING as any)[3], padding: (SPACING as any)[2], backgroundColor: COLORS.gray50, borderRadius: 3 }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.neutral }}>{d.notes}</Text>
            </View>
          )}

          <>{[
            { label: 'Responsable de Almacén', name: '' },
            { label: 'Conductor / Transportista', name: d.driver_name ?? '' },
            { label: 'Recibido por el Cliente', name: '' },
          ].map((s: any, i: number) => <SignatureBlock key={i} label={s.label} name={s.name} />)}</>
        </View>

        <DocFooter generatedAt={new Date().toLocaleDateString()} />
      </Page>
    </Document>
  )
}
