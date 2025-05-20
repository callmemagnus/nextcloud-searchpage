<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later
	import type {ByProvider} from '../states/searchStore';
	import searchStore from '../states/searchStore';
	import {isolatedProvider} from '../states/query';
	import {translate} from '@nextcloud/l10n';
	import {APP_NAME} from '../constants';
	import Result from './Result.svelte';
	import availableProviders, {type Provider} from '../states/availableProviders';
	import {get} from 'svelte/store';
	import {computeHasMore} from '../lib/search';
	import {onMount} from 'svelte';

	type Props = ByProvider;

	let {searching, results, providerId}: Props = $props();

	let provider = $state<Provider | undefined>();
	let isAlone = $state(false);
	let showIsolate = $state(false);
	let showBack = $state(false);
	let hasMore = $derived(computeHasMore(results));
	let button = $state<HTMLButtonElement | undefined>();
	let items = $derived(results?.entries || []);

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

	onMount(() => {
		const unsubscribeAvailable = availableProviders.subscribe((aProvider) => {
			provider = aProvider.find(({id}) => id === providerId);
		});
		const unsubscribeSearchStore = searchStore.subscribe((state) => {
			const isolated = get(isolatedProvider);
			showIsolate = !isolated && state.providerHavingResultsCount > 1;
			isAlone = isolated === providerId || state.providerHavingResultsCount === 1;
			showBack = isAlone && state.providerHavingResultsCount > 1;
		});
		const unsubscribeIsolated = isolatedProvider.subscribe((iProvider) => {
			const state = get(searchStore);
			showIsolate = !iProvider && state.providerHavingResultsCount > 1;
			isAlone = iProvider === providerId || state.providerHavingResultsCount === 1;
			showBack = state.providerHavingResultsCount > 1 && isAlone;
		});

		return () => {
			unsubscribeAvailable();
			unsubscribeSearchStore();
			unsubscribeIsolated();
			observer.disconnect();
		};
	});

	$effect(() => {
		observer.disconnect();

		if (button) {
			observer.observe(button);
		}
	});

	function onlyMe() {
		isolatedProvider.set(providerId);
	}

	function back() {
		isolatedProvider.set(null);
	}
</script>

{#if provider}
	<div class="mwb-results-for-provider" class:mwb-is-alone={isAlone}>
		<div class="mwb-header">
			<h2 class="ml-4 mb-2 mt-0">{provider.name}</h2>
			{#if showIsolate}
				<span class="mwb-header-button">
					<button
						type="button"
						onclick={() => onlyMe()}
						title={translate(APP_NAME, 'See only results for this provider')}
					>{translate(APP_NAME, 'Show only')}</button>
				</span>
			{/if}
			{#if showBack}
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
						<Result {result}/>
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
			<p class="ml-4">{translate(APP_NAME, 'Loading...')}</p>
		{/if}
	</div>
{/if}

<style lang="postcss">
	@reference "tailwindcss";

	.mwb-results-for-provider {
		@apply px-0 py-2 shadow-xl h-full w-full flex flex-col rounded-xl;
		background-color: var(--color-main-background);
	}

	.mwb-is-alone {
		@apply shadow-none px-2;
	}

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
