// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import axios from '@nextcloud/axios';
import { generateUrl } from '@nextcloud/router';
import type { Group, Settings } from '../types';
import { APP_NAME } from '../constants';

/**
 * Fetch all user groups
 */
export async function fetchGroups(): Promise<Group[]> {
	try {
		const url = generateUrl(`/apps/${APP_NAME}/api/v1/settings/groups`);
		const result = await axios.get(url);

		if (result.status === 200) {
			return result.data as Group[];
		}
		return [];
	} catch (e) {
		console.error('Error fetching groups:', e);
		return [];
	}
}

/**
 * Fetch current settings
 */
export async function fetchSettings(): Promise<Settings> {
	try {
		const url = generateUrl(`/apps/${APP_NAME}/api/v1/settings`);
		const result = await axios.get(url);

		if (result.status === 200) {
			return result.data as Settings;
		}
		return {
			enabled: false,
			providers: [],
			providerGroupMap: {},
			providerLimits: {}
		};
	} catch (e) {
		console.error('Error fetching settings:', e);
		return {
			enabled: false,
			providers: [],
			providerGroupMap: {},
			providerLimits: {}
		};
	}
}

/**
 * Save settings
 */
export async function saveSettings(
	settings: Settings
): Promise<{ success: boolean; message?: string; error?: string }> {
	try {
		const url = generateUrl(`/apps/${APP_NAME}/api/v1/settings`);
		const result = await axios.post(url, settings);

		if (result.status === 200) {
			return result.data;
		}
		return {
			success: false,
			error: 'Failed to save settings'
		};
	} catch (e) {
		console.error('Error saving settings:', e);
		return {
			success: false,
			error: (e as Error).message || 'Unknown error'
		};
	}
}
