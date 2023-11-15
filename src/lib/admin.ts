import axios from '@nextcloud/axios';
import type { Settings } from '../types';

import { GLOBAL_SETTINGS_URL, GROUP_SETTINGS_URL } from '$/constants';
import '@nextcloud/password-confirmation/style.css'; // Required for dialog styles
import { generateOcsUrl } from '@nextcloud/router';
import { withPrivilege } from './nextcloud';

export async function writeGlobalSettings(settings: Settings) {
	async function hasPassword() {
		const url = generateOcsUrl(GLOBAL_SETTINGS_URL);
		await axios.post(url, { value: JSON.stringify(settings) });
	}

	await withPrivilege(hasPassword);
}

export async function writeGroupSettings(group: string, settings: Settings) {
	async function hasPassword() {
		const url = generateOcsUrl(GROUP_SETTINGS_URL(group));
		await axios.post(url, { value: JSON.stringify(settings) });
	}

	await withPrivilege(hasPassword);
}
