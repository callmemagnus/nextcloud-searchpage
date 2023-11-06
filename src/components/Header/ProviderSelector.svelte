<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { ChangeEventHandler } from 'svelte/elements';
	import { writable } from 'svelte/store';
	import { PROVIDER_ALL, PROVIDER_ALL_LABEL } from '../../lib/search';
	import { _t } from '../../lib/translate';
	import type { Provider } from '../../states/providers';

	export let providers: Provider[];
	/**
	 * Selection is either PROVIDER_ALL or a list of providers
	 * if it contains PROVIDER_ALL the rest is ignored
	 */
	export let selection: string[];

	const dispatch = createEventDispatcher();

	let displayedSelection = writable(
		selection.includes(PROVIDER_ALL) ? providers.map(({ id }) => id) : selection
	);
	let allProvidersChecked = false;
	displayedSelection.subscribe((value) => {
		if (value.length === providers.length) {
			allProvidersChecked = true;
			dispatch('update', [PROVIDER_ALL]);
		} else {
			allProvidersChecked = false;
			dispatch('update', value);
		}
	});

	const updateAll: ChangeEventHandler<HTMLInputElement> = (event) => {
		const target = event.target as HTMLInputElement;
		if (target.checked) {
			displayedSelection.set(providers.map(({ id }) => id));
		} else {
			displayedSelection.set([]);
		}
	};
</script>

<div class="mwb-checkboxes-container">
	<label>
		<input type="checkbox" name="providers" checked={allProvidersChecked} on:change={updateAll} />
		<span>{_t(PROVIDER_ALL_LABEL)}</span>
	</label>
	<div class="mwb-checkboxes">
		{#each providers as provider}
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

<style lang="less">
	.mwb-checkboxes-container {
		@apply flex gap-5 items-start;
	}

	.mwb-checkboxes {
		@apply flex  flex-wrap gap-x-6;
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
