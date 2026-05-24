/**
 * Certificate of Analysis (CoA) — PDF Document
 * Resultados de análisis de calidad del lote de PT para clientes industriales.
 */
// @ts-ignore
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import * as React from 'react'
import {
  COLORS, FONTS, FONT_SIZES, SPACING, PAGE,
  type OrgBranding, fmtDate, docId,
} from '../../../lib/pdf/design'
import {
  baseStyles, DocHeader, StatusBanner, Section, DetailRow, DocFooter,
} from '../../../lib/pdf/components'

export type QaResult = {
  parameter: string
  specification: string | null
  result: string | number | boolean
  unit: string | null
  status: 'pass' | 'fail' | 'info'
}

export type CoaPdfData = {
  org: OrgBranding
  coa_number: string
  lot_number: string
  product_code: string
  product_name: string
  production_date: string
  expiry_date: string | null
  quantity: number
  uom: string
  customer_name: string | null
  qa_results: QaResult[]
  approved_by: string | null
  approved_at: string | null
  id: string
}

const s = StyleSheet.create({
  resultTable: { borderWidth: 0.5, borderColor: COLORS.gray200, borderRadius: 4, overflow: 'hidden' },
  resultHeader: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 5, paddingHorizontal: 8 },
  resultRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.3, borderBottomColor: COLORS.gray200 },
  resultRowAlt: { backgroundColor: COLORS.gray50 },
  cParam: { flex: 3, fontSize: FONT_SIZES.sm },
  cSpec: { flex: 2, fontSize: FONT_SIZES.sm, textAlign: 'center' },
  cResult: { flex: 2, fontSize: FONT_SIZES.sm, textAlign: 'center' },
  cStatus: { flex: 1, fontSize: FONT_SIZES.sm, textAlign: 'center' },
  hdrText: { fontFamily: FONTS.bold, fontSize: FONT_SIZES.xs, color: COLORS.white },
  qrBox: { width: 60, height: 60, borderWidth: 1, borderColor: COLORS.gray300, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  qrText: { fontSize: FONT_SIZES.xs, color: COLORS.neutral, textAlign: 'center' },
  stamp: { borderWidth: 2, borderColor: COLORS.success, borderRadius: 6, padding: 8, alignItems: 'center' },
  stampText: { fontSize: FONT_SIZES.base, fontFamily: FONTS.bold, color: COLORS.success },
  stampSub: { fontSize: FONT_SIZES.xs, color: COLORS.success, marginTop: 2 },
})

export function CoaPdf({ data: d }: { data: CoaPdfData }) {
  const allPass = d.qa_results.every((r) => r.status !== 'fail')

  return (
    <Document title={`CoA ${d.coa_number}`} author={d.org.name}>
      <Page size="A4" style={baseStyles.page}>
        <DocHeader
          org={d.org}
          docTitle="Certificate of Analysis"
          docNumber={`CoA N° ${d.coa_number} | Lote ${d.lot_number}`}
        />

        <StatusBanner
          label={allPass ? '✓ LOTE APROBADO — APTO PARA DESPACHO' : '✗ LOTE RECHAZADO — NO APTO PARA DESPACHO'}
          color={allPass ? COLORS.success : COLORS.danger}
        />

        <View style={{ paddingHorizontal: PAGE.padding, paddingTop: (SPACING as any)[3] }}>
          {/* Identificación del lote */}
          <Section title="Identificación del Producto y Lote">
            <View style={{ flexDirection: 'row', gap: (SPACING as any)[3] }}>
              <View style={{ flex: 1 }}>
                <DetailRow label="Código de producto" value={d.product_code} />
                <DetailRow label="Nombre del producto" value={d.product_name} />
                <DetailRow label="Número de lote" value={d.lot_number} />
              </View>
              <View style={{ flex: 1 }}>
                <DetailRow label="Fecha de producción" value={fmtDate(d.production_date)} />
                {d.expiry_date && <DetailRow label="Fecha de vencimiento" value={fmtDate(d.expiry_date)} />}
                <DetailRow label="Cantidad" value={`${d.quantity.toLocaleString('es-VE', { minimumFractionDigits: 2 })} ${d.uom}`} />
              </View>
              <View style={{ flex: 1 }}>
                {d.customer_name && <DetailRow label="Cliente" value={d.customer_name} />}
                {d.approved_by && <DetailRow label="Aprobado por" value={d.approved_by} />}
                {d.approved_at && <DetailRow label="Fecha aprobación" value={fmtDate(d.approved_at)} />}
              </View>
            </View>
          </Section>

          {/* Resultados de análisis */}
          {d.qa_results.length > 0 ? (
            <Section title="Resultados de Análisis de Calidad">
              <View style={s.resultTable}>
                <View style={s.resultHeader}>
                  <Text style={[s.cParam, s.hdrText]}>Parámetro</Text>
                  <Text style={[s.cSpec, s.hdrText]}>Especificación</Text>
                  <Text style={[s.cResult, s.hdrText]}>Resultado</Text>
                  <Text style={[s.cStatus, s.hdrText]}>Estado</Text>
                </View>
                {d.qa_results.map((r, i) => (
                  <View key={i} style={[s.resultRow, i % 2 === 1 ? s.resultRowAlt : {}]}>
                    <Text style={s.cParam}>{r.parameter}{r.unit ? ` (${r.unit})` : ''}</Text>
                    <Text style={[s.cSpec, { color: COLORS.neutral }]}>{r.specification ?? '—'}</Text>
                    <Text style={[s.cResult, { fontFamily: FONTS.bold }]}>{String(r.result)}</Text>
                    <Text style={[s.cStatus, {
                      fontFamily: FONTS.bold,
                      color: r.status === 'pass' ? COLORS.success : r.status === 'fail' ? COLORS.danger : COLORS.neutral,
                    }]}>
                      {r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : (
            <Section title="Resultados de Análisis">
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.neutral, padding: (SPACING as any)[2] }}>
                Resultados de análisis registrados en el sistema de calidad.
              </Text>
            </Section>
          )}

          {/* Sello de aprobación */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: (SPACING as any)[4], gap: (SPACING as any)[4], alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.neutral, lineHeight: 1.5 }}>
                Este certificado ha sido emitido de acuerdo con los estándares internos de calidad y las normativas venezolanas vigentes (COVENIN, SENCAMER). Los resultados aplican exclusivamente al lote identificado.
              </Text>
            </View>
            <View style={[s.stamp, { borderColor: allPass ? COLORS.success : COLORS.danger }]}>
              <Text style={[s.stampText, { color: allPass ? COLORS.success : COLORS.danger }]}>
                {allPass ? 'APROBADO' : 'RECHAZADO'}
              </Text>
              <Text style={[s.stampSub, { color: allPass ? COLORS.success : COLORS.danger }]}>
                {d.approved_by ?? 'Dpto. Calidad'}
              </Text>
              {d.approved_at && <Text style={[s.stampSub, { color: allPass ? COLORS.success : COLORS.danger }]}>{fmtDate(d.approved_at)}</Text>}
            </View>
          </View>
        </View>

        <DocFooter generatedAt={new Date().toLocaleDateString('es-VE')} />
      </Page>
    </Document>
  )
}
