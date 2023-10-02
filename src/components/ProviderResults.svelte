<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { afterUpdate, createEventDispatcher, onMount } from 'svelte';
	import { searchOnProvider, type SearchEntry } from '../lib/search';

	import { _t } from '../lib/translate';
	import type { Provider } from '../states/providers';
	import Result from './Result.svelte';

	export let provider: Provider;
	export let query: string;
	export let isAlone = false;

	let hasMore = true;
	let loading = true;
	let cursor = 0;
	let searchResults: SearchEntry[] | null = null;
	let button: HTMLButtonElement;
	const dispatch = createEventDispatcher();

	$: showMe = loading || (searchResults ? Boolean(searchResults.length) || isAlone : isAlone);

	async function load(oldCursor: number) {
		loading = true;
		const result = await searchOnProvider(provider.id, query, oldCursor);
		if (result) {
			if (!searchResults) {
				searchResults = [...result.entries];
			} else {
				searchResults = [...searchResults, ...result.entries];
			}

			if (!searchResults.length) {
				dispatch('no-result');
			}

			cursor = result.cursor;
			if (searchResults.length < cursor || !result.isPaginated) {
				hasMore = false;
			}
		}
		loading = false;
	}

	const observer = new IntersectionObserver(
		(entries, observer) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && isAlone && !loading && hasMore) {
					load(cursor);
				}
				if (!hasMore) {
					observer.disconnect();
				}
			});
		},
		{
			rootMargin: '0px',
			threshold: 1.0
		}
	);

	onMount(() => {
		if (query) {
			load(0);
		}
		return () => observer.disconnect();
	});

	afterUpdate(() => {
		observer.disconnect();

		if (button && hasMore && isAlone) {
			observer.observe(button);
		}
	});
</script>

{#if showMe}
	<div class="mwb-result-loader mwb-margin-bottom">
		<h2 class="mwb-margin-bottom">{provider.name}</h2>

		{#if !searchResults}
			<p>{_t('Loading...')}</p>
		{:else}
			{#each searchResults as result}
				<div class="mwb-margin-bottom">
					<Result {result} />
				</div>
			{:else}
				<p>{_t('No results')}</p>
			{/each}
			{#if searchResults.length && hasMore}
				<div>
					<button bind:this={button} disabled={loading} on:click={() => load(cursor)}>
						{loading ? _t('Loading...') : _t('Load more...')}
					</button>
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style lang="scss">
	h2 {
		margin-top: 5px;
	}
</style>
