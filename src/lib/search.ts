// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import axios from '@nextcloud/axios';
import { generateOcsUrl } from '@nextcloud/router';

export type SearchEntry = {
	thumbnailUrl: string;
	title: string;
	subline: string;
	resourceUrl: string;
	icon: string;
	rounded: boolean;
};
export type SearchResult = {
	providerId: string;
	cursor: number;
	isPaginated: boolean;
	entries: SearchEntry[];
};

export const PROVIDER_ALL = 'All';
export const PROVIDER_ALL_LABEL = 'All providers';

export async function searchOnProvider(
	providerId: string,
	query: string,
	cursor: number
): Promise<SearchResult | null> {
	const searchParam = new URLSearchParams();
	searchParam.append('term', query);
	if (cursor) {
		searchParam.append('cursor', String(cursor));
	}

	const url = generateOcsUrl(`search/providers/${providerId}/search?${searchParam}`);

	const result = await axios.get(url);

	if (result.data.ocs?.meta?.statuscode === 200) {
		return {
			...result.data.ocs.data,
			providerId
		};
	}
	return null;
}

export async function fetchProviders() {
	try {
		const url = generateOcsUrl('search/providers');
		const result = await axios.get(url);

		if (result.data.ocs.meta.statuscode === 200) {
			return result.data.ocs.data;
		}
		return null;
	} catch (e) {
		console.error((e as Error).message || e);
		return null;
	}
}
