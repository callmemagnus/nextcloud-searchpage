<script lang="ts">
	import { onMount } from 'svelte';
	import ProviderSelector from './components/Header/ProviderSelector.svelte';
	import { readGroups, readSettings, writeSettings } from './lib/admin';
	import { clog } from './lib/log';
	import { fetchProviders } from './lib/search';
	import { _t } from './lib/translate';
	import type { Provider } from './states/providers';

	let pProviders: Promise<Provider[]> = fetchProviders();

	let selection: string[];
	let groups: string[] = [];

	onMount(async () => {
		const settings = await readSettings();
		selection = settings.enabledProviders;
		groups = await readGroups();
	});

	function updateGlobalSelection(event: CustomEvent) {
		selection = event.detail;
		if (selection.length) {
			writeSettings({
				enabledProviders: selection
			});
		}
	}

	function updateSelectionForGroup(group: string, event: CustomEvent) {
		clog(group, event.detail);
	}
</script>

<main>
	<h2>{_t('The Search Page')}</h2>

	{#await pProviders}
		<p>{_t('Loading...')}</p>
	{:then providers}
		<p>{_t('Select providers that will be available for your all the users:')}</p>

		{#if selection}
			{#if selection.length === 0}
				<p class="mwb-error">{_t('You must at least select one provider.')}</p>
			{/if}
			<ProviderSelector {providers} {selection} on:update={updateGlobalSelection} />
		{/if}

		{#if groups.length}
			{#each groups as group}
				<h3>{_t('Select providers for "%s" user group', group)}</h3>

				<ProviderSelector
					{providers}
					selection={[]}
					on:update={(event) => updateSelectionForGroup(group, event)} />
			{/each}
		{/if}
	{:catch error}
		<p style="color: red">{error.message}</p>
	{/await}
</main>

<style>
	main {
		@apply p-4;
	}

	h2 {
		@apply text-2xl my-2;
	}

	h3 {
		@apply text-xl my-2 font-bold;
	}

	p {
		@apply py-2;
	}

	.mwb-error {
		@apply px-2 bg-red-100 border-2 border-red-600 text-red-700;
	}
</style>
