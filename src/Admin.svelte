<script lang="ts">
	import { writeGlobalSettings, writeGroupSettings } from '$lib/admin';
	import { readGroupSettings, readSettings } from '$lib/config';
	import { readGroups } from '$lib/groups';
	import { fetchProviders } from '$lib/search';
	import { t } from '$lib/translate';
	import type { Provider } from '$states/providers';
	import { onMount } from 'svelte';
	import Info from './components/Icons/Info.svelte';
	import Loading from './components/Loading.svelte';
	import SaveProvider from './components/SaveProvider.svelte';
	import Toasts from './components/Toast/Toasts.svelte';
	import { toast } from './components/Toast/toasts';

	let pProviders: Promise<Provider[]> = fetchProviders();

	let selection: string[];
	let groupSelection: Record<string, string[]> = {};

	let availableGroups: string[] = [];

	onMount(async () => {
		const [settings, groups] = await Promise.all([readSettings(), readGroups()]);
		availableGroups = groups;
		for (let i = 0; i < groups.length; i++) {
			const group = groups[i];
			const groupSettings = await readGroupSettings(group);
			groupSelection[group] = groupSettings.enabledProviders;
		}

		selection = settings.enabledProviders;
	});

	const savedLabel = t('Saved');
	const errorLabel = t('Unable to save');

	async function updateGlobalSelection(event: CustomEvent) {
		const newSelection = event.detail;
		if (newSelection.length) {
			try {
				await writeGlobalSettings({
					enabledProviders: newSelection
				});
				selection = newSelection;
				toast.success(savedLabel);
			} catch (e) {
				toast.error(errorLabel);
			}
		}
	}

	async function updateSelectionForGroup(group: string, event: CustomEvent) {
		const selection = event.detail;
		if (selection.length) {
			try {
				await writeGroupSettings(group, {
					enabledProviders: selection
				});
				groupSelection[group] = selection;
				toast.success(savedLabel);
			} catch (e) {
				toast.error(errorLabel);
			}
		}
	}
</script>

<Toasts />
<main>
	<h2>{t('The Search Page')}</h2>

	<div class="mwb-info">
		<span>
			<Info />
		</span>
		<div>
			<p>
				{t('This is not a security configuration.')}
			</p>
			<p>
				{t('Security is applied by the search providers.')}
			</p>
		</div>
	</div>

	<p>
		{t(
			'If a user is part of multiple groups, the union of the groups configurations will be applied.'
		)}
	</p>

	{#await pProviders}
		<Loading />
	{:then providers}
		<h3>{t('Global settings')}</h3>
		{#if selection}
			<p>{t('Select the providers that will be available to all the users:')}</p>
			<SaveProvider {providers} {selection} on:save={updateGlobalSelection} />
		{:else}
			<Loading />
		{/if}

		{#if availableGroups.length}
			<h3>{t('Group settings')}</h3>

			{#each availableGroups as group}
				<h4>{group}</h4>
				{#if groupSelection[group]}
					<p>
						{t('Select the providers that will be available to the users in group "{group}":', {
							group
						})}
					</p>
					<SaveProvider
						{providers}
						selection={groupSelection[group]}
						on:save={(event) => updateSelectionForGroup(group, event)} />
				{:else}
					<Loading />
				{/if}
			{/each}
		{/if}
	{:catch error}
		<p style="color: red">{error.message}</p>
	{/await}
</main>

<style lang="less">
	main {
		@apply p-4;
	}

	h2 {
		@apply text-2xl my-2 mb-4;
	}

	h3 {
		@apply text-xl mt-6 mb-4 font-bold;
	}

	h4 {
		@apply font-bold uppercase mt-4 mb-2;
	}

	p {
		@apply my-2;
	}

	.mwb-info {
		@apply mb-3 px-2 py-4 bg-blue-100 border-2 border-blue-600 text-blue-700 flex items-start gap-2;

		span {
			@apply h-7 w-7;
		}

		p {
			@apply m-0 mb-2;
		}

		p + p {
			@apply mb-0;
		}
	}
</style>
