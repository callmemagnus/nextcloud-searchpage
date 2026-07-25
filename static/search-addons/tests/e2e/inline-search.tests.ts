// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { test, expect, type Page } from '@playwright/test';

const SETTINGS_URL = '/index.php/settings/admin/thesearchpage';
const SETTINGS_API = '/index.php/apps/thesearchpage/api/v1/settings';
const DASHBOARD_URL = '/index.php/apps/dashboard/';
const FILES_URL = '/index.php/apps/files/';

async function setInlineSearch(page: Page, enabled: boolean) {
	// Use the API to ensure a clean, isolated state: desired hijack setting + empty app config.
	// Going through the UI would preserve any stale per-app overrides from previous runs.
	// Nextcloud requires the requesttoken CSRF header on POST requests, so we must be on a
	// Nextcloud page first to read OC.requestToken, then pass it as a header.
	if (!page.url().includes('/index.php/')) {
		await page.goto(SETTINGS_URL);
	}
	const token = await page.evaluate(() => (window as any).OC.requestToken as string);
	const resp = await page.request.get(SETTINGS_API);
	const current = await resp.json();
	const saveResp = await page.request.post(SETTINGS_API, {
		headers: { requesttoken: token },
		data: { ...current, hijackSearchEnabled: enabled, appSearchConfig: {} }
	});
	if (!saveResp.ok()) {
		throw new Error(`setInlineSearch: API returned ${saveResp.status()}`);
	}
}

async function clickSearchButton(page: Page) {
	// NC 30: .unified-search-menu  |  NC 31-33: #unified-search  |  NC 34: .unified-search-input
	const btn = page.locator('.unified-search-menu button, #unified-search button, .unified-search-input button').first();
	await expect(btn).toBeVisible({ timeout: 5000 });
	await btn.click();
}

test.describe('inline search modal — setting', () => {
	test('checkbox is shown in settings page', async ({ page }) => {
		await page.goto(SETTINGS_URL);
		await expect(page.getByLabel('Enable inline search modal')).toBeVisible();
	});

	test('checkbox is unchecked by default after explicit disable', async ({ page }) => {
		await setInlineSearch(page, false);
		await page.goto(SETTINGS_URL);
		await expect(page.locator('#hijack-search-enabled')).not.toBeChecked();
	});

	test('setting can be enabled and saved', async ({ page }) => {
		await setInlineSearch(page, false);
		await page.goto(SETTINGS_URL);
		await page.locator('label[for="hijack-search-enabled"]').click();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Settings saved successfully')).toBeVisible();
		await expect(page.locator('#hijack-search-enabled')).toBeChecked();
		// Reset
		await setInlineSearch(page, false);
	});
});

test.describe('inline search modal — disabled', () => {
	test.beforeEach(async ({ page }) => {
		await setInlineSearch(page, false);
	});

	test('search button opens NC default search, not our modal', async ({ page }) => {
		await page.goto(DASHBOARD_URL);
		await clickSearchButton(page);
		await expect(page.locator('.mwb-mini-modal')).not.toBeVisible();
	});
});

