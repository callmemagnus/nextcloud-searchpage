// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Settings } from '../../src/types';

const mocks = vi.hoisted(() => ({
	fetchProviders: vi.fn(),
	fetchGroups: vi.fn(),
	fetchSettings: vi.fn()
}));

vi.mock('@shared/libs', () => ({ fetchProviders: mocks.fetchProviders }));
vi.mock('../../src/lib/api', () => ({
	fetchGroups: mocks.fetchGroups,
	fetchSettings: mocks.fetchSettings
}));

import settingsStore from '../../src/states/settingsStore.svelte';

const files = { id: 'files', name: 'Files' };
const mail = { id: 'mail', name: 'Mail' };

function savedSettings(overrides: Partial<Settings> = {}): Settings {
	return {
		enabled: true,
		hijackSearchEnabled: false,
		apps: [],
		appSearchConfig: {},
		providers: [files, mail],
		providerGroupMap: { files: ['admin'] },
		providerLimits: { files: 20 },
		...overrides
	};
}

beforeEach(() => {
	vi.spyOn(console, 'error').mockImplementation(() => {});
	mocks.fetchProviders.mockResolvedValue([files, mail]);
	mocks.fetchGroups.mockResolvedValue([{ id: 'admin', displayName: 'Admins' }]);
	settingsStore.newProviders = [];
});

describe('init', () => {
	it('defaults to every provider visible to every group on first setup', async () => {
		mocks.fetchSettings.mockResolvedValue(
			savedSettings({ providers: [], providerGroupMap: null, providerLimits: null })
		);

		await settingsStore.init();

		expect(settingsStore.settings.providerGroupMap).toEqual({
			files: ['admin', '__all__'],
			mail: ['admin', '__all__']
		});
		expect(settingsStore.settings.providerLimits).toEqual({ files: 10, mail: 10 });
		expect(settingsStore.newProviders).toEqual([]);
		expect(settingsStore.loading).toBe(false);
	});

	it('also applies group defaults when the saved map is empty', async () => {
		mocks.fetchSettings.mockResolvedValue(savedSettings({ providerGroupMap: {} }));

		await settingsStore.init();

		expect(settingsStore.settings.providerGroupMap?.mail).toEqual(['admin', '__all__']);
	});

	it('keeps saved settings untouched', async () => {
		mocks.fetchSettings.mockResolvedValue(savedSettings());

		await settingsStore.init();

		expect(settingsStore.settings.providerGroupMap).toEqual({ files: ['admin'] });
		expect(settingsStore.settings.providerLimits).toEqual({ files: 20 });
	});

	it('flags providers installed since the settings were saved', async () => {
		mocks.fetchSettings.mockResolvedValue(savedSettings({ providers: [files] }));

		await settingsStore.init();

		expect(settingsStore.newProviders).toEqual([mail]);
	});

	it('flags a new provider even when another one was removed', async () => {
		const talk = { id: 'talk', name: 'Talk' };
		mocks.fetchProviders.mockResolvedValue([files, talk]);
		mocks.fetchSettings.mockResolvedValue(savedSettings({ providers: [files, mail] }));

		await settingsStore.init();

		expect(settingsStore.newProviders).toEqual([talk]);
	});

	it('reports an error when loading fails', async () => {
		mocks.fetchSettings.mockRejectedValue(new Error('boom'));

		await settingsStore.init();

		expect(settingsStore.error).toBe('boom');
		expect(settingsStore.loading).toBe(false);
	});
});

describe('provider visibility', () => {
	beforeEach(async () => {
		mocks.fetchSettings.mockResolvedValue(
			savedSettings({ providerGroupMap: { files: ['admin'], mail: [] } })
		);
		await settingsStore.init();
	});

	it('checks group membership when restrictions are enabled', () => {
		expect(settingsStore.isProviderEnabledForGroup('files', 'admin')).toBe(true);
		expect(settingsStore.isProviderEnabledForGroup('files', 'staff')).toBe(false);
	});

	it('hides providers missing from the map or with no groups', () => {
		expect(settingsStore.isProviderEnabledForGroup('talk', 'admin')).toBe(false);
		expect(settingsStore.isProviderAvailableToAnyGroup('talk')).toBe(false);
		expect(settingsStore.isProviderAvailableToAnyGroup('mail')).toBe(false);
		expect(settingsStore.isProviderAvailableToAnyGroup('files')).toBe(true);
	});

	it('allows everything when restrictions are disabled', () => {
		settingsStore.updateEnabled(false);

		expect(settingsStore.isProviderEnabledForGroup('talk', 'staff')).toBe(true);
		expect(settingsStore.isProviderAvailableToAnyGroup('mail')).toBe(true);
	});
});
