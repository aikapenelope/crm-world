/**
 * Constancia de Inscripción — PDF Document
 * Official school enrollment certificate with formal Venezuelan legal language.
 */
// @ts-ignore
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import * as React from 'react'
import {
  COLORS, FONTS, FONT_SIZES, SPACING, PAGE,
  type OrgBranding, fmtDate, docId,
} from '../../../lib/pdf/design'
import { baseStyles, DocHeader, DocFooter } from '../../../lib/pdf/components'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConstanciaPDFData = {
  org: OrgBranding
  schoolYear: string
  studentFullName: string
  cedula: string | null
  gradeLabel: string
  section: string
  enrollmentDate: string | null
  issuedTo: string | null   // "solicitud del interesado" / nombre de quien solicita
  purpose: string | null    // "para fines que estime conveniente"
  id: string
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  decorativeLine: {
    height: 3,
    flexDirection: 'row',
    marginBottom: SPACING.xl,
    marginTop: -2,
  },
  decorativeLineSegment1: {
    flex: 3,
    backgroundColor: COLORS.primary,
  },
  decorativeLineSegment2: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
  },
  decorativeLineSegment3: {
    flex: 0.5,
    backgroundColor: COLORS.gray300,
  },
  certTitle: {
    fontSize: FONT_SIZES['4xl'],
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  certSubtitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primaryLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bodyText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.body,
    color: COLORS.text,
    lineHeight: 1.8,
    textAlign: 'justify',
  },
  studentName: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    textDecoration: 'underline',
  },
  highlightInline: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  stampArea: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: COLORS.gray200,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.gray300,
    textAlign: 'center',
    fontFamily: FONTS.body,
  },
  signatureArea: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray300,
    paddingTop: 8,
  },
  folio: {
    backgroundColor: COLORS.gray100,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'center',
    marginTop: SPACING.xl,
  },
  folioText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
})

// ─── Document ─────────────────────────────────────────────────────────────────

export function ConstanciaInscripcion({ data }: { data: ConstanciaPDFData }) {
  const today = fmtDate(new Date())
  const todayFull = new Date().toLocaleDateString('es-VE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const cityAndDate = `Caracas, ${todayFull}`

  return (
    <Document
      title={`Constancia de Inscripción — ${data.studentFullName}`}
      author={data.org.name}
      subject={`Constancia de Inscripción ${data.schoolYear}`}
      creator="Aika Platform"
    >
      <Page size={PAGE.size} style={[baseStyles.page, { paddingBottom: 0 }]}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <DocHeader
          org={data.org}
          docTitle="Constancia de Inscripción"
          accentColor="#1a2a3a"
        />

        {/* Decorative triple line */}
        <View style={styles.decorativeLine}>
          <View style={styles.decorativeLineSegment1} />
          <View style={styles.decorativeLineSegment2} />
          <View style={styles.decorativeLineSegment3} />
        </View>

        {/* ── Content ────────────────────────────────────────────── */}
        <View style={[baseStyles.content, { paddingTop: SPACING.xl }]}>

          {/* Certificate title */}
          <Text style={styles.certTitle}>Constancia</Text>
          <Text style={styles.certSubtitle}>De Inscripción Estudiantil</Text>

          {/* Formal body text */}
          <View style={{ marginBottom: SPACING.xl }}>
            <Text style={styles.bodyText}>
              {'        '}
              Quien suscribe, en su carácter de Director(a) de{' '}
              <Text style={styles.highlightInline}>{data.org.name}</Text>
              {', hace constar mediante la presente que el/la estudiante:\n\n'}
            </Text>

            {/* Student name highlight box */}
            <View style={{
              backgroundColor: COLORS.primaryFade,
              borderRadius: 8,
              borderLeftWidth: 4,
              borderLeftColor: COLORS.primaryLight,
              padding: SPACING.md,
              marginVertical: SPACING.md,
              alignItems: 'center',
            }}>
              <Text style={styles.studentName}>{data.studentFullName.toUpperCase()}</Text>
              {data.cedula && (
                <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textMuted, marginTop: 3 }}>
                  C.I. / RIF: {data.cedula}
                </Text>
              )}
            </View>

            <Text style={styles.bodyText}>
              {'se encuentra debidamente '}
              <Text style={styles.highlightInline}>INSCRITO(A)</Text>
              {' en esta institución educativa para el año escolar '}
              <Text style={styles.highlightInline}>{data.schoolYear}</Text>
              {', cursando el '}
              <Text style={styles.highlightInline}>{data.gradeLabel}</Text>
              {', Sección '}
              <Text style={styles.highlightInline}>{data.section}</Text>
              {'.'}
              {data.enrollmentDate
                ? `\n\n        Su inscripción fue formalizada en fecha ${fmtDate(data.enrollmentDate)}.`
                : ''}
            </Text>

            {data.purpose && (
              <Text style={[styles.bodyText, { marginTop: SPACING.md }]}>
                {'        '}La presente constancia se expide a {data.issuedTo ?? 'solicitud del interesado'},
                {' '}para {data.purpose}.
              </Text>
            )}

            {!data.purpose && (
              <Text style={[styles.bodyText, { marginTop: SPACING.md }]}>
                {'        '}La presente constancia se expide a {data.issuedTo ?? 'solicitud del interesado'},
                {' '}para los fines legales que estime conveniente.
              </Text>
            )}
          </View>

          {/* Date */}
          <Text style={[styles.bodyText, { textAlign: 'right', marginBottom: SPACING.xl }]}>
            {cityAndDate}
          </Text>

          {/* Signature + stamp */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: SPACING.xl }}>
            {/* Signature */}
            <View style={[styles.signatureArea, { maxWidth: 200 }]}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontFamily: FONTS.bold, color: COLORS.text, textAlign: 'center' }}>
                {data.org.name}
              </Text>
              <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textMuted, textAlign: 'center', marginTop: 2 }}>
                Director(a) / Representante Legal
              </Text>
            </View>

            {/* Stamp area */}
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View style={styles.stampArea}>
                <Text style={styles.stampText}>SELLO{'\n'}OFICIAL</Text>
              </View>
            </View>
          </View>

          {/* Folio number */}
          <View style={styles.folio}>
            <Text style={styles.folioText}>FOLIO: {docId(data.id)}</Text>
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <DocFooter
          docCode={docId(data.id)}
          generatedAt={today}
          note="Documento oficial emitido por la institución. Válido con sello y firma del Director(a)."
        />
      </Page>
    </Document>
  )
}
