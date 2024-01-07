<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { afterUpdate, createEventDispatcher, onMount } from 'svelte';
	import { searchOnProvider, type SearchEntry } from '../lib/search';

	import { APP_NAME } from '../constants';

	import type { Provider } from '../states/providers';
	import Result from './Result.svelte';

	export let provider: Provider;
	export let query: string;
	export let isAlone = false;
	export let showBack = false;

	let hasMore = true;
	let loading = true;
	let cursor = 0;
	let searchResults: SearchEntry[] | null = null;
	let button: HTMLButtonElement;

	const dispatch = createEventDispatcher();

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

			/**
			 * 3 reasons to decide there are no more results
			 * 1. no entries in present response
			 * 2. service says it's not paginated
			 * 3. cursor is = 0 (e.g. quicknotes)
			 */
			if (result.entries.length === 0 || !result.isPaginated || cursor === 0) {
				hasMore = false;
			}
		}
		loading = false;
	}

	const observer = new IntersectionObserver(
		(entries, observer) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && !loading && hasMore) {
					load(cursor);
				}
				if (!hasMore) {
					observer.disconnect();
				}
			});
		},
		{
			rootMargin: '10px',
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

		if (button && hasMore) {
			observer.observe(button);
		}
	});
</script>

<div class="mwb-provider-results" class:mwb-is-alone={isAlone}>
	<div class="mwb-header">
		<h2>{provider.name}</h2>
		{#if !isAlone}
			<small>
				<button
					type="button"
					on:click={() => dispatch('only-me')}
					title={translate(APP_NAME, 'See only results for this provider')}
					>{translate(APP_NAME, 'Show only')}</button>
			</small>
		{/if}
		{#if showBack}
			<small>
				<button
					type="button"
					on:click={() => dispatch('back')}
					title={translate(APP_NAME, 'See all providers')}>{translate(APP_NAME, 'Back')}</button>
			</small>
		{/if}
	</div>
	{#if !searchResults}
		<p>{translate(APP_NAME, 'Loading...')}</p>
	{:else}
		<div class="mwb-result-scroll">
			{#each searchResults as result}
				<div class="mwb-result-item">
					<Result {result} />
				</div>
			{:else}
				<p>{translate(APP_NAME, 'No results')}</p>
			{/each}
			{#if searchResults.length && hasMore}
				<div>
					<button bind:this={button} disabled={loading} on:click={() => load(cursor)}>
						{loading ? translate(APP_NAME, 'Loading...') : translate(APP_NAME, 'Load more...')}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style lang="less">
	.mwb-provider-results {
		@apply px-4 py-2 shadow-xl h-full w-full flex flex-col rounded-xl;
		background-color: var(--color-main-background);
	}
	.mwb-is-alone {
		@apply shadow-none px-2;
	}
	h2 {
		@apply mb-4;
	}
	/* .mwb-is-alone h2 {
		@apply text-2xl;
	} */
	.mwb-result-scroll {
		@apply overflow-y-scroll h-full flex-grow;
	}
	.mwb-is-alone .mwb-result-scroll {
		@apply h-auto overflow-auto;
	}
	.mwb-header {
		@apply flex justify-between;
	}
	small {
		@apply text-xs;
	}
	.mwb-result-item {
		@apply py-2 mb-2;

		&:hover {
			border-radius: var(--border-radius-large);
			background-color: var(--color-background-hover);
		}
	}
</style>
