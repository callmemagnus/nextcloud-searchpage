<!--
SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
SPDX-License-Identifier: AGPL-3.0-or-later
-->
<script lang="ts">
	import { translate } from '@nextcloud/l10n';
	import { APP_NAME } from '../../constants';
	import queryState from '../../states/query.svelte';
</script>

<div class="mwb-date-filter">
	<label>
		<span>{translate(APP_NAME, 'Modified from')}</span>
		<input type="date" bind:value={queryState.since} max={queryState.until || undefined} />
	</label>
	<label>
		<span>{translate(APP_NAME, 'Modified until')}</span>
		<input type="date" bind:value={queryState.until} min={queryState.since || undefined} />
	</label>
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
</style>
