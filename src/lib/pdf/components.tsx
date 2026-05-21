/**
 * Shared React-PDF components for Aika Platform documents.
 * All components use the shared design system from ./design.ts
 */
// @ts-ignore — react-pdf types may lag behind version
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import * as React from 'react'
import {
  COLORS, FONTS, FONT_SIZES, SPACING, PAGE,
  type OrgBranding, getInitials,
} from './design'

// ─── Common styles ────────────────────────────────────────────────────────────

export const baseStyles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.pageBg,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.base,
    color: COLORS.text,
  },
  // Full-width header band
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 28,
    paddingHorizontal: PAGE.padding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  // Avatar circle
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    color: COLORS.white,
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
  },
  // Logo image (if available)
  logoImage: {
    width: 52,
    height: 52,
    borderRadius: 8,
    objectFit: 'contain',
  },
  // Org name + doc title block
  headerTextBlock: {
    flex: 1,
  },
  headerOrgName: {
    color: COLORS.white,
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
    lineHeight: 1.2,
  },
  headerDocTitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.body,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Document number pill (top-right of header)
  headerDocNumber: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  headerDocNumberText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  // Colored status banner below header
  statusBanner: {
    paddingVertical: 8,
    paddingHorizontal: PAGE.padding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Content area
  content: {
    paddingHorizontal: PAGE.padding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    flex: 1,
  },
  // Section
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    backgroundColor: COLORS.primaryFade,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderText: {
    color: COLORS.primaryLight,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Row in a detail section
  row: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    width: '38%',
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
  },
  rowValue: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
  },
  rowValueBold: {
    flex: 1,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
  },
  // Table
  table: {
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  tableRowAlt: {
    backgroundColor: COLORS.gray50,
  },
  tableCell: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.text,
  },
  tableCellRight: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.body,
    color: COLORS.text,
    textAlign: 'right',
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.primary,
    backgroundColor: COLORS.primaryFade,
  },
  tableTotalLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableTotalValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    textAlign: 'right',
  },
  // Footer
  footer: {
    backgroundColor: COLORS.gray50,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: PAGE.padding,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.gray400,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.body,
  },
  footerCode: {
    color: COLORS.gray500,
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  // Signature block
  signatureBlock: {
    width: '40%',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray300,
    paddingTop: 6,
    marginTop: 32,
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontFamily: FONTS.body,
    textAlign: 'center',
  },
})

// ─── Components ───────────────────────────────────────────────────────────────

/**
 * Document header with company logo/initials + name + document type + number.
 */
export function DocHeader({
  org,
  docTitle,
  docNumber,
  accentColor,
}: {
  org: OrgBranding
  docTitle: string
  docNumber?: string | null
  accentColor?: string
}) {
  const headerBg = accentColor ?? COLORS.primary
  return (
    <View style={[baseStyles.header, { backgroundColor: headerBg }]}>
      {/* Logo or initials */}
      {org.logoUrl ? (
        <Image src={org.logoUrl} style={baseStyles.logoImage} />
      ) : (
        <View style={baseStyles.avatarCircle}>
          <Text style={baseStyles.avatarText}>{getInitials(org.name)}</Text>
        </View>
      )}

      {/* Org name + document title */}
      <View style={[baseStyles.headerTextBlock]}>
        <Text style={baseStyles.headerOrgName}>{org.name}</Text>
        <Text style={baseStyles.headerDocTitle}>{docTitle}</Text>
        {org.rif && (
          <Text style={[baseStyles.headerDocTitle, { marginTop: 1 }]}>
            RIF: {org.rif}
          </Text>
        )}
      </View>

      {/* Document number pill */}
      {docNumber && (
        <View style={baseStyles.headerDocNumber}>
          <Text style={baseStyles.headerDocNumberText}>{docNumber}</Text>
        </View>
      )}
    </View>
  )
}

/**
 * Status banner — colored strip with label (e.g. "PAGADO", "PENDIENTE").
 */
export function StatusBanner({
  label,
  color,
}: {
  label: string
  color: string
}) {
  return (
    <View style={[baseStyles.statusBanner, { backgroundColor: `${color}15` }]}>
      <View style={[baseStyles.statusDot, { backgroundColor: color }]} />
      <Text style={[baseStyles.statusText, { color }]}>{label}</Text>
    </View>
  )
}

/**
 * Section with a colored left border and uppercase title.
 */
export function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <View style={baseStyles.section}>
      <View style={baseStyles.sectionHeader}>
        <Text style={baseStyles.sectionHeaderText}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

/**
 * Detail row — label: value
 */
export function DetailRow({
  label,
  value,
  bold,
}: {
  label: string
  value: string | null | undefined
  bold?: boolean
}) {
  return (
    <View style={baseStyles.row}>
      <Text style={baseStyles.rowLabel}>{label}</Text>
      <Text style={bold ? baseStyles.rowValueBold : baseStyles.rowValue}>
        {value ?? '—'}
      </Text>
    </View>
  )
}

/**
 * Two-column grid of detail rows.
 */
export function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: SPACING.lg }}>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  )
}

/**
 * Page footer with doc code + timestamp.
 */
export function DocFooter({
  docCode,
  generatedAt,
  note,
}: {
  docCode?: string | null
  generatedAt: string
  note?: string | null
}) {
  return (
    <View style={baseStyles.footer}>
      <Text style={baseStyles.footerText}>
        {note ?? 'Documento generado automáticamente — Aika Platform'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        {docCode && (
          <Text style={baseStyles.footerCode}>ID: {docCode}</Text>
        )}
        <Text style={baseStyles.footerText}>{generatedAt}</Text>
      </View>
    </View>
  )
}

/**
 * Large amount display — used for the main financial total.
 */
export function AmountHighlight({
  label,
  amount,
  color,
}: {
  label: string
  amount: string
  color?: string
}) {
  return (
    <View style={{
      backgroundColor: COLORS.gray50,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: SPACING.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: SPACING.sm,
    }}>
      <Text style={{
        fontSize: FONT_SIZES.md,
        color: COLORS.textMuted,
        fontFamily: FONTS.body,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {label}
      </Text>
      <Text style={{
        fontSize: FONT_SIZES['3xl'],
        fontFamily: FONTS.bold,
        color: color ?? COLORS.success,
      }}>
        {amount}
      </Text>
    </View>
  )
}

/**
 * Signature line at the bottom of documents.
 */
export function SignatureBlock({
  label,
  name,
}: {
  label: string
  name?: string | null
}) {
  return (
    <View style={baseStyles.signatureBlock}>
      {name && (
        <Text style={[baseStyles.signatureLabel, { fontFamily: FONTS.bold, marginBottom: 2, color: COLORS.text }]}>
          {name}
        </Text>
      )}
      <Text style={baseStyles.signatureLabel}>{label}</Text>
    </View>
  )
}
