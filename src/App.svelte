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
	let me: HTMLDivElement;

	const selectedProviders = derived([providers, providerId], ([$providers, $providerId]) =>
		$providers.filter(({ id }) => $providerId === PROVIDER_ALL || id === $providerId)
	);

	const observer = new MutationObserver(() => resize);

	let resultsContainer: HTMLDivElement;
	let resultsContainerHeight: string = 'auto';

	function resize() {
		if (resultsContainer) {
			const box = resultsContainer.getBoundingClientRect();
			const availableHeight = window.innerHeight;
			resultsContainerHeight = `${availableHeight - box.top - 15}px`;
		}
	}

	function search() {
		lastSearch = Date.now();
	}

	function clear() {
		lastSearch = 0;
		providerId.set(PROVIDER_ALL);
	}

	onMount(() => {
		providers.load();
		observer.observe(me, {
			subtree: true,
			childList: true,
			characterData: true,
			attributes: true
		});
		window.addEventListener('resize', resize);
		resize();
		if (get(terms) && get(providerId)) {
			lastSearch = Date.now();
		}

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', resize);
		};
	});
</script>

<div class="mwb-thesearchpage" bind:this={me}>
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

<style lang="scss">
	.mwb-thesearchpage {
		z-index: 10;
		width: 100%;
		padding: 10px;
		color: var(--color-main-text);
		background-color: var(--color-main-background-blur, var(--color-main-background));
	}

	.mwb-thesearchpage__search-box {
		margin-bottom: 20px;
		padding: 0 5px;
	}

	h1 {
		font-size: 2rem;
		font-weight: bold;
		margin-top: 10px;
		margin-bottom: 20px;
	}

	.mwb-thesearchpage-results {
		overflow-x: scroll;
		padding: 5px;
		background-color: var(--color-main-background-blur, var(--color-main-background));
	}
</style>
