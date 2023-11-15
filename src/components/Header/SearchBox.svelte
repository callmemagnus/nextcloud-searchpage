<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { PROVIDER_ALL } from '$/constants';
	import { t } from '$/lib/translate';
	import { providers, type Provider } from '$states/providers';
	import { providerIds, terms } from '$states/query';
	import { createEventDispatcher, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import ProviderSelector from './ProviderSelector.svelte';

	let userQuery = get(terms);
	let userProviderIds = get(providerIds);

	$: filterSummary =
		get(providers)
			.filter(({ id }) => userProviderIds.includes(id))
			.map(({ name }) => name)
			.join(', ') || t('All providers');

	$: isSearchEnabled = userQuery.trim() !== '' && userProviderIds.length;

	const dispatch = createEventDispatcher();
	let input: HTMLInputElement;

	let showProviderSelection = false;

	function updateUserSelection(allProviders: Provider[], candidateSelection: string[]) {
		if (allProviders.length) {
			const ids = allProviders.map(({ id }) => id);
			const newSelection = candidateSelection.filter((id) => ids.includes(id));
			userProviderIds = newSelection.length ? newSelection : [PROVIDER_ALL];
		}
	}

	providers.subscribe((p) => {
		updateUserSelection(p, userProviderIds);
	});

	onMount(() => {
		if (get(terms) !== '' && get(providerIds).length) {
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
			<input bind:this={input} bind:value={userQuery} name="terms" type="text" />

			<button
				class="mwb-form__clear mwb-unstyled"
				disabled={!userQuery}
				on:click={clear}
				title={t('Clear current query')}
				type="button">
				⨯
			</button>
		</div>
		<button disabled={!isSearchEnabled} type="submit">
			{t('Search')}
		</button>
		{#if $providers.length > 1}
			<button
				class="mwb-unstyled mwb-as-link mwb-filters"
				disabled={!$providers.length}
				on:click={() => (showProviderSelection = !showProviderSelection)}
				title={t('Click to change providers')}
				type="button">
				<span> {t('Filters')}</span>
				{#if !showProviderSelection}
					<span class="mwb-flex">
						<span>(</span>
						{#if $providers.length && !userProviderIds.includes(PROVIDER_ALL)}
							<span class="mwb-selected-provider-list">{filterSummary}</span>
						{:else if userProviderIds.includes(PROVIDER_ALL)}
							{t('All providers')}
						{/if}
						<span>)</span>
					</span>
				{/if}
			</button>
		{/if}
	</div>

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
