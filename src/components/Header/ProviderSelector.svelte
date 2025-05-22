<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { get, writable } from 'svelte/store';
	import { APP_NAME } from '../../constants';
	import availableProviders, { type Provider } from '../../states/availableProviders';
	import { isAllSelected, providerIds } from '../../states/query';
	import { onMount } from 'svelte';

	let displayedSelection = writable<string[]>(get(providerIds));
	let allSelected = $state(true);

	function update(available: Provider[], selected: string[]) {
		allSelected = isAllSelected(selected);
		displayedSelection.set(isAllSelected(selected) ? available.map(({ id }) => id) : selected);
	}

	availableProviders.subscribe((available) => {
		update(available, get(providerIds));
	});

	displayedSelection.subscribe((values) => {
		const available = get(availableProviders);
		allSelected = isAllSelected(values);
		providerIds.set(
			available.length === values.length || !values.length
				? available.map(({ id }) => id)
				: values
		);
	});

	function toggleAll() {
		if (!isAllSelected(get(displayedSelection))) {
			displayedSelection.set(get(availableProviders).map(({ id }) => id));
		}
	}

	onMount(() => {
		update(get(availableProviders), get(providerIds));
	});
</script>

<div class="mwb-checkboxes-container">
	<label>
		<input checked={allSelected} name="providers" onchange={toggleAll} type="checkbox" />
		<span>{translate(APP_NAME, 'All providers')}</span>
	</label>
	<div class="mwb-checkboxes">
		{#each $availableProviders as provider (provider.id)}
			<label>
				<input
					type="checkbox"
					name="providers"
					value={provider.id}
					bind:group={$displayedSelection} />
				<span>
					{provider.name}
				</span>
			</label>
		{/each}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.mwb-checkboxes-container {
		@apply flex gap-5 items-start;
	}

	.mwb-checkboxes {
		@apply flex flex-wrap gap-x-6;
	}

	label {
		@apply flex items-center gap-1;

		input[type='checkbox'] {
			@apply p-0 m-0 h-4 w-4;
		}

		span {
			@apply whitespace-nowrap cursor-pointer;
		}
	}

	/* mwb-tabbed is set on the app container */
	:global(.mwb-tabbed) {
		label:focus-within {
			box-shadow: 0 0 0 4px var(--color-main-background) !important;
			outline: 2px solid var(--color-main-text) !important;
			border-radius: 2px;
		}
	}
</style>
