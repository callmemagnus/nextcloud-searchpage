<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { generateUrl } from '@nextcloud/router';
	import { APP_NAME } from '../../constants';

	const settingsUrl = generateUrl('/settings/admin/thesearchpage');

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

<div
	aria-label={translate(APP_NAME, 'Admin information')}
	bind:this={tooltipContainer}
	class="mwb-admin-info"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	role="group">
	<button
		aria-label={translate(APP_NAME, 'Admin configuration available')}
		class="mwb-info-button"
		onclick={toggleTooltip}
		title={translate(APP_NAME, 'Admin configuration available')}
		type="button">
		<svg
			fill="none"
			height="20"
			viewBox="0 0 20 20"
			width="20"
			xmlns="http://www.w3.org/2000/svg">
			<circle cx="10" cy="10" fill="none" r="8" stroke="currentColor" stroke-width="1.5" />
			<text
				fill="currentColor"
				font-family="sans-serif"
				font-size="12"
				font-weight="600"
				text-anchor="middle"
				x="10"
				y="14">i</text>
		</svg>
	</button>

	{#if showTooltip}
		<div class="mwb-tooltip" role="tooltip">
			<p>
				{translate(
					APP_NAME,
					'As an administrator, you can configure search providers and result limits.'
				)}
			</p>
			<a href={settingsUrl} target="_blank" class="mwb-settings-link">
				{translate(APP_NAME, 'Go to admin settings')} →
			</a>
		</div>
	{/if}
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.mwb-admin-info {
		@apply relative inline-block ml-2;
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
		min-width: 250px;
		max-width: 350px;
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
		@apply m-0 mb-2;
	}

	.mwb-settings-link {
		@apply inline-block mt-1;
		color: var(--color-primary-element);
		text-decoration: none;
		font-weight: 500;
		transition: opacity 0.2s;
	}

	.mwb-settings-link:hover {
		text-decoration: underline;
		opacity: 0.8;
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
			min-width: 200px;
			max-width: 280px;
		}

		.mwb-tooltip::before,
		.mwb-tooltip::after {
			left: auto;
			right: 10px;
			transform: none;
		}
	}
</style>
