import { test, expect } from '@playwright/test'

const APP_URL = '/index.php/apps/thesearchpage'
const SEARCH_INPUT = 'input:below(:text("Search Page"))'

test('date filter is hidden by default and shown when Filters is clicked', async ({ page }) => {
    await page.goto(APP_URL)

    await expect(page.locator('input[type="date"]')).not.toBeVisible()

    await page.getByRole('button', { name: /Filters/ }).click()

    await expect(page.locator('input[type="date"]').first()).toBeVisible()
    await expect(page.locator('input[type="date"]').last()).toBeVisible()
})

test('date range is persisted in URL after search', async ({ page }) => {
    await page.goto(APP_URL)
    await page.locator(SEARCH_INPUT).fill('test')
    await page.getByRole('button', { name: /Filters/ }).click()

    await page.locator('input[type="date"]').first().fill('2024-01-01')
    await page.locator('input[type="date"]').last().fill('2024-12-31')

    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await page.waitForURL(/terms=test/)

    await expect(page).toHaveURL(/since=2024-01-01/)
    await expect(page).toHaveURL(/until=2024-12-31/)
})

test('date indicator appears in Filters button when a date is set', async ({ page }) => {
    await page.goto(APP_URL)

    await page.getByRole('button', { name: /Filters/ }).click()
    await page.locator('input[type="date"]').first().fill('2024-01-01')

    // Close the filter panel
    await page.getByRole('button', { name: /Filters/ }).click()

    await expect(page.locator('.mwb-date-active')).toBeVisible()
})

test('date indicator is absent when no date is set', async ({ page }) => {
    await page.goto(APP_URL)
    await expect(page.locator('.mwb-date-active')).not.toBeVisible()
})

test('date filter inputs enforce min/max constraints', async ({ page }) => {
    await page.goto(APP_URL)
    await page.getByRole('button', { name: /Filters/ }).click()

    const sinceInput = page.locator('input[type="date"]').first()
    const untilInput = page.locator('input[type="date"]').last()

    await sinceInput.fill('2024-06-01')
    await expect(untilInput).toHaveAttribute('min', '2024-06-01')

    await untilInput.fill('2024-03-01')
    await expect(sinceInput).toHaveAttribute('max', '2024-03-01')
})

test('search requests include since and until as timestamps when dates are set', async ({
    page
}) => {
    const searchUrls: string[] = []

    await page.route(/\/ocs\/v2\.php\/search\/providers\/.+\/search/, (route) => {
        searchUrls.push(route.request().url())
        route.continue()
    })

    await page.goto(APP_URL)
    await page.locator(SEARCH_INPUT).fill('admin')
    await page.getByRole('button', { name: /Filters/ }).click()
    await page.locator('input[type="date"]').first().fill('2020-01-01')
    await page.locator('input[type="date"]').last().fill('2030-12-31')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await page.waitForURL(/terms=admin/)

    // Wait for at least one search request to arrive
    await expect.poll(() => searchUrls.length, { timeout: 10_000 }).toBeGreaterThan(0)

    const hasSince = searchUrls.some((url) => url.includes('since='))
    const hasUntil = searchUrls.some((url) => url.includes('until='))
    expect(hasSince).toBe(true)
    expect(hasUntil).toBe(true)

    // Values must be numeric (UNIX timestamps), not ISO strings
    const timestampPattern = /since=\d+/
    expect(searchUrls.some((url) => timestampPattern.test(url))).toBe(true)
})

test('date range is restored from URL on page load', async ({ page }) => {
    await page.goto(`${APP_URL}?terms=test&since=2024-01-01&until=2024-12-31`)

    await page.getByRole('button', { name: /Filters/ }).click()

    await expect(page.locator('input[type="date"]').first()).toHaveValue('2024-01-01')
    await expect(page.locator('input[type="date"]').last()).toHaveValue('2024-12-31')
})
