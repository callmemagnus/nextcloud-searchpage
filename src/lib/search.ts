// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import axios from '@nextcloud/axios';
import { generateOcsUrl } from '@nextcloud/router';
import type { Provider } from '../states/providers';
import TimedCache from './TimedCache';

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

const cache = new TimedCache<Promise<SearchResult | null>>(30_000);

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

	if (!cache.has(url)) {
		cache.set(
			url,
			axios.get(url).then((result) => {
				if (result.data.ocs?.meta?.statuscode === 200) {
					return {
						...result.data.ocs.data,
						providerId
					} as SearchResult;
				}
				return null;
			})
		);
	}

	return cache.get(url)!;
}

const disfunctionalProviders = [
	// Is broken, always returns []
	'users'
];

export async function fetchProviders() {
	try {
		const url = generateOcsUrl('search/providers');
		const result = await axios.get(url);

		if (result.data.ocs.meta.statuscode === 200) {
			const providers: Provider[] = result.data.ocs.data;
			return providers.filter(({ id }) => !disfunctionalProviders.includes(id));
		}
		return [];
	} catch (e) {
		console.error((e as Error).message || e);
		return [];
	}
}
