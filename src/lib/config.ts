import axios from '@nextcloud/axios';
import { generateOcsUrl } from '@nextcloud/router';
import { GLOBAL_SETTINGS_URL, GROUP_SETTINGS_URL, PROVIDER_ALL } from '../constants';
import type { Settings } from '../types';
import { cwarn } from './log';

const DEFAULT_SETTINGS = {
	enabledProviders: [PROVIDER_ALL]
};

async function doReadSettings(url: string) {
	try {
		const result = await axios.get(url);

		if (result.data.ocs.meta.statuscode === 200) {
			const settings = result.data.ocs.data.data;

			if (settings) {
				try {
					const json = JSON.parse(settings);
					return json;
				} catch (error) {
					cwarn(`Broken settings (${url}): ${settings}`);
					return DEFAULT_SETTINGS;
				}
			} else {
				return DEFAULT_SETTINGS;
			}
		}
	} catch (e) {
		cwarn('Error while fetching settings', e);
		return DEFAULT_SETTINGS;
	}
}

export async function readSettings(): Promise<Settings> {
	const url = generateOcsUrl(GLOBAL_SETTINGS_URL);
	return doReadSettings(url);
}

export async function readGroupSettings(group: string): Promise<Settings> {
	const url = generateOcsUrl(GROUP_SETTINGS_URL(group));
	return doReadSettings(url);
}
