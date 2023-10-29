<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later
	import { get } from 'svelte/store';
	import { _t } from '../lib/translate';
	import type { Provider } from '../states/providers';
	import { terms } from '../states/query';
	import ProviderResults from './ProviderResults.svelte';
	import { onMount } from 'svelte';
	import { addToHash, readFromHash, removeFromHash } from '../lib/hash';
	import DynamicGrid from './DynamicGrid.svelte';

	export let providers: Provider[];

	let displayedProviders: Provider[] = [];
	$: {
		displayedProviders = providers.filter(({ id }) => {
			if (focusedProvider) {
				return focusedProvider === id;
			}
			return !providersWithNoResults.includes(id);
		});
	}

	let focusedProvider: string | null = null;
	let providersWithNoResults: string[] = [];
	let query = get(terms);

	function updateFocusedProvider(id: string | null) {
		if (id) {
			addToHash('providerId', id);
		} else {
			removeFromHash('providerId');
		}
		focusedProvider = id;
	}

	function updateNoResult(id: string) {
		providersWithNoResults = [...providersWithNoResults, id];
	}

	function isProviderAlone(id: string) {
		return (
			displayedProviders.length === 1 ||
			focusedProvider == id ||
			providersWithNoResults.length === 1
		);
	}

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

{#if displayedProviders.length}
	<DynamicGrid items={displayedProviders} {minCellHeight} {minCellWidth} let:item={provider}>
		{#key `${provider.id}-${displayedProviders.length}`}
			<ProviderResults
				{query}
				{provider}
				isAlone={isProviderAlone(provider.id)}
				showBack={Boolean(focusedProvider)}
				on:only-me={() => updateFocusedProvider(provider.id)}
				on:back={() => updateFocusedProvider(null)}
				on:no-result={() => updateNoResult(provider.id)} />
		{/key}
	</DynamicGrid>
{:else if providersWithNoResults.length > 0}
	<p>{_t('No results')}</p>
{/if}

<style>
	p {
		@apply pl-2;
	}
</style>
