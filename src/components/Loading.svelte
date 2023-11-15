<script lang="ts">
	import { t } from '$lib/translate';
	import Loading from './Icons/Loading.svelte';
</script>

<p class="mwb-loading">
	<span class="mwb-icon">
		<Loading />
	</span>
	<span>{t('Loading...')}</span>
</p>

<style lang="less">
	.mwb-loading {
		@apply flex items-center gap-2;

		.mwb-icon {
			@apply h-6 w-6;
			@keyframes rotating {
				from {
					transform: rotate(0deg);
				}
				to {
					transform: rotate(360deg);
				}
			}
			animation: rotating 2s linear infinite;
		}
	}
</style>
