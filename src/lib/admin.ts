import axios from '@nextcloud/axios';
import { generateOcsUrl } from '@nextcloud/router';
import { PROVIDER_ALL } from '../constants';
import { clog } from './log';

type Settings = {
	enabledProviders: string[];
	// TODO groups
};

export async function readSettings(): Promise<Settings> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				enabledProviders: [PROVIDER_ALL]
			});
		}, 500);
	});
}

type Result = {
	status: 'success' | 'error';
	error?: 'string';
};

export async function writeSettings(settings: Settings) {
	clog('writeSettings', settings);
}

export async function readGroups(): Promise<string[]> {
	const url = generateOcsUrl('cloud/groups');
	const result = await axios.get(url);

	if (result.data.ocs.meta.statuscode === 200) {
		clog('groups', result.data.ocs.data);
		return result.data.ocs.data.groups;
	} else {
		return [];
	}
}
