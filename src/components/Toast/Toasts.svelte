<script lang="ts">
	import { flip } from 'svelte/animate';
	import Toast from './Toast.svelte';
	import { toasts } from './toasts';
</script>

<div class="mwb-toasts">
	{#if $toasts.length}
		{#each $toasts as toast, index (toast)}
			<div animate:flip={{ duration: 100 }}>
				<Toast {toast} />
			</div>
		{/each}
	{/if}
</div>

<style>
	.mwb-toasts {
		@apply absolute right-3 top-3 flex flex-col gap-2 z-10;
	}
</style>
