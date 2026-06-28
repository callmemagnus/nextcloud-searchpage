<!--
SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
SPDX-License-Identifier: AGPL-3.0-or-later
-->
<script lang="ts">
	import { translate } from '@nextcloud/l10n';
	import { APP_NAME } from '../../constants';
	import queryState from '../../states/query.svelte';

	let showTooltip = $state(false);
	let tooltipContainer: HTMLDivElement | undefined = $state();
	let isTouch = $state(false);

	function toggleTooltip(event: MouseEvent) {
		event.stopPropagation();
		isTouch = true;
		showTooltip = !showTooltip;
	}

	function handleMouseEnter() {
		if (!isTouch) {
			showTooltip = true;
		}
	}

	function handleMouseLeave() {
		if (!isTouch) {
			showTooltip = false;
		}
	}

	function handleClickOutside(event: MouseEvent) {
		if (tooltipContainer && !tooltipContainer.contains(event.target as Node)) {
			showTooltip = false;
			isTouch = false;
		}
	}
</script>

<svelte:body onclick={handleClickOutside} />

<div class="mwb-date-filter">
	<label>
		<span>{translate(APP_NAME, 'Modified since')}</span>
		<input bind:value={queryState.since} max={queryState.until || undefined} type="date" />
	</label>
	<label>
		<span>{translate(APP_NAME, 'Modified until')}</span>
		<input bind:value={queryState.until} min={queryState.since || undefined} type="date" />
	</label>
	<div
		aria-label={translate(APP_NAME, 'Note: not all search providers support date filters.')}
		bind:this={tooltipContainer}
		class="mwb-date-info"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		role="group">
		<button
			aria-label={translate(APP_NAME, 'Note: not all search providers support date filters.')}
			class="mwb-info-button"
			onclick={toggleTooltip}
			type="button">
			<svg
				fill="none"
				height="20"
				viewBox="0 0 20 20"
				width="20"
				xmlns="http://www.w3.org/2000/svg">
				<circle
					cx="10"
					cy="10"
					fill="none"
					r="8"
					stroke="currentColor"
					stroke-width="1.5" />
				<text
					fill="currentColor"
					font-family="sans-serif"
					font-size="12"
					font-weight="600"
					text-anchor="middle"
					x="10"
					y="14"
					>i
				</text>
			</svg>
		</button>

		{#if showTooltip}
			<div class="mwb-tooltip" role="tooltip">
				<p>
					{translate(APP_NAME, 'Note: not all search providers support date filters.')}
				</p>
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.mwb-date-filter {
		@apply flex flex-wrap gap-x-6 gap-y-1 items-center;
	}

	label {
		@apply flex items-center gap-2;

		span {
			@apply whitespace-nowrap;
		}

		input[type='date'] {
			@apply p-1;
			color: var(--color-main-text);
			background-color: var(--color-main-background);
			border: 1px solid var(--color-border);
			border-radius: var(--border-radius);
		}
	}

	.mwb-date-info {
		@apply relative inline-block;
	}

	.mwb-info-button {
		@apply p-0 m-0 bg-transparent border-none cursor-pointer;
		color: var(--color-text-maxcontrast);
		transition: color 0.2s;
	}

	.mwb-info-button:hover,
	.mwb-info-button:focus {
		color: var(--color-main-text);
		outline: none;
	}

	.mwb-tooltip {
		@apply absolute z-50 px-3 py-2 text-sm;
		min-width: 220px;
		max-width: 320px;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 8px;
		background-color: var(--color-main-background);
		color: var(--color-main-text);
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius-large);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		white-space: normal;
		line-height: 1.4;
	}

	.mwb-tooltip p {
		@apply m-0;
	}

	.mwb-tooltip::before {
		content: '';
		@apply absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-bottom-color: var(--color-border);
	}

	.mwb-tooltip::after {
		content: '';
		@apply absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 5px solid transparent;
		border-bottom-color: var(--color-main-background);
		margin-bottom: -1px;
	}

	@media (width < 640px) {
		.mwb-tooltip {
			@apply right-0 left-auto;
			transform: none;
			min-width: 180px;
			max-width: 260px;
		}

		.mwb-tooltip::before,
		.mwb-tooltip::after {
			left: auto;
			right: 10px;
			transform: none;
		}
	}
</style>
