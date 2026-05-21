/**
 * Shared PDF design system for Aika Platform documents.
 * Uses @react-pdf/renderer with a professional design language:
 * - Navy primary header with company initials avatar
 * - Clean section layout with colored headers
 * - Professional typography using built-in Helvetica
 * - Consistent spacing and borders
 */

// ─── Color palette ────────────────────────────────────────────────────────────

export const COLORS = {
  // Brand
  primary: '#1e3a5f',       // Deep navy — header background
  primaryLight: '#2563eb',  // Bright blue — section headers, links
  primaryFade: '#e8f0fe',   // Very light blue — alternate row background

  // Semantic
  success: '#059669',       // Emerald — paid, confirmed, approved
  warning: '#d97706',       // Amber — pending, overdue
  danger: '#dc2626',        // Red — rejected, failed
  neutral: '#6b7280',       // Gray — muted text

  // Neutral scale
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray700: '#334155',
  gray900: '#0f172a',

  // Document
  pageBg: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
} as const

// ─── Typography ──────────────────────────────────────────────────────────────

export const FONTS = {
  body: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
  boldItalic: 'Helvetica-BoldOblique',
} as const

export const FONT_SIZES = {
  xs: 7,
  sm: 8,
  base: 9,
  md: 10,
  lg: 12,
  xl: 14,
  '2xl': 16,
  '3xl': 20,
  '4xl': 26,
} as const

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const SPACING = {
  xs: 3,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  '2xl': 32,
} as const

// ─── Page settings ────────────────────────────────────────────────────────────

export const PAGE = {
  size: 'LETTER' as const,
  orientation: 'portrait' as const,
  margins: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  // Content area padding (inside the margin)
  padding: 36,
} as const

// ─── Org branding ─────────────────────────────────────────────────────────────

export type OrgBranding = {
  name: string
  logoUrl: string | null
  rif?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

/**
 * Get 1-2 initials from org name for the avatar circle.
 */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()
}

/**
 * Format a date in Venezuelan locale (DD/MM/YYYY).
 */
export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Format a number as a currency amount.
 */
export function fmtAmount(value: string | number | null | undefined, currency = 'USD'): string {
  if (value == null) return '—'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '—'
  return `${currency} ${num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Generate a short page-level document ID for the footer.
 */
export function docId(id: string): string {
  return id.replace(/-/g, '').slice(0, 12).toUpperCase()
}
