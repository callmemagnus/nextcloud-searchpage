<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { APP_NAME } from '../../constants';
	import providers from '../../states/availableProviders';
	import availableProviders from '../../states/availableProviders';
	import { isAllSelected, providerIds, terms } from '../../states/query';
	import ProviderSelector from './ProviderSelector.svelte';
	import searchStore from '../../states/searchStore';
	import { clog } from '../../lib/log';
	import { preventDefault } from '../../lib/events';

	let userQuery = $state(get(terms));

	let isSearchEnabled = $derived(userQuery.trim() !== '');

	let input: HTMLInputElement | undefined = $state();

	let showProviderSelection = $state(false);

	onMount(() => {
		if (get(terms) !== '') {
			clog('Auto-launching search', terms);
			searchStore.startSearch(get(terms));
		} else {
			setTimeout(() => input?.focus(), 200);
		}
	});

	function doClear() {
		terms.set('');
		userQuery = '';
		searchStore.clearSearch();
		input?.focus();
	}

	function doSearch() {
		terms.set(userQuery);
		searchStore.startSearch(userQuery);
		if (input) {
			// for mobile phone
			hideKeyboard(input);
		}
	}

	/**
	 * Make mobile browsers hide the keyboard
	 *
	 * https://stackoverflow.com/a/11160055
	 * @param element
	 */
	function hideKeyboard(element: HTMLInputElement) {
		element.inputMode = 'none';
		setTimeout(function () {
			element.blur();
			// Remove readonly attribute after keyboard is hidden.
			element.inputMode = 'text';
		}, 100);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.ctrlKey && e.code === 'KeyF') {
			// avoid Nextcloud page search
			e.stopPropagation();
			// avoid browser in-page search
			e.preventDefault();

			input?.select();
		}
	}
</script>

<svelte:body {onkeydown} />

<form method="get" onsubmit={preventDefault(doSearch)}>
	<div class="mwb-line">
		<div class="mwb-input">
			<input bind:this={input} bind:value={userQuery} name="terms" type="text" />

			<button
				class="mwb-form__clear mwb-unstyled"
				inputmode="text"
				onclick={doClear}
				style={`visibility: ${userQuery.trim().length === 0 ? 'hidden' : 'visible'}`}
				title={translate(APP_NAME, 'Clear current query')}
				type="button">
				⨯
			</button>
		</div>
		<button disabled={!isSearchEnabled} type="submit">
			{translate(APP_NAME, 'Search')}
		</button>
		<button
			class="mwb-unstyled mwb-as-link mwb-filters"
			onclick={() => (showProviderSelection = !showProviderSelection)}
			title={translate(APP_NAME, 'Click to change providers')}
			type="button">
			<span> {translate(APP_NAME, 'Filters')}</span>
			{#if !showProviderSelection && $availableProviders.length && $providerIds.length}
				<span class="mwb-flex">
					<span>(</span>
					{#if !isAllSelected($providerIds)}
						<span class="mwb-selected-provider-list"
							>{$providers
								.filter(({ id }) => $providerIds.includes(id))
								.map(({ name }) => name)
								.join(', ')}</span>
					{:else if isAllSelected($providerIds)}
						{translate(APP_NAME, 'All providers')}
					{/if}
					<span>)</span>
				</span>
			{/if}
		</button>
	</div>
	{#if showProviderSelection && $availableProviders}
		<div class="mwb-line">
			<ProviderSelector />
		</div>
	{/if}
</form>

<style lang="less">
	.mwb-line {
		@apply flex flex-wrap gap-x-1 items-baseline;
	}

	input[type='text'] {
		min-width: 300px;
		padding-right: 35px;

		@media (width < 640px) {
			width: 99%;
		}
	}

	@media (width < 640px) {
		button[type='submit'] {
			@apply hidden;
		}
	}

	.mwb-form__clear {
		@apply relative bg-transparent border-none text-gray-300 p-1;
		margin-left: -28px !important;
	}

	.mwb-filters {
		@apply flex gap-1;
		padding: 8px 10px 8px 10px !important;
	}

	.mwb-selected-provider-list {
		@apply text-ellipsis inline-block overflow-hidden whitespace-nowrap;
		max-width: 200px;
	}

	.mwb-input {
		@media (width < 640px) {
			@apply w-full;
		}

		&:hover .mwb-form__clear {
			@apply text-gray-800;
		}
	}
</style>
