<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { onMount } from 'svelte';
	import { translate } from '@nextcloud/l10n';
	import { generateUrl } from '@nextcloud/router';
	import {
		APP_NAME,
		computeHasMore,
		fetchProviders,
		type Provider,
		searchOnProvider,
		type SearchResult
	} from '@shared/libs';

	type ProviderState = {
		result: SearchResult | null;
		searching: boolean;
		extraParams: Record<string, string>;
	};

	type Props = {
		/** Provider IDs to search. null = all available providers. */
		initialProviderIds: string[] | null;
		/** Current folder path when on the Files app. null = not on Files page. */
		currentPath: string | null;
		providerLimits: Record<string, number>;
		isAdmin: boolean;
		onclose: () => void;
	};

	let { initialProviderIds, currentPath, providerLimits, isAdmin, onclose }: Props = $props();

	let providers = $state<Provider[]>([]);
	let activeProviderIds = $state<string[]>([]);
	let searchTerm = $state('');
	let results = $state<Record<string, ProviderState>>({});
	let searching = $state(false);
	let inputEl = $state<HTMLInputElement | undefined>();
	let scopeToFolder = $state(true);
	let since = $state('');
	let until = $state('');
	let showDateFilter = $state(false);
	let dateFilterContainer = $state<HTMLDivElement | undefined>();

	let hasDateFilter = $derived(!!since || !!until);

	let currentFolderName = $derived(
		!currentPath || currentPath === '/'
			? translate(APP_NAME, 'Home')
			: (currentPath.split('/').filter(Boolean).pop() ?? translate(APP_NAME, 'Home'))
	);

	let showScopeToggle = $derived(currentPath !== null && activeProviderIds.includes('files'));

	onMount(async () => {
		providers = await fetchProviders();
		const availableIds = new Set(providers.map((p) => p.id));
		activeProviderIds = initialProviderIds
			? initialProviderIds.filter((id) => availableIds.has(id))
			: providers.map((p) => p.id);
		setTimeout(() => inputEl?.focus(), 50);
	});

	function getProviderLimit(providerId: string): number {
		return providerLimits[providerId] ?? 10;
	}

	function getProviderParams(providerId: string): Record<string, string> {
		const params: Record<string, string> = {};
		if (providerId === 'files' && scopeToFolder && currentPath) {
			params.path = currentPath;
		}
		if (since) {
			params.since = String(Math.floor(new Date(since + 'T00:00:00').getTime() / 1000));
		}
		if (until) {
			params.until = String(Math.floor(new Date(until + 'T23:59:59').getTime() / 1000));
		}
		return params;
	}

	function applyDateFilter() {
		showDateFilter = false;
		if (searchTerm.trim() && Object.keys(results).length > 0) {
			doSearch();
		}
	}

	function clearDateFilter() {
		since = '';
		until = '';
		if (searchTerm.trim() && Object.keys(results).length > 0) {
			doSearch();
		}
	}

	async function doSearch() {
		const term = searchTerm.trim();
		if (!term || !activeProviderIds.length) return;
		searching = true;
		results = {};
		await Promise.all(
			activeProviderIds.map(async (id) => {
				results = { ...results, [id]: { result: null, searching: true, extraParams: {} } };
				const extraParams = getProviderParams(id);
				const limit = getProviderLimit(id);
				const result = await searchOnProvider(id, term, 0, limit, extraParams);
				results = { ...results, [id]: { result, searching: false, extraParams } };
			})
		);
		searching = false;
	}

	async function loadMore(providerId: string) {
		const current = results[providerId];
		if (!current?.result) return;
		const cursor = current.result.entries.length;
		results = { ...results, [providerId]: { ...current, searching: true } };
		const more = await searchOnProvider(
			providerId,
			searchTerm,
			cursor,
			getProviderLimit(providerId),
			current.extraParams
		);
		if (more) {
			results = {
				...results,
				[providerId]: {
					result: {
						...more,
						entries: [...current.result.entries, ...more.entries]
					},
					searching: false,
					extraParams: current.extraParams
				}
			};
		} else {
			results = { ...results, [providerId]: { ...current, searching: false } };
		}
	}

	function setScope(scoped: boolean) {
		scopeToFolder = scoped;
		if (searchTerm.trim() && Object.keys(results).length > 0) {
			doSearch();
		}
	}

	let activeResults = $derived(
		activeProviderIds
			.map((id) => providers.find((p) => p.id === id))
			.filter((p): p is Provider => !!p && !!results[p.id])
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
			result = result.replaceAll(
				new RegExp(`(${escaped})`, 'ig'),
				`${separator}%b%$1%b%${separator}`
			);
		}
		return result.split(separator).map((token) => ({
			bold: token.startsWith('%b%') && token.endsWith('%b%'),
			value: token.replaceAll('%b%', '')
		}));
	}

	function iconIsClass(icon: string) {
		return !/^\//.test(icon);
	}

	const searchPageBase = generateUrl('/apps/thesearchpage');
	let fullSearchUrl = $derived(
		searchTerm.trim()
			? `${searchPageBase}?terms=${encodeURIComponent(searchTerm.trim())}`
			: searchPageBase
	);

	const settingsUrl = generateUrl('/settings/admin/thesearchpage');
	let showAdminTooltip = $state(false);
	let adminTooltipContainer = $state<HTMLDivElement | undefined>();
	let isTouch = $state(false);

	function toggleAdminTooltip(e: MouseEvent) {
		e.stopPropagation();
		isTouch = true;
		showAdminTooltip = !showAdminTooltip;
	}

	function onAdminTooltipMouseEnter() {
		if (!isTouch) showAdminTooltip = true;
	}

	function onAdminTooltipMouseLeave() {
		if (!isTouch) showAdminTooltip = false;
	}

	function onAdminTooltipClickOutside(e: MouseEvent) {
		if (adminTooltipContainer && !adminTooltipContainer.contains(e.target as Node)) {
			showAdminTooltip = false;
			isTouch = false;
		}
		if (dateFilterContainer && !dateFilterContainer.contains(e.target as Node)) {
			showDateFilter = false;
		}
	}
