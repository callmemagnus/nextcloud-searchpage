<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later
	import {translate} from '@nextcloud/l10n';
	import {onMount} from 'svelte';
	import {get} from 'svelte/store';
	import {APP_NAME} from '../constants';
	import type {Provider} from '../states/availableProviders';
	import availableProviders from '../states/availableProviders';
	import searchStore, {type ByProvider} from '../states/searchStore';
	import DynamicGrid from './DynamicGrid.svelte';
	import ResultsForProvider from './ResultsForProvider.svelte';
	import {readFromHash, removeFromHash} from '../lib/hash';
	import {isolatedProvider} from '../states/query';

	let displayedProviders: Provider[] = $state([]);

	let focusedProvider: string | null = $state(null);
	let providersWithNoResults: string[] = $state([]);

	let noResult = $state(false);

	onMount(() => {
		const providerIdInHash = readFromHash('providerId');
		if (providerIdInHash) {
			if (displayedProviders.some(({id}) => id === providerIdInHash)) {
				focusedProvider = providerIdInHash;
			} else {
				removeFromHash('providerId');
			}
		}

		const unsubscribe = searchStore.subscribe((state) => {
			if (state.asList.length === 0) {
				noResult = false;
			} else if (state.searching) {
				noResult = false;
			} else if (state.asList.some((b) => b.searching)) {
				noResult = false;
			} else if (state.asList.some((b) => b.results?.entries.length)) {
				noResult = false;
			} else {
				noResult = true;
			}
		});

		return () => {
			unsubscribe();
		};
	});

	const minCellWidth = 400;
	const minCellHeight = 450;

	displayedProviders = get(availableProviders).filter(({id}) => {
		if (focusedProvider) {
			return focusedProvider === id;
		}
		return !providersWithNoResults.includes(id);
	});

	function shoudWeShow(by: ByProvider) {
		if (by.searching) {
			return true;
		}
		if (by.results?.entries.length) {
			return true;
		}
		return false;
	}
</script>

<div class="mwb-search-results mr-0 md:mr-4">
	{#if noResult}
		<p class="pl-2">{translate(APP_NAME, 'No results')}</p>
	{:else if $searchStore.asList.length}
		<DynamicGrid
			items={$searchStore.asList
				.filter((by) => $isolatedProvider === by.providerId || !$isolatedProvider)
				.filter((by) => shoudWeShow(by))}
			{minCellHeight}
			{minCellWidth}>
			{#snippet itemSnippet(byProvider: ByProvider)}
				{#key byProvider.providerId}
					{#if $isolatedProvider === byProvider.providerId || !$isolatedProvider}
						<ResultsForProvider {...byProvider}/>
					{/if}
				{/key}
			{/snippet}
		</DynamicGrid>
	{/if}
</div>
