// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import {
	computeEffectiveProviderIds,
	getAppIdFromPath,
	getConfigForPath
} from '../../src/providerSelection';

describe('getAppIdFromPath', () => {
	it('extracts the app id', () => {
		expect(getAppIdFromPath('/index.php/apps/files/')).toBe('files');
		expect(getAppIdFromPath('/apps/mail/box/1')).toBe('mail');
	});

	it('returns null outside of an app', () => {
		expect(getAppIdFromPath('/index.php/login')).toBeNull();
	});
});

describe('getConfigForPath', () => {
	it('uses the __settings__ entry on settings pages', () => {
		const config = { __settings__: { enabled: false, providerIds: null } };

		expect(getConfigForPath('/index.php/settings/user', config).enabled).toBe(false);
		expect(getConfigForPath('/index.php/settings', config).enabled).toBe(false);
	});

	it('enables all providers for apps without an entry', () => {
		expect(getConfigForPath('/apps/files/', {})).toEqual({ enabled: true, providerIds: null });
	});

	it('disables pages that are not an app', () => {
		expect(getConfigForPath('/index.php/login', {}).enabled).toBe(false);
	});

	it('treats an empty provider list as all providers', () => {
		const config = { files: { enabled: true, providerIds: [] } };

		expect(getConfigForPath('/apps/files/', config).providerIds).toBeNull();
	});
});

describe('computeEffectiveProviderIds', () => {
	const config = {
		files: { enabled: true, providerIds: ['files', 'mail'] },
		mail: { enabled: false, providerIds: null }
	};

	it('returns the configured providers when restrictions are disabled', () => {
		expect(computeEffectiveProviderIds('/apps/files/', config, null)).toEqual([
			'files',
			'mail'
		]);
		expect(computeEffectiveProviderIds('/apps/dashboard/', config, null)).toBeNull();
	});

	it('returns undefined when the app is disabled', () => {
		expect(computeEffectiveProviderIds('/apps/mail/', config, ['mail'])).toBeUndefined();
	});

	it('drops configured providers the user is not allowed to use', () => {
		expect(computeEffectiveProviderIds('/apps/files/', config, ['files', 'talk'])).toEqual([
			'files'
		]);
	});

	it('limits "all providers" to the allowed ones', () => {
		expect(computeEffectiveProviderIds('/apps/dashboard/', config, ['talk'])).toEqual(['talk']);
	});

	it('returns undefined when no configured provider is allowed', () => {
		expect(computeEffectiveProviderIds('/apps/files/', config, ['talk'])).toBeUndefined();
		expect(computeEffectiveProviderIds('/apps/dashboard/', config, [])).toBeUndefined();
	});
});