</script>

<svelte:window onclick={onAdminTooltipClickOutside} onkeydown={onKeydown} />

<div class="mwb-mini-backdrop" onclick={onBackdropClick} onkeydown={onKeydown} role="presentation">
	<div
		aria-label={translate(APP_NAME, 'Search')}
		aria-modal="true"
		class="mwb-mini-modal"
		role="dialog">
		<div class="mwb-mini-header">
			<div class="mwb-mini-title-row">
				<span class="mwb-mini-app-title">{translate(APP_NAME, 'The Search Page')}</span>
				{#if isAdmin}
					<div
						bind:this={adminTooltipContainer}
						class="mwb-mini-admin-info"
						onmouseenter={onAdminTooltipMouseEnter}
						onmouseleave={onAdminTooltipMouseLeave}
						role="group"
						aria-label={translate(APP_NAME, 'Admin information')}>
						<button
							aria-label={translate(APP_NAME, 'Admin configuration available')}
							class="mwb-mini-info-btn"
							onclick={toggleAdminTooltip}
							type="button">
							<svg
								fill="none"
								height="14"
								viewBox="0 0 20 20"
								width="14"
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
									y="14">i</text>
							</svg>
						</button>
						{#if showAdminTooltip}
							<div class="mwb-mini-admin-tooltip" role="tooltip">
								<p>
									{translate(
										APP_NAME,
										'As an administrator, you can configure search providers and result limits.'
									)}
								</p>
								<a
									class="mwb-mini-settings-link"
									href={settingsUrl}
									target="_blank">
									{translate(APP_NAME, 'Go to admin settings')} →
								</a>
							</div>
						{/if}
					</div>
				{/if}
				<button
					aria-label={translate(APP_NAME, 'Close')}
					class="mwb-mini-close"
					onclick={onclose}
					type="button">
					✕
				</button>
			</div>
			<form
				class="mwb-mini-form"
				method="get"
				onsubmit={(e) => {
					e.preventDefault();
					doSearch();
				}}>
				<input
					autocomplete="off"
					bind:this={inputEl}
					bind:value={searchTerm}
					class="mwb-mini-input"
					placeholder={translate(APP_NAME, 'Search…')}
					type="text" />
				<button class="mwb-mini-search-btn" disabled={!searchTerm.trim()} type="submit">
					{translate(APP_NAME, 'Search')}
				</button>
				<div bind:this={dateFilterContainer} class="mwb-mini-date-filter-wrap">
					<button
						aria-label={translate(APP_NAME, 'Date filter')}
						class="mwb-mini-date-btn"
						class:mwb-mini-date-btn--active={hasDateFilter}
						onclick={(e) => {
							e.preventDefault();
							showDateFilter = !showDateFilter;
						}}
						title={translate(APP_NAME, 'Date filter')}
						type="button">
						<svg
							fill="none"
							height="16"
							viewBox="0 0 20 20"
							width="16"
							xmlns="http://www.w3.org/2000/svg">
							<rect
								fill="none"
								height="14"
								rx="2"
								stroke="currentColor"
								stroke-width="1.5"
								width="16"
								x="2"
								y="4" />
							<line
								stroke="currentColor"
								stroke-width="1.5"
								x1="2"
								x2="18"
								y1="8"
								y2="8" />
							<line
								stroke="currentColor"
								stroke-linecap="round"
								stroke-width="1.5"
								x1="6"
								x2="6"
								y1="2"
								y2="6" />
							<line
								stroke="currentColor"
								stroke-linecap="round"
								stroke-width="1.5"
								x1="14"
								x2="14"
								y1="2"
								y2="6" />
						</svg>
						<span aria-hidden="true" class="mwb-mini-date-brackets">
							<span style:visibility={since ? 'visible' : 'hidden'}>[</span>
							<span style:visibility={since || until ? 'visible' : 'hidden'}
								>&rarr;</span>
							<span style:visibility={until ? 'visible' : 'hidden'}>]</span>
						</span>
					</button>
					{#if showDateFilter}
						<div
							class="mwb-mini-date-popup"
							role="dialog"
							aria-label={translate(APP_NAME, 'Date filter')}>
							<label>
								<span>{translate(APP_NAME, 'Since')}</span>
								<input bind:value={since} max={until || undefined} type="date" />
							</label>
							<label>
								<span>{translate(APP_NAME, 'Until')}</span>
								<input bind:value={until} min={since || undefined} type="date" />
							</label>
							<p class="mwb-mini-date-note">
								{translate(APP_NAME, 'Not all providers support date filters.')}
							</p>
							<div class="mwb-mini-date-actions">
								{#if hasDateFilter}
									<button
										class="mwb-mini-date-clear"
										onclick={clearDateFilter}
										type="button">
										{translate(APP_NAME, 'Clear')}
									</button>
								{/if}
								<button
									class="mwb-mini-date-apply"
									onclick={applyDateFilter}
									type="button">
									{translate(APP_NAME, 'Apply')}
								</button>
							</div>
						</div>
					{/if}
				</div>
			</form>
			<a class="mwb-mini-full-search" href={fullSearchUrl} onclick={onclose}>
				{translate(APP_NAME, 'Full search')}
			</a>
		</div>

		{#if showScopeToggle}
			<div class="mwb-mini-scope-bar">
				<span class="mwb-mini-scope-label">{translate(APP_NAME, 'Files:')}</span>
				<button
					type="button"
					class="mwb-mini-scope-tab"
					class:mwb-mini-scope-tab--active={scopeToFolder}
					onclick={() => setScope(true)}>
					{translate(APP_NAME, 'in {folder}', { folder: currentFolderName })}
				</button>
				<button
					type="button"
					class="mwb-mini-scope-tab"
					class:mwb-mini-scope-tab--active={!scopeToFolder}
					onclick={() => setScope(false)}>
					{translate(APP_NAME, 'Everywhere')}
				</button>
			</div>
		{/if}

		<div class="mwb-mini-body">
			{#if noResults}
				<p class="mwb-mini-empty">{translate(APP_NAME, 'No results')}</p>
			{:else if hasAnyResults || searching}
				{#each activeResults as { provider, state } (provider.id)}
					<div class="mwb-mini-provider">
						<h2 class="mwb-mini-provider-name">{provider.name}</h2>
						{#if state.searching && !state.result?.entries?.length}
							<p class="mwb-mini-loading">{translate(APP_NAME, 'Loading…')}</p>
						{:else}
							{#each state.result?.entries ?? [] as entry (entry.resourceUrl)}
								<a class="mwb-mini-result" href={entry.resourceUrl} target="_blank">
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
												{#if token.bold}<b>{token.value}</b
													>{:else}{token.value}{/if}
											{/each}
										</span>
										{#if entry.subline}
											<span class="mwb-mini-result-sub">
												{#each boldTerms(entry.subline, searchTerm) as token, i (`${i}-${token.value}`)}
													{#if token.bold}<b>{token.value}</b
														>{:else}{token.value}{/if}
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
										? translate(APP_NAME, 'Loading…')
										: translate(APP_NAME, 'Load more…')}
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
		@apply flex flex-wrap items-center border-b;
		padding: 6px 12px 8px;
		column-gap: 8px;
		row-gap: 0;
		border-color: var(--color-border);
		flex-shrink: 0;
	}

	.mwb-mini-title-row {
		@apply flex items-center gap-1 w-full;
		padding-bottom: 0;

		.mwb-mini-close {
			margin-left: auto;
		}
	}

	.mwb-mini-app-title {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-maxcontrast);
	}

	.mwb-mini-admin-info {
		@apply relative;
		display: inline-flex;
		align-items: center;
		line-height: 1;
	}

	.mwb-mini-info-btn {
		@apply p-0 m-0 bg-transparent border-none cursor-pointer;
		display: inline-flex;
		align-items: center;
		line-height: 1;
		height: auto;
		color: var(--color-text-maxcontrast);
		transition: color 0.2s;

		&:hover,
		&:focus {
			color: var(--color-main-text);
			outline: none;
		}
	}

	.mwb-mini-admin-tooltip {
		@apply absolute z-50 px-3 py-2 text-sm;
		min-width: 240px;
		max-width: 320px;
		top: 100%;
		left: 0;
		margin-top: 6px;
		background-color: var(--color-main-background);
		color: var(--color-main-text);
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius-large);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		white-space: normal;
		line-height: 1.4;

		p {
			@apply m-0 mb-2;
		}
	}

	.mwb-mini-settings-link {
		@apply inline-block;
		color: var(--color-primary-element);
		text-decoration: none;
		font-weight: 500;

		&:hover {
			text-decoration: underline;
		}
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

	.mwb-mini-full-search {
		flex-shrink: 0;
		font-size: 0.8rem;
		color: var(--color-primary-element);
		text-decoration: none;
		padding: 4px 8px;
		border-radius: var(--border-radius);
		white-space: nowrap;

		&:hover {
			text-decoration: underline;
			background: var(--color-background-hover);
		}
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

	.mwb-mini-scope-bar {
		@apply flex items-center gap-1 px-3 py-1;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-background-dark);
		flex-shrink: 0;
	}

	.mwb-mini-scope-label {
		font-size: 0.75rem;
		color: var(--color-text-maxcontrast);
		margin-right: 4px;
	}

	.mwb-mini-scope-tab {
		font-size: 0.8rem;
		padding: 2px 10px;
		border-radius: 12px;
		border: 1px solid var(--color-border);
		background: none;
		color: var(--color-text-maxcontrast);
		cursor: pointer;
		transition:
			background 0.1s,
			color 0.1s;

		&:hover {
			background: var(--color-background-hover);
			color: var(--color-main-text);
		}
	}

	.mwb-mini-scope-tab--active {
		background: var(--color-primary-element);
		color: var(--color-primary-element-text);
		border-color: var(--color-primary-element);

		&:hover {
			background: var(--color-primary-element-hover, var(--color-primary-element));
			color: var(--color-primary-element-text);
		}
	}

	.mwb-mini-body {
		overflow-y: auto;
		flex: 1;
		padding: 8px 0;
		min-height: 200px;
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

	.mwb-mini-date-filter-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.mwb-mini-date-btn {
		@apply p-0 m-0 bg-transparent border-none cursor-pointer;
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--border-radius);
		color: var(--color-text-maxcontrast);
		transition:
			color 0.15s,
			background 0.15s;

		&:hover {
			color: var(--color-main-text);
			background: var(--color-background-hover);
		}
	}

	.mwb-mini-date-brackets {
		position: absolute;
		top: 1px;
		right: 1px;
		display: flex;
		gap: 1px;
		font-size: 0.55rem;
		font-weight: 700;
		line-height: 1;
		font-family: monospace;
		color: var(--color-primary-element);
		pointer-events: none;
	}

	.mwb-mini-date-btn--active {
		color: var(--color-primary-element);

		&:hover {
			color: var(--color-primary-element);
		}
	}

	.mwb-mini-date-popup {
		@apply absolute z-50 p-3 text-sm;
		top: calc(100% + 6px);
		right: 0;
		min-width: 260px;
		background: var(--color-main-background);
		color: var(--color-main-text);
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius-large);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		gap: 8px;

		label {
			display: flex;
			align-items: center;
			gap: 8px;

			span {
				font-size: 0.8rem;
				color: var(--color-text-maxcontrast);
				white-space: nowrap;
				min-width: 44px;
			}

			input[type='date'] {
				flex: 1;
				padding: 4px 6px;
				font-size: 0.85rem;
				color: var(--color-main-text);
				background: var(--color-background-dark);
				border: 1px solid var(--color-border);
				border-radius: var(--border-radius);

				&:focus {
					outline: 2px solid var(--color-primary);
					border-color: transparent;
				}
			}
		}
	}

	.mwb-mini-date-note {
		font-size: 0.75rem;
		color: var(--color-text-maxcontrast);
		margin: 0;
		line-height: 1.3;
	}

	.mwb-mini-date-actions {
		display: flex;
		justify-content: flex-end;
		gap: 6px;
		margin-top: 2px;
	}

	.mwb-mini-date-clear {
		font-size: 0.8rem;
	}

	.mwb-mini-date-apply {
		font-size: 0.8rem;
	}
</style>
