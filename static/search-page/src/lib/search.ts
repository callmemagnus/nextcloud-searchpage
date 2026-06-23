// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import axios from '@nextcloud/axios';
import { generateOcsUrl } from '@nextcloud/router';
import availableProviders from '../states/availableProviders.svelte';
import queryState from '../states/query.svelte';
import TimedCache from './TimedCache';
import {
	markFilterUnsupported,
	getUnsupportedFilters,
	parseUnsupportedFilterName
} from './unsupportedFilters';
import { clog, type Provider } from '@shared/libs';

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

function buildSearchUrl(providerId: string, query: string, cursor: number): string {
	const unsupported = getUnsupportedFilters(providerId);
	const searchParam = new URLSearchParams();
	searchParam.append('term', query);
	searchParam.append('limit', String(getLimit(providerId)));
	if (cursor) {
		searchParam.append('cursor', String(cursor));
	}
	if (queryState.since && !unsupported.includes('since')) {
		const d = new Date(queryState.since + 'T00:00:00');
		searchParam.append('since', String(Math.floor(d.getTime() / 1000)));
	}
	if (queryState.until && !unsupported.includes('until')) {
		const d = new Date(queryState.until + 'T23:59:59');
		searchParam.append('until', String(Math.floor(d.getTime() / 1000)));
	}
	return generateOcsUrl(`search/providers/${providerId}/search?${searchParam}`);
}

const cache = new TimedCache<Promise<SearchResult | null>>(30_000);

async function performSearch(
	providerId: string,
	url: string,
	query: string,
	cursor: number
): Promise<SearchResult | null> {
	try {
		const result = await axios.get(url);
		if (result.data.ocs?.meta?.statuscode === 200) {
			clog(`${providerId} result search: count=${result.data.ocs.data.entries.length}`);
			return { ...result.data.ocs.data, providerId } as SearchResult;
		}
		// OCS-level error in a 200 HTTP response
		const filterName = parseUnsupportedFilterName(result.data.ocs?.data);
		if (filterName) {
			markFilterUnsupported(providerId, filterName);
			return searchOnProvider(providerId, query, cursor);
		}
		return null;
	} catch (error) {
		// HTTP-level error (axios throws on 4xx/5xx)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const filterName = parseUnsupportedFilterName((error as any)?.response?.data?.ocs?.data);
		if (filterName) {
			markFilterUnsupported(providerId, filterName);
			return searchOnProvider(providerId, query, cursor);
		}
		return null;
	}
}

export async function searchOnProvider(
	providerId: string,
	query: string,
	cursor: number
): Promise<SearchResult | null> {
	const url = buildSearchUrl(providerId, query, cursor);

	if (!cache.has(url)) {
		cache.set(url, performSearch(providerId, url, query, cursor));
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
