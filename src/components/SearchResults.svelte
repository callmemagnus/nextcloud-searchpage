<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later
	import { get } from 'svelte/store';
	import { _t } from '../lib/translate';
	import type { Provider } from '../states/providers';
	import { terms } from '../states/query';
	import ProviderResults from './ProviderResults.svelte';

	export let providers: Provider[];

	let noResultCounter = 0;
	let query = get(terms);
</script>

{#if providers.length}
	{#if noResultCounter === providers.length && noResultCounter !== 1}
		<p>{_t('No result')}</p>
	{/if}
	{#each providers as provider}
		{#key `${provider.id}-${providers.length}`}
			<ProviderResults
				{query}
				{provider}
				isAlone={providers.length === 1}
				on:no-result={() => noResultCounter++} />
		{/key}
	{:else}
		<p>{_t('Loading...')}</p>
	{/each}
{/if}
