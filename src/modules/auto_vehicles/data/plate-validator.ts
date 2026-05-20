/**
 * Venezuelan license plate validation and formatting.
 *
 * Formats:
 * - Classic: ABC123 (3 letters + 3 digits)
 * - New format: AB123CD (2 letters + 3 digits + 2 letters)
 * - Motorcycle: A12B34 (varies)
 * - Diplomatic: CD1234
 * - Temporary: various
 *
 * We accept any alphanumeric 5-8 chars and normalize to uppercase.
 */

const PLATE_REGEX_CLASSIC = /^[A-Z]{3}\d{3}$/
const PLATE_REGEX_NEW = /^[A-Z]{2}\d{3}[A-Z]{2}$/
const PLATE_REGEX_GENERAL = /^[A-Z0-9]{5,8}$/

export function validatePlate(plate: string): { valid: boolean; normalized: string; format: string } {
  const normalized = plate.trim().toUpperCase().replace(/[\s-]/g, '')

  if (PLATE_REGEX_CLASSIC.test(normalized)) {
    return { valid: true, normalized, format: 'classic' }
  }

  if (PLATE_REGEX_NEW.test(normalized)) {
    return { valid: true, normalized, format: 'new' }
  }

  if (PLATE_REGEX_GENERAL.test(normalized)) {
    return { valid: true, normalized, format: 'other' }
  }

  return { valid: false, normalized, format: 'invalid' }
}

export function formatPlate(plate: string): string {
  const normalized = plate.trim().toUpperCase().replace(/[\s-]/g, '')

  // Classic: ABC-123
  if (PLATE_REGEX_CLASSIC.test(normalized)) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3)}`
  }

  // New: AB-123-CD
  if (PLATE_REGEX_NEW.test(normalized)) {
    return `${normalized.slice(0, 2)}-${normalized.slice(2, 5)}-${normalized.slice(5)}`
  }

  return normalized
}
