<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { onMount } from 'svelte';
	import { translate } from '@nextcloud/l10n';
	import {
		fetchProviders,
		searchOnProvider,
		computeHasMore,
		APP_NAME,
		type Provider,
		type SearchResult,
		type SearchEntry
	} from '@shared/libs';

	type ProviderState = {
		result: SearchResult | null;
		searching: boolean;
	};

	type Props = {
		/** Provider IDs to search. null = all available providers. */
		initialProviderIds: string[] | null;
		onclose: () => void;
	};

	let { initialProviderIds, onclose }: Props = $props();

	let providers = $state<Provider[]>([]);
	let activeProviderIds = $state<string[]>([]);
	let searchTerm = $state('');
	let results = $state<Record<string, ProviderState>>({});
	let searching = $state(false);
	let inputEl = $state<HTMLInputElement | undefined>();

	onMount(async () => {
		providers = await fetchProviders();
		activeProviderIds = initialProviderIds
			? providers.filter((p) => initialProviderIds!.includes(p.id)).map((p) => p.id)
			: providers.map((p) => p.id);
		setTimeout(() => inputEl?.focus(), 50);
	});

	async function doSearch() {
		const term = searchTerm.trim();
		if (!term || !activeProviderIds.length) return;
		searching = true;
		results = {};
		await Promise.all(
			activeProviderIds.map(async (id) => {
				results = { ...results, [id]: { result: null, searching: true } };
				const result = await searchOnProvider(id, term, 0);
				results = { ...results, [id]: { result, searching: false } };
			})
		);
		searching = false;
	}

	async function loadMore(providerId: string) {
		const current = results[providerId];
		if (!current?.result) return;
		const cursor = current.result.entries.length;
		results = { ...results, [providerId]: { ...current, searching: true } };
		const more = await searchOnProvider(providerId, searchTerm, cursor);
		if (more) {
			results = {
				...results,
				[providerId]: {
					result: {
						...more,
						entries: [...current.result.entries, ...more.entries]
					},
					searching: false
				}
			};
		} else {
			results = { ...results, [providerId]: { ...current, searching: false } };
		}
	}

	let activeResults = $derived(
		providers
			.filter((p) => activeProviderIds.includes(p.id) && results[p.id])
			.map((p) => ({ provider: p, state: results[p.id] }))
			.filter(({ state }) => state.searching || (state.result?.entries?.length ?? 0) > 0)
	);

	let hasAnyResults = $derived(activeResults.length > 0);

	let noResults = $derived(
		!searching &&
			Object.keys(results).length > 0 &&
			activeResults.length === 0 &&
			Object.values(results).every((s) => !s.searching)
	);

	function onBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function boldTerms(text: string, terms: string): Array<{ bold: boolean; value: string }> {
		const separator = '|##|';
		let result = text;
		for (const term of terms.split(' ').filter(Boolean)) {
			const escaped = term.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
			result = result.replaceAll(new RegExp(`(${escaped})`, 'ig'), `${separator}%b%$1%b%${separator}`);
		}
		return result.split(separator).map((token) => ({
			bold: token.startsWith('%b%') && token.endsWith('%b%'),
			value: token.replaceAll('%b%', '')
		}));
	}

	function iconIsClass(icon: string) {
		return !/^\//.test(icon);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="mwb-mini-backdrop" onclick={onBackdropClick} onkeydown={onKeydown} role="presentation">
	<div class="mwb-mini-modal" role="dialog" aria-modal="true" aria-label={translate(APP_NAME, 'Search')}>
		<div class="mwb-mini-header">
			<form
				class="mwb-mini-form"
				method="get"
				onsubmit={(e) => {
					e.preventDefault();
					doSearch();
				}}>
				<input
					bind:this={inputEl}
					bind:value={searchTerm}
					class="mwb-mini-input"
					type="text"
					placeholder={translate(APP_NAME, 'Search...')}
					autocomplete="off" />
				<button class="mwb-mini-search-btn" type="submit" disabled={!searchTerm.trim()}>
					{translate(APP_NAME, 'Search')}
				</button>
			</form>
			<button class="mwb-mini-close" type="button" onclick={onclose} aria-label={translate(APP_NAME, 'Close')}>
				✕
			</button>
		</div>

		<div class="mwb-mini-body">
			{#if noResults}
				<p class="mwb-mini-empty">{translate(APP_NAME, 'No results')}</p>
			{:else if hasAnyResults || searching}
				{#each activeResults as { provider, state } (provider.id)}
					<div class="mwb-mini-provider">
						<h2 class="mwb-mini-provider-name">{provider.name}</h2>
						{#if state.searching && !state.result?.entries?.length}
							<p class="mwb-mini-loading">{translate(APP_NAME, 'Loading...')}</p>
						{:else}
							{#each (state.result?.entries ?? []) as entry (entry.resourceUrl)}
								<a class="mwb-mini-result" href={entry.resourceUrl}>
									<div class="mwb-mini-result-icon">
										{#if iconIsClass(entry.icon)}
											<div class="{entry.icon} mwb-mini-icon-class"></div>
										{:else}
											<img src={entry.icon} alt="" />
										{/if}
									</div>
									<div class="mwb-mini-result-text">
										<span class="mwb-mini-result-title">
											{#each boldTerms(entry.title, searchTerm) as token, i (`${i}-${token.value}`)}
												{#if token.bold}<b>{token.value}</b>{:else}{token.value}{/if}
											{/each}
										</span>
										{#if entry.subline}
											<span class="mwb-mini-result-sub">
												{#each boldTerms(entry.subline, searchTerm) as token, i (`${i}-${token.value}`)}
													{#if token.bold}<b>{token.value}</b>{:else}{token.value}{/if}
												{/each}
											</span>
										{/if}
									</div>
								</a>
							{/each}
							{#if computeHasMore(state.result ?? null)}
								<button
									class="mwb-mini-load-more"
									type="button"
									disabled={state.searching}
									onclick={() => loadMore(provider.id)}>
									{state.searching
										? translate(APP_NAME, 'Loading...')
										: translate(APP_NAME, 'Load more...')}
								</button>
							{/if}
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
	@reference "tailwindcss";

	.mwb-mini-backdrop {
		position: fixed;
		inset: 0;
		z-index: 10000;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 80px;
	}

	.mwb-mini-modal {
		background: var(--color-main-background);
		color: var(--color-main-text);
		border-radius: var(--border-radius-large, 12px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		width: 100%;
		max-width: 680px;
		max-height: 75vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.mwb-mini-header {
		@apply flex items-center gap-2 p-3 border-b;
		border-color: var(--color-border);
		flex-shrink: 0;
	}

	.mwb-mini-form {
		@apply flex gap-2 flex-1;
	}

	.mwb-mini-input {
		@apply flex-1;
		background: var(--color-background-dark);
		color: var(--color-main-text);
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius);
		padding: 6px 10px;
		font-size: 1rem;

		&:focus {
			outline: 2px solid var(--color-primary);
			border-color: transparent;
		}
	}

	.mwb-mini-search-btn {
		flex-shrink: 0;
	}

	.mwb-mini-close {
		flex-shrink: 0;
		background: none;
		border: none;
		font-size: 1.1rem;
		cursor: pointer;
		color: var(--color-main-text);
		padding: 4px 8px;
		border-radius: var(--border-radius);

		&:hover {
			background: var(--color-background-hover);
		}
	}

	.mwb-mini-body {
		overflow-y: auto;
		flex: 1;
		padding: 8px 0;
	}

	.mwb-mini-empty,
	.mwb-mini-loading {
		@apply px-4 py-2;
		color: var(--color-text-lighter);
	}

	.mwb-mini-provider {
		@apply mb-4;
	}

	.mwb-mini-provider-name {
		@apply px-4 pt-2 pb-1 text-sm font-semibold uppercase tracking-wide;
		color: var(--color-text-lighter);
		border-bottom: 1px solid var(--color-border-dark, var(--color-border));
		margin: 0 0 4px;
	}

	.mwb-mini-result {
		@apply flex items-center gap-3 px-4 py-2 cursor-pointer;
		color: var(--color-main-text);
		text-decoration: none;

		&:hover {
			background: var(--color-background-hover);
		}
	}

	.mwb-mini-result-icon {
		width: 32px;
		height: 32px;
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	.mwb-mini-icon-class {
		width: 100%;
		height: 100%;
	}

	.mwb-mini-result-text {
		@apply flex flex-col overflow-hidden;
		min-width: 0;
	}

	.mwb-mini-result-title {
		@apply text-sm font-medium truncate;

		b {
			font-weight: 700;
		}
	}

	.mwb-mini-result-sub {
		@apply text-xs truncate;
		color: var(--color-text-lighter);

		b {
			font-weight: 700;
		}
	}

	.mwb-mini-load-more {
		@apply mx-4 mt-1 text-xs;
	}
</style>
