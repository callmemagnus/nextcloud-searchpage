<script lang="ts">
	import { fade } from 'svelte/transition';
	import Error from '../Icons/Error.svelte';
	import Info from '../Icons/Info.svelte';
	import Success from '../Icons/Success.svelte';
	import Warning from '../Icons/Warning.svelte';
	import type { Toast } from './toasts';

	export let toast: Toast;
</script>

<div class="mwb-toast mwb-{toast.type}" in:fade>
	<div class="mwb-icon">
		{#if toast.type === 'info'}
			<Info />
		{:else if toast.type === 'success'}
			<Success />
		{:else if toast.type === 'warning'}
			<Warning />
		{:else if toast.type === 'error'}
			<Error />
		{/if}
	</div>
	<div>
		{toast.text}
	</div>
</div>

<style lang="less">
	@keyframes horizontal-shaking {
		0% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(5px);
		}
		50% {
			transform: translateX(-5px);
		}
		75% {
			transform: translateX(5px);
		}
		100% {
			transform: translateX(0);
		}
	}

	.mwb-toast {
		@apply flex items-center gap-2 border-l-4 border-solid bottom-2 px-2 py-3 text-gray-700  bg-white shadow-md;
		min-width: 250px;
	}

	.mwb-icon {
		@apply h-6 w-6;
	}

	.mwb-info {
		@apply border-blue-300;
	}

	.mwb-success {
		@apply border-green-600 bg-green-100 text-green-800;
	}

	.mwb-warning {
		@apply border-orange-300 bg-orange-100 text-orange-800;
	}

	.mwb-error {
		@apply border-red-600 bg-red-100 text-red-800;
		animation: horizontal-shaking 0.2s ease-in-out 0s 2;
	}
</style>
