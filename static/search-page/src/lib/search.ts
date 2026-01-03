// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import axios from '@nextcloud/axios';
import { generateOcsUrl } from '@nextcloud/router';
import availableProviders from '../states/availableProviders.svelte';
import TimedCache from './TimedCache';
import { clog, type Provider } from '@shared/libs';

// Build limits map from available providers
function getLimit(providerId: string): number {
	const provider = availableProviders.providers.find((p) => p.id === providerId);
	return provider?.limit ?? 10;
}

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

export function computeHasMore(results: SearchResult | null): boolean {
	if (!results) {
		return false;
	}
	/**
	 * 3 reasons to decide there are no more results
	 * 1. no entries in present response
	 * 2. service says it's not paginated
	 * 3. cursor is = 0 (e.g. quicknotes)
	 */
	if (results.entries.length === 0 || !results.isPaginated || results.cursor === 0) {
		return false;
	}
	if (results.entries.length < results.cursor) {
		return false;
	}
	return true;
}

const cache = new TimedCache<Promise<SearchResult | null>>(30_000);

export async function searchOnProvider(
	providerId: string,
	query: string,
	cursor: number
): Promise<SearchResult | null> {
	const searchParam = new URLSearchParams();
	searchParam.append('term', query);
	// Use provider-specific limit from settings, fallback to 10
	const limit = getLimit(providerId);
	searchParam.append('limit', String(limit));
	if (cursor) {
		searchParam.append('cursor', String(cursor));
	}

	const url = generateOcsUrl(`search/providers/${providerId}/search?${searchParam}`);

	if (!cache.has(url)) {
		cache.set(
			url,
			axios.get(url).then((result) => {
				if (result.data.ocs?.meta?.statuscode === 200) {
					clog(
						`${providerId} result search: count=${result.data.ocs.data.entries.length}`
					);
					return {
						...result.data.ocs.data,
						providerId
					} as SearchResult;
				}
				return null;
			})
		);
	} else {
		clog(`${providerId} result search in cache`);
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
