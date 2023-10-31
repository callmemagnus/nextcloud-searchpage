<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import SearchBox from './components/SearchBox.svelte';
	import SearchResults from './components/SearchResults.svelte';
	import { PROVIDER_ALL } from './lib/search';
	import { _t } from './lib/translate';
	import providers from './states/providers';
	import { providerId, terms } from './states/query';

	let error = false;
	let lastSearch = 0;
	let resultsContainer: HTMLDivElement;
	let resultsContainerHeight = 'auto';

	const selectedProviders = derived([providers, providerId], ([$providers, $providerId]) =>
		$providers.filter(({ id }) => $providerId === PROVIDER_ALL || id === $providerId)
	);

	function search() {
		lastSearch = Date.now();
	}

	function clear() {
		lastSearch = 0;
		providerId.set(PROVIDER_ALL);
	}

	function resize() {
		if (resultsContainer) {
			const box = resultsContainer.getBoundingClientRect();
			const availableHeight = window.innerHeight;
			resultsContainerHeight = `${availableHeight - box.top - 10}px`;
		}
	}

	onMount(() => {
		providers.load();
		if (get(terms) && get(providerId)) {
			lastSearch = Date.now();
		}
		resize();
		window.addEventListener('resize', resize);
		return () => {
			window.removeEventListener('resize', resize);
		};
	});
</script>

<div class="mwb-thesearchpage">
	<h1>{_t('Search')}</h1>
	{#if error}
		<p>{_t('There was an error loading the providers.')}</p>
	{/if}
	<div class="mwb-thesearchpage__search-box">
		<SearchBox on:search={search} on:clear={clear} />
	</div>
	<div
		class="mwb-thesearchpage-results"
		bind:this={resultsContainer}
		style="height: {resultsContainerHeight}">
		{#if lastSearch && $selectedProviders.length}
			{#key lastSearch}
				<SearchResults providers={$selectedProviders} />
			{/key}
		{/if}
	</div>
</div>

<style>
	.mwb-thesearchpage {
		@apply w-full pt-2 px-2 h-full;
		color: var(--color-main-text);
		background-color: var(--color-main-background-blur, var(--color-main-background));
	}

	.mwb-thesearchpage__search-box {
		@apply mb-2 py-0 px-1;
	}

	h1 {
		@apply text-3xl font-bold mt-2 ml-2 mb-2;
	}
</style>
