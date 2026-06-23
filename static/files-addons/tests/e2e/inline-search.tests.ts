// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { test, expect, type Page } from '@playwright/test';

const SETTINGS_URL = '/index.php/settings/admin/thesearchpage';
const DASHBOARD_URL = '/index.php/apps/dashboard/';
const FILES_URL = '/index.php/apps/files/';

async function setInlineSearch(page: Page, enabled: boolean) {
	await page.goto(SETTINGS_URL);
	const checkbox = page.locator('#hijack-search-enabled');
	const label = page.locator('label[for="hijack-search-enabled"]');
	if ((await checkbox.isChecked()) !== enabled) {
		await label.click();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByText('Settings saved successfully')).toBeVisible();
	}
}

async function clickSearchButton(page: Page) {
	// NC <34: #unified-search button  |  NC 34: .unified-search-input button
	const btn = page.locator('#unified-search button, .unified-search-input button').first();
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

	test('files page pre-selects only the files provider', async ({ page }) => {
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
