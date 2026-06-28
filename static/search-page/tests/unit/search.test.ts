// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it, vi } from 'vitest';

// Mock all modules that have Nextcloud / Svelte runtime dependencies so they
// never execute their module-level side effects during unit tests.
vi.mock('@nextcloud/axios', () => ({ default: { get: vi.fn() } }));
vi.mock('@nextcloud/router', () => ({
	generateOcsUrl: vi.fn((path: string) => `/ocs/v2.php/${path}`)
}));
vi.mock('../../src/states/availableProviders.svelte', () => ({
	default: { providers: [] }
}));
vi.mock('../../src/states/query.svelte', () => ({
	default: { since: '', until: '', isAllSelected: true }
}));
vi.mock('@shared/libs', () => ({
	clog: vi.fn(),
	APP_NAME: 'thesearchpage',
	fetchProviders: vi.fn()
}));
vi.mock('../../src/lib/unsupportedFilters', () => ({
	markFilterUnsupported: vi.fn(),
	getUnsupportedFilters: vi.fn(() => []),
	parseUnsupportedFilterName: vi.fn()
}));

import { computeHasMore, type SearchResult } from '../../src/lib/search';

function makeResult(overrides: Partial<SearchResult>): SearchResult {
	return {
		providerId: 'test',
		isPaginated: true,
		cursor: 10,
		entries: Array(10).fill({}),
		...overrides
	};
}

describe('computeHasMore', () => {
	it('returns false for null', () => {
		expect(computeHasMore(null)).toBe(false);
	});

	it('returns false when entries is empty', () => {
		expect(computeHasMore(makeResult({ entries: [] }))).toBe(false);
	});

	it('returns false when the provider is not paginated', () => {
		expect(computeHasMore(makeResult({ isPaginated: false }))).toBe(false);
	});

	it('returns false when cursor is 0', () => {
		expect(computeHasMore(makeResult({ cursor: 0 }))).toBe(false);
	});

	it('returns false when fewer entries were returned than the cursor indicates', () => {
		// 5 results back but cursor says 10 → short page → no more
		expect(computeHasMore(makeResult({ entries: Array(5).fill({}), cursor: 10 }))).toBe(false);
	});

	it('returns true when entries count equals the cursor (full page received)', () => {
		expect(computeHasMore(makeResult({ entries: Array(10).fill({}), cursor: 10 }))).toBe(true);
	});

	it('returns true when entries count exceeds the cursor', () => {
		expect(computeHasMore(makeResult({ entries: Array(15).fill({}), cursor: 10 }))).toBe(true);
	});
});
