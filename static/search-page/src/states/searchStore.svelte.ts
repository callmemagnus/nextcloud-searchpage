// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { computeHasMore, searchOnProvider, type SearchResult } from '../lib/search';
import queryState from './query.svelte';
import { clog } from '@shared/libs';
import availableProviders from './availableProviders.svelte';
import { saveInSession } from '../lib/session';

export type ByProvider = {
	providerId: string;
	results: SearchResult | null;
	searching: boolean;
	terms: string;
};

export type SearchStoreState = {
	providerHavingResultsCount: number;
	searching: boolean;
	byProvider: Record<string, ByProvider>;
	asList: ByProvider[];
};

const INITIAL_VALUE: SearchStoreState = {
	searching: false,
	byProvider: {},
	asList: [],
	providerHavingResultsCount: 0
};

export function countProviderHavingResults(state: SearchStoreState) {
	return state.asList.reduce((count, by) => {
		if (by.results?.entries.length) {
			return count + 1;
		}
		return count;
	}, 0);
}

class SearchStore {
	searching = $state(false);
	byProvider = $state<Record<string, ByProvider>>({});
	asList = $state<ByProvider[]>([]);
	providerHavingResultsCount = $state(0);

	async loadMore(providerId: string) {
		if (!this.byProvider[providerId]) {
			clog(`loadMore invoked when no prior searches for provider ${providerId}, ignoring...`);
			return;
		}
		if (!computeHasMore(this.byProvider[providerId].results)) {
			clog('loadMore invoked when we think there are no more results,');
			return;
		}
		return this.handleSearchForProvider(providerId, this.byProvider[providerId].terms);
	}

	async startSearch(terms: string) {
		this.searching = true;
		this.byProvider = {};
		this.asList = [];
		this.providerHavingResultsCount = 0;

		await this.waitForProviders();
		const enabledProviderIds = queryState.providerIds;

		saveInSession(terms, enabledProviderIds);

		await Promise.all(enabledProviderIds.map((id) => this.handleSearchForProvider(id, terms)));
		this.searching = false;
	}

	clearSearch() {
		this.searching = INITIAL_VALUE.searching;
		this.byProvider = INITIAL_VALUE.byProvider;
		this.asList = INITIAL_VALUE.asList;
		this.providerHavingResultsCount = INITIAL_VALUE.providerHavingResultsCount;
		saveInSession('', []);
	}

	private addResults(providerId: string, terms: string, results: SearchResult | null) {
		const providers = availableProviders.providers;
		const previousResults = this.byProvider[providerId]?.results || ({} as SearchResult);
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

		this.byProvider = {
			...this.byProvider,
			[providerId]: byProvider
		};

		this.asList = providers.reduce((acc, provider) => {
			const { id } = provider;
			if (id === providerId) {
				acc.push(byProvider);
			} else if (this.byProvider[id]) {
				acc.push(this.byProvider[id]);
			}
			return acc;
		}, [] as ByProvider[]);

		this.providerHavingResultsCount = countProviderHavingResults({
			searching: this.searching,
			byProvider: this.byProvider,
			asList: this.asList,
			providerHavingResultsCount: this.providerHavingResultsCount
		});
	}

	private markProviderAsSearching(providerId: string, terms: string) {
		if (!this.byProvider[providerId]) {
			const providers = availableProviders.providers;
			const byProvider: ByProvider = {
				providerId,
				searching: true,
				results: null,
				terms
			};

			this.byProvider = {
				...this.byProvider,
				[providerId]: byProvider
			};

			this.asList = providers.reduce((acc, provider) => {
				const { id } = provider;
				if (id === providerId) {
					acc.push(byProvider);
				} else if (this.byProvider[id]) {
					acc.push(this.byProvider[id]);
				}
				return acc;
			}, [] as ByProvider[]);

			return;
		}

		const newVersion: ByProvider = {
			...this.byProvider[providerId],
			searching: true
		};

		this.byProvider = {
			...this.byProvider,
			[providerId]: newVersion
		};

		this.asList = this.asList.map((p) => (p.providerId !== providerId ? p : newVersion));
	}

	private async waitForProviders() {
		if (availableProviders.providers.length) {
			return;
		}
		return new Promise((resolve) => {
			const checkInterval = setInterval(() => {
				if (availableProviders.providers.length) {
					clearInterval(checkInterval);
					resolve(null);
				}
			}, 50);
		});
	}

	private async handleSearchForProvider(providerId: string, terms: string) {
		let cursor = 0;
		if (this.byProvider[providerId]) {
			if (!this.byProvider[providerId]?.results?.isPaginated) {
				return;
			}
			cursor = this.byProvider[providerId].results?.entries.length || 0;
		}

		this.markProviderAsSearching(providerId, terms);

		const results = await searchOnProvider(providerId, terms, cursor);
		this.addResults(providerId, terms, results);
	}
}

const searchStore = new SearchStore();

export default searchStore;
