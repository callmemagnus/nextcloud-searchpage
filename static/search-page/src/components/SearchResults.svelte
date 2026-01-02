<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later
	import { translate } from '@nextcloud/l10n';
	import { onMount } from 'svelte';
	import { APP_NAME } from '../constants';
	import availableProviders from '../states/availableProviders.svelte';
	import searchStore from '../states/searchStore.svelte';
	import DynamicGrid from './DynamicGrid.svelte';
	import ResultsForProvider from './ResultsForProvider.svelte';
	import { readFromHash, removeFromHash } from '../lib/hash';
	import queryState from '../states/query.svelte';

	let focusedProvider: string | null = $state(null);
	let providersWithNoResults: string[] = $state([]);

	// Derive displayedProviders from reactive state
	let displayedProviders = $derived(
		availableProviders.providers.filter(({ id }) => {
			if (focusedProvider) {
				return focusedProvider === id;
			}
			return !providersWithNoResults.includes(id);
		})
	);

	// Derive noResult from reactive state
	let noResult = $derived(() => {
		if (searchStore.asList.length === 0) {
			return false;
		}
		if (searchStore.searching) {
			return false;
		}
		if (searchStore.asList.some((b) => b.searching)) {
			return false;
		}
		if (searchStore.asList.some((b) => b.results?.entries.length)) {
			return false;
		}
		return true;
	});

	// Derive providersToShow from reactive state
	let providersToShow = $derived(() => {
		const isolated = queryState.isolatedProvider;
		if (!searchStore.searching && !searchStore.providerHavingResultsCount) {
			return [];
		}
		if (isolated) {
			return [searchStore.byProvider[isolated]];
		}
		return searchStore.asList.filter((b) => b.searching || b.results?.entries?.length);
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
</script>

<div class="mwb-search-results">
	{#if noResult()}
		<p class="pl-4">{translate(APP_NAME, 'No results')}</p>
	{:else if providersToShow().length}
		<DynamicGrid items={providersToShow()} {minCellHeight} {minCellWidth}>
			{#snippet itemSnippet(byProvider)}
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
