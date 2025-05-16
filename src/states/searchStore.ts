// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { get, writable } from 'svelte/store';
import { computeHasMore, searchOnProvider, type SearchResult } from '../lib/search';
import { providerIds } from './query';
import { clog } from '../lib/log';
import availableProviders from './availableProviders';
import { saveInSession } from '../lib/session';

export type ByProvider = {
	providerId: string;
	results: SearchResult | null;
	searching: boolean;
	terms: string;
};

type Store = {
	providerHavingResultsCount: number;
	searching: boolean;
	byProvider: Record<string, ByProvider>;
	asList: ByProvider[];
};

const INITIAL_VALUE: Store = {
	searching: false,
	byProvider: {},
	asList: [],
	providerHavingResultsCount: 0
};
const INITIAL_LOADING: Store = {
	searching: true,
	byProvider: {},
	asList: [],
	providerHavingResultsCount: 0
};

const store = writable<Store>(INITIAL_VALUE);
const { subscribe, set, update } = store;

function addResults(providerId: string, terms: string, results: SearchResult | null) {
	update((previous) => {
		const providers = get(availableProviders);
		const previousResults = previous.byProvider[providerId].results || ({} as SearchResult);
		const byProvider: ByProvider = {
			providerId,
			results: !results
				? null
				: {
						providerId,
						cursor: results.cursor,
						isPaginated: results.isPaginated,
						entries: [...(previousResults?.entries || []), ...results.entries]
					},
			terms,
			searching: false
		};
		const newState = {
			...previous,
			byProvider: {
				...previous.byProvider,
				[providerId]: byProvider
			},
			asList: providers.reduce((acc, provider) => {
				const { id } = provider;
				if (id === providerId) {
					acc.push(byProvider);
				} else if (previous.byProvider[id]) {
					acc.push(previous.byProvider[id]);
				}
				return acc;
			}, [] as ByProvider[])
		};
		return {
			...newState,
			providerHavingResultsCount: countProviderHavingResults(newState)
		};
	});
}

function markProviderAsSearching(providerId: string, terms: string) {
	update((previous) => {
		if (!previous.byProvider[providerId]) {
			const providers = get(availableProviders);
			const byProvider: ByProvider = {
				providerId,
				searching: true,
				results: null,
				terms
			};
			return {
				...previous,
				byProvider: {
					...previous.byProvider,
					[providerId]: byProvider
				},
				asList: providers.reduce((acc, provider) => {
					const { id } = provider;
					if (id === providerId) {
						acc.push(byProvider);
					} else if (previous.byProvider[id]) {
						acc.push(previous.byProvider[id]);
					}
					return acc;
				}, [] as ByProvider[])
			};
		}
		const newVersion: ByProvider = {
			...previous.byProvider[providerId],
			searching: true
		};
		return {
			...previous,
			asList: previous.asList.map((p) => (p.providerId !== providerId ? p : newVersion)),
			byProvider: {
				...previous.byProvider,
				[providerId]: newVersion
			}
		};
	});
}

async function waitForProviders() {
	if (get(availableProviders).length) {
		return;
	}
	return new Promise((resolve) => {
		availableProviders.subscribe((providers) => {
			if (providers.length) {
				resolve(null);
			}
		});
	});
}

export function countProviderHavingResults(state: Store) {
	return state.asList.reduce((count, by) => {
		if (by.results?.entries.length) {
			return count + 1;
		}
		return count;
	}, 0);
}

async function handleSearchForProvider(providerId: string, terms: string) {
	let cursor = 0;
	const currentStore = get(store);
	if (currentStore.byProvider[providerId]) {
		if (!currentStore.byProvider[providerId]?.results?.isPaginated) {
			return;
		}
		cursor = currentStore.byProvider[providerId].results?.entries.length;
	}

	markProviderAsSearching(providerId, terms);

	const results = await searchOnProvider(providerId, terms, cursor);
	addResults(providerId, terms, results);
}

async function loadMore(providerId: string) {
	const currentStore = get(store);
	if (!currentStore) {
		clog('loadMore invoked when nor prior searches, ignoring');
		return;
	}
	if (!currentStore.byProvider[providerId]) {
		clog(`loadMore invoked when nor prior searches for provider ${providerId}, ignoring...`);
		return;
	}
	if (!computeHasMore(currentStore.byProvider[providerId].results)) {
		clog('loadMore invoked when we think there are no more results,');
		return;
	}
	return handleSearchForProvider(providerId, currentStore.byProvider[providerId].terms);
}

async function startSearch(terms: string) {
	set(INITIAL_LOADING);
	await waitForProviders();
	const enabledProviderIds = get(providerIds);

	saveInSession(terms, enabledProviderIds);

	await Promise.all(enabledProviderIds.map((id) => handleSearchForProvider(id, terms)));
	update((state) => ({ ...state, searching: false }));
}

function clearSearch() {
	set(INITIAL_VALUE);
	saveInSession('', []);
}

const searchStore = { subscribe, startSearch, loadMore, clearSearch };

export default searchStore;
