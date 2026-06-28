import { type Page, expect } from '@playwright/test';

export function authFileFromUrl(url: string) {
	const s = url.split(':');
	return `.playwright/auth/user-${s[2]}.json`;
}

/**
 * Open an app from the top navigation, handling the Nextcloud 34 "waffle" menu.
 *
 * NC 30–33 list every app directly in the navigation, so the link can be
 * clicked straight away. NC 34 collapses overflowing apps behind a button
 * (`.app-menu__waffle`) that opens a popover containing the rest of the apps,
 * exposed as `menuitem`s rather than plain links.
 *
 * We wait until either the link itself or the waffle button is present, then:
 *   - if the link is already visible (old layout) we click it directly;
 *   - otherwise (NC 34) we click the waffle to reveal the popover and click
 *     the matching menuitem inside it.
 */
export async function openAppFromMenu(page: Page, name: string) {
	const navLink = page.getByRole('navigation').getByRole('link', { name });
	const waffle = page.locator('.app-menu__waffle');

	// Wait for the app menu to settle into one of its two possible layouts.
	await expect(navLink.or(waffle)).toBeVisible();

	if (await navLink.isVisible()) {
		await navLink.click();
		return;
	}

	// NC 34: reveal the overflow popover, then click the app entry inside it.
	await waffle.click();
	const link = page.getByRole('menuitem', { name }).first();
	await expect(link).toBeVisible();
	await link.click();
}
