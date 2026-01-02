<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later
	import type { ByProvider } from '../states/searchStore.svelte';
	import searchStore from '../states/searchStore.svelte';
	import queryState from '../states/query.svelte';
	import { translate } from '@nextcloud/l10n';
	import { APP_NAME } from '../constants';
	import Result from './Result.svelte';
	import availableProviders from '../states/availableProviders.svelte';
	import { computeHasMore, type SearchEntry } from '../lib/search';

	type Props = ByProvider;

	let { searching, results, providerId }: Props = $props();

	let button = $state<HTMLButtonElement | undefined>();

	let hasMore = $state(false);
	let items = $state<SearchEntry[]>([]);

	$effect(() => {
		items = results?.entries ?? [];
		hasMore = computeHasMore(results);
	});

	const observer = new IntersectionObserver(
		(entries, observer) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && !searching && hasMore) {
					searchStore.loadMore(providerId);
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

	// Derive flags from reactive state
	let flags = $derived(() => {
		const isolated = queryState.isolatedProvider;
		const showIsolate = !isolated && searchStore.providerHavingResultsCount > 1;
		const isAlone = isolated === providerId || searchStore.providerHavingResultsCount === 1;
		const showBack = isAlone && searchStore.providerHavingResultsCount > 1;
		return { showIsolate, isAlone, showBack };
	});

	let provider = $derived(availableProviders.providers.find(({ id }) => id === providerId));

	$effect(() => {
		observer.disconnect();

		if (button) {
			observer.observe(button);
		}
		return () => {
			observer.disconnect();
		};
	});

	function onlyMe() {
		queryState.isolatedProvider = providerId;
	}

	function back() {
		queryState.isolatedProvider = null;
	}
</script>

{#if provider}
	{#if searching || items.length > 0}
		<div class="mwb-results-for-provider" class:mwb-is-alone={flags().isAlone}>
			<div class="mwb-header">
				<h2>{provider.name}</h2>
				{#if flags().showIsolate}
					<span class="mwb-header-button">
						<button
							type="button"
							onclick={() => onlyMe()}
							title={translate(APP_NAME, 'See only results for this provider')}
							>{translate(APP_NAME, 'Show only')}</button>
					</span>
				{/if}
				{#if flags().showBack}
					<span class="mwb-header-button">
						<button
							type="button"
							onclick={() => back()}
							title={translate(APP_NAME, 'See all providers')}
							>{translate(APP_NAME, 'Back')}</button>
					</span>
				{/if}
			</div>
			{#if items.length}
				<div class="mwb-result-scroll">
					{#each items as result (JSON.stringify(result))}
						<div class="mwb-result-item">
							<Result {result} />
						</div>
					{:else}
						<p>{translate(APP_NAME, 'No results')}</p>
					{/each}
					{#if hasMore}
						<div>
							<button
								bind:this={button}
								disabled={searching}
								onclick={() => searchStore.loadMore(providerId)}>
								{searching
									? translate(APP_NAME, 'Loading...')
									: translate(APP_NAME, 'Load more...')}
							</button>
						</div>
					{/if}
				</div>
			{:else if searching}
				<p class="mwb-loading">{translate(APP_NAME, 'Loading...')}</p>
			{/if}
		</div>
	{/if}
{/if}

<style lang="postcss">
	@reference "tailwindcss";

	.mwb-results-for-provider {
		@apply px-0 py-2 shadow-xl h-full w-full flex flex-col rounded-xl;
		background-color: var(--color-main-background);
	}

	.mwb-loading {
		@apply ml-4;
	}

	.mwb-is-alone {
		@apply shadow-none px-2;
	}

	h2 {
		@apply ml-4 mb-2 mt-0;
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

		.mwb-header-button {
			@apply text-xs mr-2;
		}
	}

	.mwb-result-item {
		@apply py-2 mb-2 pl-2;

		&:hover {
			border-radius: var(--border-radius-large);
			background-color: var(--color-background-hover);
		}
	}
</style>
