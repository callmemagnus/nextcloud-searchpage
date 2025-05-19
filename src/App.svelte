<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { onMount } from 'svelte';
	import SearchBox from './components/Header/SearchBox.svelte';
	import SearchResults from './components/SearchResults.svelte';
	import { APP_NAME } from './constants';

	let error = $state(false);
	let resultsContainer: HTMLDivElement | undefined = $state();
	let resultsContainerHeight = $state('auto');

	function resize() {
		if (resultsContainer) {
			const box = resultsContainer.getBoundingClientRect();
			const availableHeight = window.innerHeight;
			resultsContainerHeight = `${availableHeight - box.top - 50}px`;
		}
	}

	onMount(() => {
		resize();
		window.addEventListener('resize', resize);
		return () => {
			window.removeEventListener('resize', resize);
		};
	});

	let hasTabbed = $state(false);

	function onKeydown(event: KeyboardEvent) {
		if (event.code === 'Tab' && !hasTabbed) {
			hasTabbed = true;
		}
	}
</script>

<svelte:body onkeydown={onKeydown} />

<div class="mwb-thesearchpage {hasTabbed ? 'mwb-tabbed' : ''}">
	<h1 class="mwb-screenreader">{translate(APP_NAME, 'Search Page')}</h1>
	{#if error}
		<p>{translate(APP_NAME, 'There was an error loading the providers.')}</p>
	{/if}
	<div class="mwb-thesearchpage__search-box">
		<SearchBox />
	</div>
	<div
		class="mwb-thesearchpage-results"
		bind:this={resultsContainer}
		style="height: {resultsContainerHeight}">
		<SearchResults />
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.mwb-thesearchpage {
		@apply w-full pt-3 px-2 h-full scroll-m-3 overflow-y-scroll;
		color: var(--color-main-text);
		background-color: var(--color-main-background-blur, var(--color-main-background));
	}

	.mwb-thesearchpage__search-box {
		@apply mb-2 py-0 px-1;
	}
</style>
