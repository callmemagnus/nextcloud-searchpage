import { expect, test } from '@playwright/test';

const SETTINGS_URL = '/index.php/settings/admin/thesearchpage';

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
