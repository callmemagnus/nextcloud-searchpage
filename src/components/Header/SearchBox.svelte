<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { createEventDispatcher, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { APP_NAME, PROVIDER_ALL, PROVIDER_ALL_LABEL } from '../../constants';
	import providers from '../../states/providers';
	import { providerId, providerIds, terms } from '../../states/query';
	import ProviderSelector from './ProviderSelector.svelte';

	let userQuery = get(terms);
	let userProviderIds = get(providerIds);

	$: isSearchEnabled = userQuery.trim() !== '' && userProviderIds.length;

	const dispatch = createEventDispatcher();
	let input: HTMLInputElement;

	let showProviderSelection = false;

	onMount(() => {
		if (get(terms) !== '' && get(providerId)) {
			search();
		} else {
			setTimeout(() => input.focus(), 200);
		}
	});

	function clear() {
		terms.set('');
		userQuery = '';
		dispatch('clear');
		input.focus();
	}

	function search(event?: SubmitEvent) {
		providerIds.set(userProviderIds);
		terms.set(userQuery);
		dispatch('search');

		if (event) {
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

			input.select();
		}
	}

	function updateProviders(v: CustomEvent) {
		userProviderIds = v.detail;
	}
</script>

<svelte:body on:keydown={onkeydown} />

<form method="get" on:submit|preventDefault={search}>
	<div class="mwb-line">
		<div class="mwb-input">
			<input bind:this={input} type="text" name="terms" bind:value={userQuery} />

			<button
				class="mwb-form__clear mwb-unstyled"
				type="button"
				on:click={clear}
				title={translate(APP_NAME, 'Clear current query')}
				disabled={!userQuery}>
				⨯
			</button>
		</div>
		<button type="submit" disabled={!isSearchEnabled}>
			{translate(APP_NAME, 'Search')}
		</button>
		<button
			class="mwb-unstyled mwb-as-link mwb-filters"
			type="button"
			title={translate(APP_NAME, 'Click to change providers')}
			on:click={() => (showProviderSelection = !showProviderSelection)}>
			<span> {translate(APP_NAME, 'Filters')}</span>
			{#if !showProviderSelection}
				<span class="mwb-flex">
					<span>(</span>
					{#if $providers.length && !userProviderIds.includes(PROVIDER_ALL)}
						<span class="mwb-selected-provider-list"
							>{$providers
								.filter(({ id }) => userProviderIds.includes(id))
								.map(({ name }) => name)
								.join(', ')}</span>
					{:else if userProviderIds.includes(PROVIDER_ALL)}
						{translate(APP_NAME, PROVIDER_ALL_LABEL)}
					{/if}
					<span>)</span>
				</span>
			{/if}
		</button>
	</div>
	<div style="display: {showProviderSelection ? 'block' : 'unset'}"></div>

	{#if showProviderSelection && $providers.length}
		<ProviderSelector
			providers={$providers}
			selection={userProviderIds}
			on:update={updateProviders} />
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
		@apply relative bg-transparent border-none text-gray-300 !p-1;
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
