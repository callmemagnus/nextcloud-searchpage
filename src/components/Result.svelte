<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import type {SearchEntry} from '../lib/search';
	import {terms} from '../states/query';
	import BoldTerms from './BoldTerms.svelte';

	interface Props {
		result: SearchEntry;
	}

	let {result}: Props = $props();

	let imageUrl: string | undefined = $state();
	let showIcon = $state(false);

	let iconIsClass = !/^\//.test(result.icon);
	let hasThumbnail = result.thumbnailUrl?.length > 0;

	let imageSteps: 'thumbnail' | 'icon' | 'class-icon' = $state(
		(function () {
			if (hasThumbnail) {
				return 'thumbnail';
			}
			if (iconIsClass) {
				return 'class-icon';
			}
			return 'icon';
		})()
	);

	$effect.pre(() => {
		switch (imageSteps) {
			case 'thumbnail':
				imageUrl = result.thumbnailUrl;
				break;
			case 'icon':
				imageUrl = result.icon;
				break;
			default:
			case 'class-icon':
				showIcon = true;
				break;
		}
	});

	function onError() {
		switch (imageSteps) {
			case 'thumbnail':
				imageSteps = iconIsClass ? 'class-icon' : 'icon';
				break;
			case 'icon':
				imageSteps = 'class-icon';
				break;
			case 'class-icon':
			default:
				imageSteps = 'class-icon';
		}
	}
</script>

<a class="mwb-result flex w-full items-start cursor-pointer" href={result.resourceUrl}>
	<div class="w-8 h-8 mt-1 ml-1 mr-2 flex-grow-0 flex-shrink-0">
		{#if showIcon}
			<div class="h-full {result.icon} mwb-result__icon"></div>
		{:else}
			<img class="mt-2 w-full" src={imageUrl} alt="" onerror={onError}/>
		{/if}
	</div>
	<div class="mwb-text">
		<h3 class="overflow-hidden text-ellipsis mt-0 mb-0 mt-">
			<BoldTerms original={result.title} terms={$terms}/>
		</h3>
		{#if result.subline}
			<p class="overflow-hidden text-ellipsis mt-1 text-sm">
				<BoldTerms original={result.subline} terms={$terms}/>
			</p>
		{/if}
	</div>
</a>

<style lang="postcss">
	@reference "tailwindcss";

	.mwb-text {
		@apply block overflow-hidden;
		min-height: 2rem;
	}
</style>
