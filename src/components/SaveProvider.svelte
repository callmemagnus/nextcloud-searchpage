<script lang="ts">
	import { hasSameValues } from '$/lib/array-utils';
	import type { Provider } from '$/states/providers';
	import { createEventDispatcher } from 'svelte';
	import ProviderSelector from './Header/ProviderSelector.svelte';

	export let selection: string[];
	export let providers: Provider[];

	const dispatch = createEventDispatcher();

	let currentSelection: string[] = [...selection];
	let lastDraw = 0;
	$: hasChanges = !hasSameValues(currentSelection, selection);

	function update(event: CustomEvent) {
		const values: string[] = event.detail;
		currentSelection = [...values];
	}

	function reset() {
		currentSelection = [...selection];
		lastDraw++;
	}
	function save() {
		dispatch('save', currentSelection);
	}
</script>

<div>
	{#key lastDraw}
		<ProviderSelector {providers} selection={currentSelection} on:update={update} />
	{/key}

	<div>
		<button type="button" disabled={!hasChanges} on:click={save}>Save</button>
		<button type="button" disabled={!hasChanges} on:click={reset}>Reset</button>
	</div>
</div>
