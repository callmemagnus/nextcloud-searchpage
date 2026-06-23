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

export function computeHasMore(results: SearchResult | null): boolean {
	if (!results) return false;
	if (results.entries.length === 0 || !results.isPaginated || results.cursor === 0) return false;
	if (results.entries.length < results.cursor) return false;
	return true;
}

export async function searchOnProvider(
	providerId: string,
	query: string,
	cursor: number,
	limit = 10
): Promise<SearchResult | null> {
	const params = new URLSearchParams({ term: query, limit: String(limit) });
	if (cursor) params.append('cursor', String(cursor));
	const url = generateOcsUrl(`search/providers/${providerId}/search?${params}`);
	try {
		const result = await axios.get(url);
		if (result.data.ocs?.meta?.statuscode === 200) {
			return { ...result.data.ocs.data, providerId } as SearchResult;
		}
		return null;
	} catch {
		return null;
	}
}
