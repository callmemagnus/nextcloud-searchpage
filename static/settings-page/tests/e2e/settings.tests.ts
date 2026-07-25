import { expect, test } from '@playwright/test';

const SETTINGS_URL = '/index.php/settings/admin/thesearchpage';
const SETTINGS_API = '/index.php/apps/thesearchpage/api/v1/settings';

test('settings page loads', async ({ page }) => {
	await page.goto(SETTINGS_URL);
	await expect(page.getByRole('heading', { name: 'The Search Page settings' })).toBeVisible();
	await expect(page.getByLabel('Enable provider restrictions')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
});

test('provider limits table shows providers', async ({ page }) => {
	await page.goto(SETTINGS_URL);
	await expect(page.getByRole('heading', { name: 'Search results per provider' })).toBeVisible();
	// At least one provider row should be present
	await expect(page.locator('.mwb-provider-limits-table tbody tr').first()).toBeVisible();
});

test('enabling restrictions shows provider visibility table', async ({ page }) => {
	await page.goto(SETTINGS_URL);
	const checkbox = page.locator('#restrict-providers-enabled');
	// Nextcloud hides the actual <input> and styles the <label> instead —
	// interact via the label to trigger the click.
	const label = page.locator('label[for="restrict-providers-enabled"]');

	// Ensure restrictions are disabled first
	if (await checkbox.isChecked()) {
		await label.click();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Settings saved successfully')).toBeVisible();
	}

	await expect(
		page.getByRole('heading', { name: 'Provider visibility per group' })
	).not.toBeVisible();

	// Enable restrictions
	await label.click();

	await expect(
		page.getByRole('heading', { name: 'Provider visibility per group' })
	).toBeVisible();
	// Restrictions table should list providers as columns
	await expect(page.locator('.mwb-provider-restrictions-table thead th').nth(1)).toBeVisible();
});

test('settings can be saved', async ({ page }) => {
	await page.goto(SETTINGS_URL);
	await page.getByRole('button', { name: 'Save' }).click();
	await expect(page.getByText('Settings saved successfully')).toBeVisible();
});

test('enabling inline search modal shows app config table', async ({ page }) => {
	await page.goto(SETTINGS_URL);
	const checkbox = page.locator('#hijack-search-enabled');
	const label = page.locator('label[for="hijack-search-enabled"]');

	// Ensure disabled first
	if (await checkbox.isChecked()) {
		await label.click();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Settings saved successfully')).toBeVisible();
		await page.goto(SETTINGS_URL);
	}

	await expect(
		page.getByRole('heading', { name: 'Search override per application' })
	).not.toBeVisible();

	await label.click();

	await expect(
		page.getByRole('heading', { name: 'Search override per application' })
	).toBeVisible();
	// Table should have at least one app row
	await expect(page.locator('.mwb-app-search-config-table tbody tr').first()).toBeVisible();
});

test('app config table has provider controls per row', async ({ page }) => {
	// Navigate first so OC.requestToken is available for the CSRF header
	await page.goto(SETTINGS_URL);
	const token = await page.evaluate(() => (window as any).OC.requestToken as string);
	const getResp = await page.request.get(SETTINGS_API);
	const current = await getResp.json();
	// Enable inline search with clean app config
	await page.request.post(SETTINGS_API, {
		headers: { requesttoken: token },
		data: { ...current, hijackSearchEnabled: true, appSearchConfig: {} }
	});
	// Reload so the settings page reflects the saved state
	await page.goto(SETTINGS_URL);

	// First row defaults to enabled with "All providers" and an "Add provider…" dropdown
	const firstRow = page.locator('.mwb-app-search-config-table tbody tr').first();
	await expect(firstRow).toBeVisible();
	await expect(firstRow.getByText('All providers')).toBeVisible();
	await expect(firstRow.locator('select')).toBeVisible();

	// Reset
	await page.request.post(SETTINGS_API, {
		headers: { requesttoken: token },
		data: { ...current, hijackSearchEnabled: false, appSearchConfig: {} }
	});
});
