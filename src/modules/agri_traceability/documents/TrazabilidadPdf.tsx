/**
 * Certificado de Trazabilidad del Lote — PDF Document
 * Cadena completa: Producto → Beneficio → Lote de aves → Alimentos → Medicamentos → Proveedor
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

export type TraceLink = {
  step: string
  entity: string
  code: string
  detail: string
  date: string | null
}

export type TrazabilidadPdfData = {
  org: OrgBranding
  product_lot_number: string
  product_name: string
  production_date: string
  expiry_date: string | null
  quantity_kg: number
  chain: TraceLink[]
  feed_formulas: Array<{ name: string; cost_per_ton_usd: number | null }>
  medications: Array<{ name: string; dose: string | null; withdrawal_end_date: string | null }>
  issued_for: string | null
  id: string
}

const s = StyleSheet.create({
  chainRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: COLORS.gray200 },
  stepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.primaryFade, borderWidth: 1, borderColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 },
  stepNum: { fontSize: FONT_SIZES.xs, fontFamily: FONTS.bold, color: COLORS.primaryLight },
  chainContent: { flex: 1 },
  chainEntity: { fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold, color: COLORS.primary },
  chainDetail: { fontSize: FONT_SIZES.xs, color: COLORS.neutral, marginTop: 1 },
  chainDate: { fontSize: FONT_SIZES.xs, color: COLORS.neutral, marginTop: 1 },
  arrowRow: { alignItems: 'flex-start', paddingLeft: 18, paddingVertical: 1 },
  arrow: { fontSize: FONT_SIZES.xs, color: COLORS.gray400 },
  bullet: { flexDirection: 'row', gap: 6, paddingVertical: 2, paddingHorizontal: 6, borderBottomWidth: 0.3, borderBottomColor: COLORS.gray100 },
  bulletText: { fontSize: FONT_SIZES.sm, flex: 1 },
  bulletDetail: { fontSize: FONT_SIZES.xs, color: COLORS.neutral },
})

export function TrazabilidadPdf({ data: d }: { data: TrazabilidadPdfData }) {
  return (
    <Document title={`Trazabilidad ${d.product_lot_number}`} author={d.org.name}>
      <Page size="A4" style={baseStyles.page}>
        <DocHeader org={d.org} docTitle="Certificado de Trazabilidad del Lote" docNumber={`Lote: ${d.product_lot_number} | Emitido: ${fmtDate(new Date().toISOString())}`} />

        <View style={{ paddingHorizontal: PAGE.padding, paddingTop: (SPACING as any)[3] }}>
          {/* Identificación del producto */}
          <Section title="Producto Terminado">
            <View style={{ flexDirection: 'row', gap: (SPACING as any)[3] }}>
              <View style={{ flex: 1 }}>
                <DetailRow label="Lote de PT" value={d.product_lot_number} />
                <DetailRow label="Producto" value={d.product_name} />
                <DetailRow label="Cantidad" value={`${d.quantity_kg.toLocaleString('es-VE', { minimumFractionDigits: 2 })} kg`} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Fecha de producción" value={fmtDate(d.production_date)} />
                {d.expiry_date && <DetailRow label="Fecha de vencimiento" value={fmtDate(d.expiry_date)} />}
                {d.issued_for && <DetailRow label="Emitido para" value={d.issued_for} />}
              </View>
            </View>
          </Section>

          {/* Cadena de trazabilidad */}
          <Section title="Cadena de Trazabilidad Completa">
            {d.chain.map((link, i) => (
              <React.Fragment key={i}>
                <View style={s.chainRow}>
                  <View style={s.stepBadge}>
                    <Text style={s.stepNum}>{i + 1}</Text>
                  </View>
                  <View style={s.chainContent}>
                    <Text style={s.chainEntity}>{link.step} — {link.entity}</Text>
                    <Text style={s.chainDetail}>{link.detail}</Text>
                    {link.date && <Text style={s.chainDate}>{fmtDate(link.date)}</Text>}
                  </View>
                </View>
                {i < d.chain.length - 1 && (
                  <View style={s.arrowRow}><Text style={s.arrow}>↓</Text></View>
                )}
              </React.Fragment>
            ))}
          </Section>

          {/* Alimentos utilizados */}
          {d.feed_formulas.length > 0 && (
            <Section title="Fórmulas de Alimento Utilizadas">
              {d.feed_formulas.map((ff, i) => (
                <View key={i} style={s.bullet}>
                  <Text style={s.bulletText}>{ff.name}</Text>
                  {ff.cost_per_ton_usd != null && (
                    <Text style={s.bulletDetail}>USD {ff.cost_per_ton_usd.toFixed(2)}/ton</Text>
                  )}
                </View>
              ))}
            </Section>
          )}

          {/* Medicamentos y retiros */}
          {d.medications.length > 0 && (
            <Section title="Medicamentos Aplicados y Períodos de Retiro">
              {d.medications.map((m, i) => (
                <View key={i} style={s.bullet}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.bulletText}>{m.name}</Text>
                    {m.dose && <Text style={s.bulletDetail}>Dosis: {m.dose}</Text>}
                  </View>
                  {m.withdrawal_end_date && (
                    <Text style={[s.bulletDetail, { color: COLORS.success }]}>
                      Retiro terminado: {fmtDate(m.withdrawal_end_date)}
                    </Text>
                  )}
                </View>
              ))}
            </Section>
          )}

          {/* Declaración */}
          <View style={{ marginTop: (SPACING as any)[4], padding: (SPACING as any)[3], backgroundColor: COLORS.primaryFade, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: COLORS.primaryLight }}>
            <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.primary, fontFamily: FONTS.bold, marginBottom: 4 }}>
              Declaración de Inocuidad y Trazabilidad
            </Text>
            <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.text, lineHeight: 1.5 }}>
              Certificamos que el lote identificado ha cumplido con todos los períodos de retiro de medicamentos requeridos, 
              fue producido bajo Buenas Prácticas Avícolas (BPA) y sus ingredientes de producción son trazables desde el origen 
              hasta el producto terminado, en conformidad con las normativas del INSAI Venezuela.
            </Text>
          </View>
        </View>

        <DocFooter generatedAt={new Date().toLocaleDateString()} />
      </Page>
    </Document>
  )
}
