<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { onMount } from 'svelte';
	import { derived, get } from 'svelte/store';
	import SearchBox from './components/Header/SearchBox.svelte';
	import SearchResults from './components/SearchResults.svelte';
	import { APP_NAME, PROVIDER_ALL } from './constants';
	import providers from './states/providers';
	import { providerIds, terms } from './states/query';

	let error = false;
	let lastSearch = 0;
	let resultsContainer: HTMLDivElement;
	let resultsContainerHeight = 'auto';

	const selectedProviders = derived([providers, providerIds], ([$providers, $providerIds]) => {
		if ($providerIds.includes(PROVIDER_ALL)) {
			return $providers;
		}
		return $providers.filter(({ id }) => $providerIds.includes(id));
	});

	function search() {
		lastSearch = Date.now();
	}

	function clear() {
		lastSearch = 0;
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
		if (get(terms) && get(providerIds).length) {
			lastSearch = Date.now();
		}
		resize();
		window.addEventListener('resize', resize);
		return () => {
			window.removeEventListener('resize', resize);
		};
	});

	let hasTabbed = false;

	function onKeydown(event: KeyboardEvent) {
		if (event.code === 'Tab' && !hasTabbed) {
			hasTabbed = true;
		}
	}
</script>

<svelte:body on:keydown={onKeydown} />

<div class="mwb-thesearchpage {hasTabbed ? 'mwb-tabbed' : ''}">
	<h1 class="mwb-screenreader">{translate(APP_NAME, 'Search Page')}</h1>
	{#if error}
		<p>{translate(APP_NAME, 'There was an error loading the providers.')}</p>
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
		@apply w-full pt-3 px-2 h-full;
		color: var(--color-main-text);
		background-color: var(--color-main-background-blur, var(--color-main-background));
	}

	.mwb-thesearchpage__search-box {
		@apply mb-2 py-0 px-1;
	}
</style>