test.describe('inline search modal — enabled', () => {
	test.beforeEach(async ({ page }) => {
		await setInlineSearch(page, true);
	});

	test.afterEach(async ({ page }) => {
		await setInlineSearch(page, false);
	});

	test('clicking search button on dashboard opens modal', async ({ page }) => {
		await page.goto(DASHBOARD_URL);
		await clickSearchButton(page);
		await expect(page.locator('.mwb-mini-modal')).toBeVisible();
	});

	test('clicking search button on files page opens modal', async ({ page }) => {
		await page.goto(FILES_URL);
		await clickSearchButton(page);
		await expect(page.locator('.mwb-mini-modal')).toBeVisible();
	});

	test('modal can perform a search and show results', async ({ page }) => {
		await page.goto(DASHBOARD_URL);
		await clickSearchButton(page);
		const modal = page.locator('.mwb-mini-modal');
		await expect(modal).toBeVisible();
		await modal.getByRole('textbox').fill('personal');
		await modal.getByRole('button', { name: 'Search', exact: true }).click();
		// Wait for at least one result link to appear
		await expect(modal.getByRole('link').first()).toBeVisible({ timeout: 10_000 });
	});

	test('modal closes on Escape key', async ({ page }) => {
		await page.goto(DASHBOARD_URL);
		await clickSearchButton(page);
		await expect(page.locator('.mwb-mini-modal')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('.mwb-mini-modal')).not.toBeVisible();
	});

	test('modal closes on close button click', async ({ page }) => {
		await page.goto(DASHBOARD_URL);
		await clickSearchButton(page);
		const modal = page.locator('.mwb-mini-modal');
		await expect(modal).toBeVisible();
		await modal.getByRole('button', { name: 'Close' }).click();
		await expect(modal).not.toBeVisible();
	});

	test('modal closes on backdrop click', async ({ page }) => {
		await page.goto(DASHBOARD_URL);
		await clickSearchButton(page);
		await expect(page.locator('.mwb-mini-modal')).toBeVisible();
		// Click the backdrop (the element surrounding the modal)
		await page.locator('.mwb-mini-backdrop').click({ position: { x: 10, y: 10 } });
		await expect(page.locator('.mwb-mini-modal')).not.toBeVisible();
	});

	test('files page pre-selects only the files provider when configured', async ({ page }) => {
		// Configure the files app to use only the files provider via the settings UI
		await page.goto(SETTINGS_URL);
		// Find the Files app row (first cell contains exactly "Files")
		const filesRow = page.locator('.mwb-app-search-config-table tbody tr').filter({
			has: page.locator('td:first-child:has-text("Files")')
		});
		await expect(filesRow).toBeVisible();
		// If specific providers are already configured, reset to all first
		const useAllBtn = filesRow.getByRole('button', { name: 'Use all' });
		if (await useAllBtn.count() > 0) {
			await useAllBtn.click();
		}
		// Add only the files provider via the "Add provider…" dropdown
		const addProviderSelect = filesRow.locator('select');
		await expect(addProviderSelect).toBeVisible();
		await addProviderSelect.selectOption('files');
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Settings saved successfully')).toBeVisible();

		await page.goto(FILES_URL);
		await clickSearchButton(page);
		const modal = page.locator('.mwb-mini-modal');
		await expect(modal).toBeVisible();

		// Intercept search API calls to verify only the files provider is queried
		const searchedProviders: string[] = [];
		await page.route('**/ocs/v2.php/search/providers/*/search*', async (route, request) => {
			const match = request.url().match(/\/search\/providers\/([^/]+)\/search/);
			if (match) searchedProviders.push(match[1]);
			await route.continue();
		});

		await modal.getByRole('textbox').fill('admin');
		await modal.getByRole('button', { name: 'Search', exact: true }).click();

		// Wait for the files search response to arrive
		await page.waitForResponse(
			(res) => /\/search\/providers\/files\/search/.test(res.url()),
			{ timeout: 10_000 }
		);

		expect(searchedProviders).toEqual(['files']);
	});

	test('dashboard uses all providers (multiple provider sections visible)', async ({ page }) => {
		await page.goto(DASHBOARD_URL);
		await clickSearchButton(page);
		const modal = page.locator('.mwb-mini-modal');
		await expect(modal).toBeVisible();
		await modal.getByRole('textbox').fill('personal');
		await modal.getByRole('button', { name: 'Search', exact: true }).click();
		await expect(modal.getByRole('link').first()).toBeVisible({ timeout: 10_000 });
		// More than one provider section should appear
		await expect(modal.locator('.mwb-mini-provider-name').nth(1)).toBeVisible();
	});
});

