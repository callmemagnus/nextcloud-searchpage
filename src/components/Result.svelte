<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import type { SearchEntry } from '../lib/search';
	import { terms } from '../states/query';
	import BoldTerms from './BoldTerms.svelte';

	export let result: SearchEntry;

	let imageUrl: string | null;
	let showIcon = false;
	let imageLoadError = false;

	$: iconIsClass = !/^\//.test(result.icon);
	$: {
		if (!imageLoadError) {
			if (!iconIsClass) {
				imageUrl = result.icon;
			} else if (result.thumbnailUrl) {
				imageUrl = result.thumbnailUrl;
			} else {
				showIcon = true;
			}
		} else {
			showIcon = true;
		}
	}

	function onError() {
		imageLoadError = true;
	}
</script>

<div class="mwb-result">
	<div class="mwb-result__image">
		{#if showIcon}
			<div class="{result.icon} mwb-result__icon" />
		{:else}
			<img src={imageUrl} alt="" on:error={onError} />
		{/if}
	</div>
	<div class="mwb-result__text">
		<a href={result.resourceUrl}>
			<h3 class="mwb-ellipsis">
				<BoldTerms original={result.title} terms={$terms} />
			</h3>
			<p class="mwb-ellipsis">
				<BoldTerms original={result.subline} terms={$terms} />
			</p>
		</a>
	</div>
</div>

<style>
	.mwb-result {
		@apply flex w-full;
	}

	.mwb-result__image {
		@apply w-8 h-8 mr-3 flex-grow-0 flex-shrink-0;
	}

	.mwb-result__icon {
		@apply h-full;
	}

	img {
		@apply w-full;
	}

	h3 {
		@apply my-1;
	}

	p {
		@apply text-sm;
	}

	.mwb-result__text {
		@apply overflow-hidden;
	}

	.mwb-ellipsis {
		@apply overflow-hidden text-ellipsis;
	}
</style>
