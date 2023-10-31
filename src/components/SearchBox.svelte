<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { createEventDispatcher, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { PROVIDER_ALL, PROVIDER_ALL_LABEL } from '../lib/search';
	import { _t } from '../lib/translate';
	import providers from '../states/providers';
	import { providerId, terms } from '../states/query';

	let userQuery = get(terms);
	let userProviderId = get(providerId);

	const dispatch = createEventDispatcher();
	let input: HTMLInputElement;

	let showProviderSelection = false;

	onMount(() => {
		if (get(terms) !== '' && get(providerId)) {
			search();
		} else {
			input.focus();
		}
	});

	function clear() {
		terms.set('');
		providerId.set(PROVIDER_ALL);
		userQuery = '';
		userProviderId = PROVIDER_ALL;
		dispatch('clear');
		input.focus();
	}

	function search() {
		providerId.set(userProviderId);
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
				disabled={!userQuery && userProviderId === PROVIDER_ALL}>
				x
			</button>
		</div>
		<button type="submit" disabled={!userQuery}>
			{_t('Search')}
		</button>
		<button
			class="mwb-unstyled mwb-as-link"
			type="button"
			on:click={() => (showProviderSelection = !showProviderSelection)}>Filters</button>
	</div>
	<div style="display: {showProviderSelection ? 'block' : 'unset'}"></div>

	{#if showProviderSelection}
		<select name="provider" bind:value={userProviderId}>
			<option value={PROVIDER_ALL} selected={userProviderId === PROVIDER_ALL}>
				{_t(PROVIDER_ALL_LABEL)}
			</option>
			{#each $providers as provider}
				<option value={provider.id} selected={userProviderId === provider.id}
					>{provider.name}</option>
			{/each}
		</select>
	{/if}
</form>

<style lang="less">
	.mwb-line {
		@apply flex gap-1;
	}

	input {
		width: 200px;
		padding-right: 35px;
	}

	button.mwb-unstyled,
	button.mwb-unstyled:focus,
	button.mwb-unstyled:active {
		background: none !important;
		color: inherit !important;
		border: none !important;
		padding: 0 !important;
		line-height: 1 !important;
		font: inherit !important;
		cursor: pointer !important;
		outline: inherit !important;
	}

	button.mwb-as-link,
	button.mwb-as-link:active {
		@apply hover:underline !text-blue-400;
	}

	.mwb-form__clear {
		@apply relative bg-transparent border-none text-gray-300 !p-1;
		margin-left: -28px !important;
	}

	.mwb-input:hover .mwb-form__clear {
		@apply text-gray-800;
	}
</style>
