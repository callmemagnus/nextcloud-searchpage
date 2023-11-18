// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PROVIDER_ALL } from '$/constants';
import type { Provider } from '$states/providers';
import axios from '@nextcloud/axios';
import { generateOcsUrl } from '@nextcloud/router';
import TimedCache from './TimedCache';
import { readGroupSettings, readSettings } from './config';
import { userGroups } from './groups';

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

const dysfunctionalProviders = [
	// Is broken, always returns []
	'users'
];

export async function fetchProviders(): Promise<Provider[]> {
	try {
		const url = generateOcsUrl('search/providers');
		const result = await axios.get(url);

		if (result.data.ocs.meta.statuscode === 200) {
			const providers: Provider[] = result.data.ocs.data;
			return providers.filter(({ id }) => !dysfunctionalProviders.includes(id));
		}
		return [];
	} catch (e) {
		console.error((e as Error).message || e);
		return [];
	}
}

export async function fetchUsableProviders() {
	const [providers, settings, ...groupSettings] = await Promise.all([
		fetchProviders(),
		readSettings(),
		...(await userGroups()).map((group) => readGroupSettings(group))
	]);

	const enabledProviders = [settings, ...groupSettings].reduce((acc, settings) => {
		settings.enabledProviders?.forEach((provider) => acc.add(provider));
		return acc;
	}, new Set<string>());

	return Array.from(
		providers.filter((provider) => {
			if (enabledProviders.has(PROVIDER_ALL)) {
				return true;
			}
			if (enabledProviders.has(provider.id)) {
				return true;
			}
			return false;
		})
	);
}