test.describe('inline search modal — files path scope', () => {
	const SCOPE_TEST_FOLDER = 'ScopeE2ETest';
	const SCOPE_TEST_FOLDER_URL = `${FILES_URL}files?dir=/${SCOPE_TEST_FOLDER}`;

	async function ensureFolder(page: Page, name: string) {
		// DELETE to clear any leftover, then MKCOL — failures are intentionally ignored
		await page.request.fetch(`/remote.php/dav/files/admin/${name}`, { method: 'DELETE' });
		await page.request.fetch(`/remote.php/dav/files/admin/${name}`, { method: 'MKCOL' });
	}

	async function deleteFolder(page: Page, name: string) {
		await page.request.fetch(`/remote.php/dav/files/admin/${name}`, { method: 'DELETE' });
	}

	test.beforeEach(async ({ page }) => {
		await setInlineSearch(page, true);
	});

	test.afterEach(async ({ page }) => {
		await setInlineSearch(page, false);
	});

	test('scope toggle is not shown on dashboard', async ({ page }) => {
		await page.goto(DASHBOARD_URL);
		await clickSearchButton(page);
		await expect(page.locator('.mwb-mini-modal')).toBeVisible();
		await expect(page.locator('.mwb-mini-scope-bar')).not.toBeVisible();
	});

	test('scope toggle appears on files page after providers load', async ({ page }) => {
		await page.goto(FILES_URL);
		await clickSearchButton(page);
		await expect(page.locator('.mwb-mini-scope-bar')).toBeVisible({ timeout: 5000 });
	});

	test('scope bar shows "Home" and "Everywhere" at root', async ({ page }) => {
		await page.goto(FILES_URL);
		await clickSearchButton(page);
		const bar = page.locator('.mwb-mini-scope-bar');
		await expect(bar.getByRole('button', { name: 'Home' })).toBeVisible({ timeout: 5000 });
		await expect(bar.getByRole('button', { name: 'Everywhere' })).toBeVisible();
	});

	test('default scoped search sends path param to files API', async ({ page }) => {
		await page.goto(FILES_URL);
		await clickSearchButton(page);
		await expect(page.locator('.mwb-mini-scope-bar')).toBeVisible({ timeout: 5000 });

		const capturedUrls: string[] = [];
		await page.route('**/ocs/v2.php/search/providers/files/search*', async (route, request) => {
			capturedUrls.push(request.url());
			await route.continue();
		});

		const modal = page.locator('.mwb-mini-modal');
		await modal.getByRole('textbox').fill('admin');
		await modal.getByRole('button', { name: 'Search', exact: true }).click();
		await page.waitForResponse(
			(res) => /\/search\/providers\/files\/search/.test(res.url()),
			{ timeout: 10_000 }
		);

		expect(capturedUrls.length).toBeGreaterThan(0);
		expect(capturedUrls[0]).toContain('path=');
	});

	test('switching to Everywhere removes path param from files API', async ({ page }) => {
		await page.goto(FILES_URL);
		await clickSearchButton(page);
		await expect(page.locator('.mwb-mini-scope-bar')).toBeVisible({ timeout: 5000 });

		const modal = page.locator('.mwb-mini-modal');
		await modal.getByRole('textbox').fill('admin');
		await modal.getByRole('button', { name: 'Search', exact: true }).click();
		await page.waitForResponse(
			(res) => /\/search\/providers\/files\/search/.test(res.url()),
			{ timeout: 10_000 }
		);

		// Capture only the re-search triggered by the toggle
		const everywhereUrls: string[] = [];
		await page.route('**/ocs/v2.php/search/providers/files/search*', async (route, request) => {
			everywhereUrls.push(request.url());
			await route.continue();
		});

		await page.locator('.mwb-mini-scope-bar').getByRole('button', { name: 'Everywhere' }).click();
		await page.waitForResponse(
			(res) => /\/search\/providers\/files\/search/.test(res.url()),
			{ timeout: 10_000 }
		);

		expect(everywhereUrls.length).toBeGreaterThan(0);
		expect(everywhereUrls[0]).not.toContain('path=');
	});

	test('scope bar shows subfolder name when in a specific directory', async ({ page }) => {
		await ensureFolder(page, SCOPE_TEST_FOLDER);

		await page.goto(SCOPE_TEST_FOLDER_URL);
		await clickSearchButton(page);

		const bar = page.locator('.mwb-mini-scope-bar');
		await expect(bar.getByRole('button', { name: SCOPE_TEST_FOLDER })).toBeVisible({ timeout: 5000 });
		await expect(bar.getByRole('button', { name: 'Everywhere' })).toBeVisible();

		await deleteFolder(page, SCOPE_TEST_FOLDER);
	});

	test('scoped subfolder search sends correct path in API call', async ({ page }) => {
		await ensureFolder(page, SCOPE_TEST_FOLDER);

		await page.goto(SCOPE_TEST_FOLDER_URL);
		await clickSearchButton(page);
		await expect(page.locator('.mwb-mini-scope-bar')).toBeVisible({ timeout: 5000 });

		const capturedUrls: string[] = [];
		await page.route('**/ocs/v2.php/search/providers/files/search*', async (route, request) => {
			capturedUrls.push(request.url());
			await route.continue();
		});

		const modal = page.locator('.mwb-mini-modal');
		await modal.getByRole('textbox').fill('admin');
		await modal.getByRole('button', { name: 'Search', exact: true }).click();
		await page.waitForResponse(
			(res) => /\/search\/providers\/files\/search/.test(res.url()),
			{ timeout: 10_000 }
		);

		expect(capturedUrls.length).toBeGreaterThan(0);
		expect(decodeURIComponent(capturedUrls[0])).toContain(`path=/${SCOPE_TEST_FOLDER}`);

		await deleteFolder(page, SCOPE_TEST_FOLDER);
	});
});
