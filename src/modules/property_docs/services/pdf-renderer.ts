/**
 * PDF Property Sheet Renderer
 *
 * Generates structured HTML for a property sheet that can be converted to PDF.
 * Uses the data from the property-pdf API endpoint.
 *
 * The HTML output is designed to be rendered by a headless browser (Puppeteer)
 * or converted via a PDF service. For now, returns HTML that the client can
 * print via window.print() or send to a PDF generation service.
 */

export type PropertySheetData = {
  id: string
  title: string
  description: string | null
  property_type: string
  operation: string
  status: string
  price: string
  currency: string
  area_m2: string | null
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  city: string
  state: string | null
  address_line: string | null
  commission_rate: string
  cover_image_url: string | null
  agent_name: string | null
  agent_phone: string | null
  agent_email: string | null
  portal_url: string
}

const TYPE_LABELS: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  terreno: 'Terreno',
  comercial: 'Local Comercial',
  oficina: 'Oficina',
  galpon: 'Galpón',
  otro: 'Otro',
}

const OP_LABELS: Record<string, string> = {
  venta: 'EN VENTA',
  alquiler: 'EN ALQUILER',
  venta_alquiler: 'VENTA / ALQUILER',
}

/**
 * Renders a property sheet as HTML string suitable for PDF conversion.
 */
export function renderPropertySheetHtml(data: PropertySheetData): string {
  const specs = [
    data.area_m2 ? `${data.area_m2} m²` : null,
    data.bedrooms ? `${data.bedrooms} habitaciones` : null,
    data.bathrooms ? `${data.bathrooms} baños` : null,
    data.parking ? `${data.parking} estacionamientos` : null,
  ].filter(Boolean).join(' • ')

  const location = [data.address_line, data.city, data.state].filter(Boolean).join(', ')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)} — Ficha de Propiedad</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; }
    .sheet { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; border-bottom: 2px solid #e5e5e5; padding-bottom: 16px; }
    .operation-badge { background: #1a1a1a; color: white; padding: 4px 12px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; border-radius: 4px; }
    .price { font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 16px 0 8px; }
    .title { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
    .type-badge { display: inline-block; background: #f3f4f6; padding: 2px 8px; border-radius: 4px; font-size: 13px; color: #4b5563; }
    .cover-image { width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin: 16px 0; }
    .specs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .spec-item { text-align: center; padding: 12px; background: #f9fafb; border-radius: 8px; }
    .spec-value { font-size: 20px; font-weight: 700; }
    .spec-label { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .section { margin: 24px 0; }
    .section-title { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .description { font-size: 14px; line-height: 1.6; color: #374151; }
    .location { font-size: 14px; color: #374151; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #e5e5e5; display: flex; justify-content: space-between; align-items: center; }
    .agent-info { font-size: 13px; color: #4b5563; }
    .agent-name { font-weight: 600; font-size: 14px; color: #1a1a1a; }
    .qr-placeholder { width: 80px; height: 80px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #9ca3af; }
    @media print { .sheet { padding: 20px; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <span class="operation-badge">${OP_LABELS[data.operation] ?? data.operation}</span>
        <span class="type-badge" style="margin-left: 8px;">${TYPE_LABELS[data.property_type] ?? data.property_type}</span>
      </div>
      <div class="price">${escapeHtml(data.currency)} ${Number(data.price).toLocaleString('es-VE')}</div>
    </div>

    <h1 class="title">${escapeHtml(data.title)}</h1>

    ${data.cover_image_url ? `<img class="cover-image" src="${escapeHtml(data.cover_image_url)}" alt="${escapeHtml(data.title)}" />` : ''}

    ${specs ? `
    <div class="specs">
      ${data.area_m2 ? `<div class="spec-item"><div class="spec-value">${data.area_m2}</div><div class="spec-label">m²</div></div>` : ''}
      ${data.bedrooms ? `<div class="spec-item"><div class="spec-value">${data.bedrooms}</div><div class="spec-label">Habitaciones</div></div>` : ''}
      ${data.bathrooms ? `<div class="spec-item"><div class="spec-value">${data.bathrooms}</div><div class="spec-label">Baños</div></div>` : ''}
      ${data.parking ? `<div class="spec-item"><div class="spec-value">${data.parking}</div><div class="spec-label">Estacionamientos</div></div>` : ''}
    </div>` : ''}

    ${data.description ? `
    <div class="section">
      <div class="section-title">Descripción</div>
      <p class="description">${escapeHtml(data.description)}</p>
    </div>` : ''}

    <div class="section">
      <div class="section-title">Ubicación</div>
      <p class="location">${escapeHtml(location)}</p>
    </div>

    <div class="footer">
      <div class="agent-info">
        ${data.agent_name ? `<div class="agent-name">${escapeHtml(data.agent_name)}</div>` : ''}
        ${data.agent_phone ? `<div>${escapeHtml(data.agent_phone)}</div>` : ''}
        ${data.agent_email ? `<div>${escapeHtml(data.agent_email)}</div>` : ''}
      </div>
      <div class="qr-placeholder">QR</div>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
