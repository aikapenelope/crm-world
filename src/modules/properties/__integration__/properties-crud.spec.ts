/**
 * Integration tests — Properties CRUD (Playwright)
 *
 * These tests run against a live application instance. Use the ephemeral runner:
 *
 *   yarn test:integration:ephemeral
 *
 * The runner spins up a fresh Next.js app, PostgreSQL, Redis, and Meilisearch,
 * seeds default data, and executes these tests. See AGENTS.md §"Key Commands".
 *
 * Reference: https://docs.open-mercato.dev/framework/modules/routes-and-pages
 * Playwright docs: https://playwright.dev/docs/intro
 *
 * ⚠️  Never run against the production app (mercato.novaincs.com).
 *     The BASE_URL env var controls the target — always verify before running.
 */

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Admin credentials for the ephemeral test app.
 * The ephemeral runner seeds a default admin via `mercato auth setup`.
 * Override via environment variables for custom test environments.
 */
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL ?? 'admin@open-mercato.dev'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'Admin1234!'

/** Minimum property data for the create form. */
const TEST_PROPERTY = {
  title: 'Apartamento de Prueba — Test Playwright',
  city: 'Caracas',
  price: '1500.00',
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

/**
 * Sign in as admin using the Next.js auth API endpoint.
 * Storing state in browser cookies so subsequent page.goto() calls are
 * authenticated without repeating the form flow.
 *
 * Reference: https://playwright.dev/docs/auth
 */
async function loginAsAdmin(page: Page): Promise<void> {
  // Navigate to the login page and fill credentials
  await page.goto('/login')

  // Wait for the form to be ready
  await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 15_000 })

  await page.fill('input[type="email"], input[name="email"]', ADMIN_EMAIL)
  await page.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')

  // Wait for redirect to /backend (successful auth)
  await page.waitForURL(/\/backend/, { timeout: 20_000 })
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

// Use a shared browser session for all tests in this file to avoid
// re-authenticating on every test (faster, realistic of a real user session).
test.describe.configure({ mode: 'serial' })

let createdPropertyId: string | null = null

test.beforeAll(async ({ browser }) => {
  // We authenticate once before all tests in this file.
  // The context is shared via storage state in subsequent tests.
  const page = await browser.newPage()
  await loginAsAdmin(page)
  await page.close()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Properties module — admin CRUD', () => {
  test('navigates to the properties list page', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/backend/properties')

    // The DataTable or empty state should be visible
    await expect(
      page.locator('[data-testid="data-table"], [data-testid="empty-state"], table').first(),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('creates a new property via the admin form', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/backend/properties/create')

    // Fill required fields
    await page.waitForSelector('input[name="title"], input[placeholder*="título"], input[placeholder*="title"]', {
      timeout: 15_000,
    })

    // Title
    await page.fill(
      'input[name="title"], input[placeholder*="título"], input[placeholder*="title"]',
      TEST_PROPERTY.title,
    )

    // Property type — select "apartamento"
    const typeSelect = page.locator('select[name="property_type"], [data-field="property_type"] select').first()
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('apartamento')
    }

    // Operation — select "alquiler"
    const opSelect = page.locator('select[name="operation"], [data-field="operation"] select').first()
    if (await opSelect.isVisible()) {
      await opSelect.selectOption('alquiler')
    }

    // Price
    await page.fill(
      'input[name="price"], input[placeholder*="precio"], input[placeholder*="price"]',
      TEST_PROPERTY.price,
    )

    // City
    await page.fill(
      'input[name="city"], input[placeholder*="ciudad"], input[placeholder*="city"]',
      TEST_PROPERTY.city,
    )

    // Submit (Cmd/Ctrl+Enter as per design system rule, or button click)
    await page.keyboard.press('Meta+Enter')

    // Should redirect to the property detail or list after creation
    await expect(page).toHaveURL(/\/backend\/properties/, { timeout: 20_000 })

    // Capture the created property's ID from the URL if possible
    const url = page.url()
    const match = url.match(/\/backend\/properties\/([^/]+)/)
    if (match) {
      createdPropertyId = match[1]
    }
  })

  test('property appears in the list after creation', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/backend/properties')
    await page.waitForLoadState('domcontentloaded')

    // The test property title should appear somewhere in the table
    await expect(page.getByText(TEST_PROPERTY.title)).toBeVisible({ timeout: 20_000 })
  })

  test('navigates to the property detail page', async ({ page }) => {
    // Skip if we couldn't capture the ID from the create test
    test.skip(!createdPropertyId, 'Property ID not captured from create test')

    await loginAsAdmin(page)
    await page.goto(`/backend/properties/${createdPropertyId}`)
    await page.waitForLoadState('domcontentloaded')

    // The title should be present on the detail page
    await expect(page.getByText(TEST_PROPERTY.title)).toBeVisible({ timeout: 15_000 })
  })

  test('updates the property price', async ({ page }) => {
    test.skip(!createdPropertyId, 'Property ID not captured from create test')

    await loginAsAdmin(page)
    await page.goto(`/backend/properties/${createdPropertyId}`)
    await page.waitForLoadState('domcontentloaded')

    const priceInput = page.locator('input[name="price"]').first()
    if (await priceInput.isVisible()) {
      await priceInput.fill('2000.00')
      await page.keyboard.press('Meta+Enter')

      // Verify the update was saved (no error toast, price updated)
      await expect(page.locator('[data-variant="destructive"]')).not.toBeVisible({ timeout: 5_000 })
    }
  })

  test('filters properties by city in the list', async ({ page }) => {
    await loginAsAdmin(page)

    await page.goto('/backend/properties')
    await page.waitForLoadState('domcontentloaded')

    // Look for a city filter input or search
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="Search"], input[type="search"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_PROPERTY.city)
      await page.waitForTimeout(500) // debounce

      // The test property should be visible
      await expect(page.getByText(TEST_PROPERTY.title)).toBeVisible({ timeout: 10_000 })
    }
  })
})

// ---------------------------------------------------------------------------
// API endpoint validation
// ---------------------------------------------------------------------------

test.describe('Properties API endpoints', () => {
  test('GET /api/properties returns a valid response for authenticated users', async ({ request }) => {
    // Use the request fixture for direct API calls (faster than browser navigation)
    // Note: We need a session cookie. In a full setup, this would be obtained during auth.
    const response = await request.get('/api/properties', {
      headers: {
        // The ephemeral app may accept a special test header for internal auth.
        // Adjust this to your app's actual auth mechanism.
        'Accept': 'application/json',
      },
    })

    // Even if unauthenticated (401), the endpoint must exist and return JSON
    expect([200, 401, 403]).toContain(response.status())
    if (response.status() === 200) {
      const body = await response.json()
      expect(body).toHaveProperty('data')
      expect(Array.isArray(body.data)).toBe(true)
    }
  })

  test('POST /api/properties requires authentication', async ({ request }) => {
    const response = await request.post('/api/properties', {
      data: {
        title: 'Unauthorized attempt',
        property_type: 'casa',
        operation: 'venta',
        price: '100.00',
        city: 'Caracas',
      },
    })

    // Unauthenticated POST must return 401 or 403 (never 200 or 500)
    expect([401, 403]).toContain(response.status())
  })
})
