<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later
	import { translate } from '@nextcloud/l10n';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import { APP_NAME } from '../constants';
	import type { Provider } from '../states/availableProviders';
	import availableProviders from '../states/availableProviders';
	import searchStore, { type ByProvider } from '../states/searchStore';
	import DynamicGrid from './DynamicGrid.svelte';
	import ResultsForProvider from './ResultsForProvider.svelte';
	import { readFromHash, removeFromHash } from '../lib/hash';
	import { isolatedProvider } from '../states/query';

	let displayedProviders: Provider[] = $state([]);
	let focusedProvider: string | null = $state(null);
	let providersWithNoResults: string[] = $state([]);

	let noResult = derived(searchStore, (state) => {
		if (state.asList.length === 0) {
			return false;
		}
		if (state.searching) {
			return false;
		}
		if (state.asList.some((b) => b.searching)) {
			return false;
		}
		if (state.asList.some((b) => b.results?.entries.length)) {
			return false;
		}
		return true;
	});

	onMount(() => {
		const providerIdInHash = readFromHash('providerId');
		if (providerIdInHash) {
			if (displayedProviders.some(({ id }) => id === providerIdInHash)) {
				focusedProvider = providerIdInHash;
			} else {
				removeFromHash('providerId');
			}
		}
	});

	const minCellWidth = 400;
	const minCellHeight = 450;

	displayedProviders = get(availableProviders).filter(({ id }) => {
		if (focusedProvider) {
			return focusedProvider === id;
		}
		return !providersWithNoResults.includes(id);
	});

	let providersToShow = derived([searchStore, isolatedProvider], ([state, isolated]) => {
		if (!state.searching && !state.providerHavingResultsCount) {
			return [];
		}
		if (isolated) {
			return [state.byProvider[isolated]];
		}
		return state.asList.filter((b) => b.searching || b.results?.entries?.length);
	});
</script>

<div class="mwb-search-results">
	{#if $noResult}
		<p class="pl-4">{translate(APP_NAME, 'No results')}</p>
	{:else if $providersToShow.length}
		<DynamicGrid items={$providersToShow} {minCellHeight} {minCellWidth}>
			{#snippet itemSnippet(byProvider: ByProvider)}
				<ResultsForProvider {...byProvider} />
			{/snippet}
		</DynamicGrid>
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.mwb-search-results {
		@apply mr-0 md:mr-4;
	}

	p {
		@apply pl-2;
	}
</style>
