<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { createEventDispatcher, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { PROVIDER_ALL, PROVIDER_ALL_LABEL } from '../../constants';
	import { _t } from '../../lib/translate';
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

	function search() {
		providerIds.set(userProviderIds);
		terms.set(userQuery);
		dispatch('search');
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
				aria-labelledby="mwb-clear-button-label"
				disabled={!userQuery}>
				<span id="mwb-clear-button-label" class="mwb-screenreader"
					>{_t('Clear current query')}</span>
				⨯
			</button>
		</div>
		<button type="submit" disabled={!isSearchEnabled}>
			{_t('Search')}
		</button>
		<button
			class="mwb-unstyled mwb-as-link mwb-filters"
			type="button"
			title={_t('Click to change providers')}
			on:click={() => (showProviderSelection = !showProviderSelection)}>
			<span> {_t('Filters')}</span>
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
						{_t(PROVIDER_ALL_LABEL)}
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
		@apply flex flex-wrap gap-x-1;
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
		margin-top: 10px;
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
