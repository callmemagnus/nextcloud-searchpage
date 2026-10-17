// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	providers: { providers: [{ id: 'files' }, { id: 'mail' }, { id: 'notes' }] },
	query: { providerIds: ['files', 'mail', 'notes'] },
	searchOnProvider: vi.fn()
}));

vi.mock('@nextcloud/axios', () => ({ default: { get: vi.fn() } }));
vi.mock('@nextcloud/router', () => ({ generateOcsUrl: vi.fn((p: string) => p) }));
vi.mock('../../src/states/availableProviders.svelte', () => ({ default: mocks.providers }));
vi.mock('../../src/states/query.svelte', () => ({ default: mocks.query }));
vi.mock('../../src/lib/session', () => ({ saveInSession: vi.fn() }));
vi.mock('@shared/libs', () => ({ clog: vi.fn() }));
vi.mock('../../src/lib/search', async (importOriginal) => ({
	...(await importOriginal<typeof import('../../src/lib/search')>()),
	searchOnProvider: mocks.searchOnProvider
}));

import searchStore from '../../src/states/searchStore.svelte';
import type { SearchResult } from '../../src/lib/search';

function page(providerId: string, count: number, cursor: number, isPaginated = true): SearchResult {
	return {
		providerId,
		cursor,
		isPaginated,
		entries: Array.from({ length: count }, (_, i) => ({
			title: `${providerId}-${cursor - count + i}`
		}))
	} as SearchResult;
}

beforeEach(() => {
	mocks.searchOnProvider.mockReset();
	mocks.query.providerIds = ['files', 'mail', 'notes'];
	searchStore.clearSearch();
});

describe('startSearch', () => {
	it('queries every enabled provider and lists them in provider order', async () => {
		mocks.query.providerIds = ['notes', 'files'];
		mocks.searchOnProvider.mockImplementation(async (id: string) => page(id, 2, 2));

		await searchStore.startSearch('foo');

		expect(mocks.searchOnProvider).toHaveBeenCalledWith('notes', 'foo', 0);
		expect(mocks.searchOnProvider).toHaveBeenCalledWith('files', 'foo', 0);
		expect(searchStore.asList.map((p) => p.providerId)).toEqual(['files', 'notes']);
		expect(searchStore.providerHavingResultsCount).toBe(2);
		expect(searchStore.searching).toBe(false);
	});

	it('does not count failed or empty providers as having results', async () => {
		mocks.searchOnProvider.mockImplementation(async (id: string) =>
			id === 'files' ? page(id, 1, 1) : id === 'mail' ? null : page(id, 0, 0)
		);

		await searchStore.startSearch('foo');

		expect(searchStore.byProvider.mail.results).toBeNull();
		expect(searchStore.providerHavingResultsCount).toBe(1);
	});

	it('clears results of the previous search', async () => {
		mocks.searchOnProvider.mockImplementation(async (id: string) => page(id, 2, 2));
		await searchStore.startSearch('foo');
		mocks.query.providerIds = ['files'];

		await searchStore.startSearch('bar');

		expect(Object.keys(searchStore.byProvider)).toEqual(['files']);
		expect(searchStore.byProvider.files.terms).toBe('bar');
	});

	it('drops late results of a search that was replaced', async () => {
		mocks.query.providerIds = ['files'];
		let resolveOld!: (r: SearchResult) => void;
		mocks.searchOnProvider.mockImplementation((id: string, terms: string) =>
			terms === 'old'
				? new Promise((resolve) => (resolveOld = resolve))
				: Promise.resolve(page(id, 1, 1))
		);

		const oldSearch = searchStore.startSearch('old');
		await vi.waitFor(() => expect(mocks.searchOnProvider).toHaveBeenCalledTimes(1));
		await searchStore.startSearch('new');
		resolveOld(page('files', 2, 2));
		await oldSearch;

		expect(searchStore.byProvider.files.terms).toBe('new');
		expect(searchStore.byProvider.files.results?.entries).toHaveLength(1);
		expect(searchStore.searching).toBe(false);
	});

	it('drops late results after the search was cleared', async () => {
		mocks.query.providerIds = ['files'];
		let resolveOld!: (r: SearchResult) => void;
		mocks.searchOnProvider.mockReturnValueOnce(new Promise((resolve) => (resolveOld = resolve)));

		const oldSearch = searchStore.startSearch('old');
		await vi.waitFor(() => expect(mocks.searchOnProvider).toHaveBeenCalledTimes(1));
		searchStore.clearSearch();
		resolveOld(page('files', 2, 2));
		await oldSearch;

		expect(searchStore.asList).toEqual([]);
	});
});

describe('loadMore', () => {
	it('appends the next page, requesting from the current entry count', async () => {
		mocks.query.providerIds = ['files'];
		mocks.searchOnProvider.mockResolvedValueOnce(page('files', 2, 2));
		await searchStore.startSearch('foo');

		mocks.searchOnProvider.mockResolvedValueOnce(page('files', 2, 4));
		await searchStore.loadMore('files');

		expect(mocks.searchOnProvider).toHaveBeenLastCalledWith('files', 'foo', 2);
		expect(searchStore.byProvider.files.results?.entries).toHaveLength(4);
		expect(searchStore.byProvider.files.results?.cursor).toBe(4);
		expect(searchStore.byProvider.files.searching).toBe(false);
	});

	it('does nothing for a provider that is not paginated', async () => {
		mocks.query.providerIds = ['files'];
		mocks.searchOnProvider.mockResolvedValueOnce(page('files', 2, 2, false));
		await searchStore.startSearch('foo');

		await searchStore.loadMore('files');

		expect(mocks.searchOnProvider).toHaveBeenCalledTimes(1);
	});

	it('does nothing for a provider that was never searched', async () => {
		await searchStore.loadMore('files');

		expect(mocks.searchOnProvider).not.toHaveBeenCalled();
	});
});
