import { USER_GROUPS_URL } from '$/constants';
import axios from '@nextcloud/axios';
import { generateOcsUrl } from '@nextcloud/router';

export async function readGroups(): Promise<string[]> {
	const url = generateOcsUrl('cloud/groups');
	const result = await axios.get(url);

	if (result.data.ocs.meta.statuscode === 200) {
		return result.data.ocs.data.groups;
	} else {
		return [];
	}
}

export async function userGroups(): Promise<string[]> {
	const currentUser = OC.getCurrentUser();
	if (!currentUser?.uid) {
		return [];
	}

	const url = generateOcsUrl(USER_GROUPS_URL(currentUser.uid));

	const result = await axios.get(url);

	if (result.data.ocs.meta.statuscode === 200) {
		return result.data.ocs.data.groups as string[];
	} else {
		return [];
	}
}
