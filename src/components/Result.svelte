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
	<!-- <div style="display: none">
    {JSON.stringify(result, null, 2)}
  </div> -->
	<div class="mwb-result__image">
		{#if showIcon}
			<div class="{result.icon} mwb-result__icon" />
		{:else}
			<img src={imageUrl} alt="" on:error={onError} />
		{/if}
	</div>
	<div>
		<a href={result.resourceUrl}>
			<h3>
				<BoldTerms terms={$terms} original={result.title} />
			</h3>
			<p>
				<BoldTerms terms={$terms} original={result.subline} />
			</p>
		</a>
	</div>
</div>

<style lang="scss">
	.mwb-result {
		display: flex;
	}
	.mwb-result__image {
		width: 32px;
		height: 32px;
		margin-right: 10px;
		flex-shrink: 0;
		flex-grow: 0;

		.mwb-result__icon {
			height: 100%;
		}

		img {
			width: 100%;
		}
	}

	h3 {
		font-size: 1em;
		line-height: 120%;
		margin-top: 5px;
		margin-bottom: 5px;
	}
	p {
		font-size: 0.7rem;
		line-height: 120%;
	}
</style>
