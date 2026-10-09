<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { onMount } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
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
	import { session } from './session.svelte';

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
	let results = $state<Record<string, ProviderState>>({});
	let searching = $state(false);
	let scopeToFolder = $state(true);
	let since = $state('');
	let until = $state('');
	let showDateFilter = $state(false);
	let dateFilterContainer = $state<HTMLDivElement | undefined>();
	let selectedIndex = $state(-1);
	let resultsBody = $state<HTMLDivElement | undefined>();

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
		if (session.term.trim() && Object.keys(results).length > 0) {
			doSearch();
		}
	}

	function clearDateFilter() {
		since = '';
		until = '';
		if (session.term.trim() && Object.keys(results).length > 0) {
			doSearch();
		}
	}

	async function doSearch() {
		const term = session.term.trim();
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

	// Debounced search-as-you-type: main.ts streams every keystroke from the
	// native/synthetic search box into session.term; we react to it here
	// rather than owning an input ourselves.
	let debounceHandle: number | undefined;
	$effect(() => {
		const term = session.term.trim();
		window.clearTimeout(debounceHandle);
		if (!term) {
			results = {};
			return;
		}
		debounceHandle = window.setTimeout(doSearch, 300);
		return () => window.clearTimeout(debounceHandle);
	});

	function setScope(scoped: boolean) {
		scopeToFolder = scoped;
		if (session.term.trim() && Object.keys(results).length > 0) {
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

	// Flat, render-order list of the entries actually shown, so arrow-key
	// navigation can index across providers with a single counter.
	let flatEntries = $derived(
		activeResults.flatMap(({ provider, state }) =>
			(state.result?.entries ?? []).slice(0, getProviderLimit(provider.id))
		)
	);

	// Cumulative offset of each provider's first entry within flatEntries, so
	// the per-provider #each block can compute a global index for each row.
	let providerOffsets = $derived.by(() => {
		const offsets: Record<string, number> = {};
		let offset = 0;
		for (const { provider, state } of activeResults) {
			offsets[provider.id] = offset;
			offset += (state.result?.entries ?? []).slice(0, getProviderLimit(provider.id)).length;
		}
		return offsets;
	});

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
		if (e.key === 'Escape') {
			onclose();
			return;
		}
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			if (!flatEntries.length) return;
			e.preventDefault();
			const delta = e.key === 'ArrowDown' ? 1 : -1;
			selectedIndex = (selectedIndex + delta + flatEntries.length) % flatEntries.length;
			return;
		}
		if (e.key === 'Enter' && selectedIndex >= 0 && flatEntries[selectedIndex]) {
			e.preventDefault();
			window.open(flatEntries[selectedIndex].resourceUrl, '_blank');
		}
	}

	// Any change to the search term invalidates the current selection,
	// including keystrokes before the debounced re-search fires.
	$effect(() => {
		void session.term;
		selectedIndex = -1;
	});

	$effect(() => {
		if (selectedIndex < 0 || !resultsBody) return;
		resultsBody
			.querySelector(`[data-mwb-index="${selectedIndex}"]`)
			?.scrollIntoView({ block: 'nearest' });
	});

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
		session.term.trim()
			? `${searchPageBase}?terms=${encodeURIComponent(session.term.trim())}`
			: searchPageBase
	);

	function hasMoreThanShown(providerId: string, result: SearchResult | null): boolean {
		if (!result) return false;
		if (computeHasMore(result)) return true;
		// The panel caps each provider to its configured limit, so hitting that
		// limit means the provider likely holds more than what's displayed here,
		// even if the API's own cursor/pagination signal says otherwise.
		return result.entries.length >= getProviderLimit(providerId);
	}

	function providerSearchUrl(providerId: string): string {
		const params = new SvelteURLSearchParams();
		const term = session.term.trim();
		if (term) {
			params.set('terms', term);
		}
		params.set('provider', providerId);
		return `${searchPageBase}?${params}`;
	}

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

	// Anchor the panel directly below the search box's bounding rect, like a
	// combobox dropdown, clamped so it never runs off the right/bottom edge.
	let panelStyle = $derived.by(() => {
		const rect = session.anchorRect;
		if (!rect) return 'visibility: hidden;';
		const width = Math.max(rect.width, 320);
		const left = Math.min(Math.max(rect.left, 8), window.innerWidth - width - 8);
		const top = rect.bottom + 8;
		return `top:${top}px; left:${left}px; width:${width}px;`;
	});
</script>

<svelte:window onclick={onAdminTooltipClickOutside} onkeydown={onKeydown} />

<div class="mwb-mini-backdrop" onclick={onBackdropClick} role="presentation">
	<div
		aria-label={translate(APP_NAME, 'Search results')}
		aria-modal="true"
		class="mwb-mini-panel"
		role="dialog"
		style={panelStyle}>
		<div class="mwb-mini-header">
			<div class="mwb-mini-controls-row">
				<div bind:this={dateFilterContainer} class="mwb-mini-date-filter-wrap">
					<button
						aria-label={translate(APP_NAME, 'Date filter')}
						class="mwb-mini-date-btn"
						class:mwb-mini-date-btn--active={hasDateFilter}
						onclick={() => (showDateFilter = !showDateFilter)}
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
				<a class="mwb-mini-full-search" href={fullSearchUrl} onclick={onclose}>
					{translate(APP_NAME, 'Full search')}
				</a>
			</div>
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

		<div bind:this={resultsBody} class="mwb-mini-body">
			{#if noResults}
				<p class="mwb-mini-empty">{translate(APP_NAME, 'No results')}</p>
			{:else if hasAnyResults || searching}
				{#each activeResults as { provider, state } (provider.id)}
					<div class="mwb-mini-provider">
						<div class="mwb-mini-provider-header">
							<h2 class="mwb-mini-provider-name">{provider.name}</h2>
							{#if hasMoreThanShown(provider.id, state.result ?? null)}
								<a
									class="mwb-mini-provider-full-link"
									href={providerSearchUrl(provider.id)}
									onclick={onclose}>
									{translate(APP_NAME, 'See all in {provider}', {
										provider: provider.name
									})}
								</a>
							{/if}
						</div>
						{#if state.searching && !state.result?.entries?.length}
							<p class="mwb-mini-loading">{translate(APP_NAME, 'Loading…')}</p>
						{:else}
							{#each (state.result?.entries ?? []).slice(0, getProviderLimit(provider.id)) as entry, i (entry.resourceUrl)}
								<a
									class="mwb-mini-result"
									class:mwb-mini-result--selected={selectedIndex ===
										providerOffsets[provider.id] + i}
									data-mwb-index={providerOffsets[provider.id] + i}
									href={entry.resourceUrl}
									target="_blank">
									<div class="mwb-mini-result-icon">
										{#if iconIsClass(entry.icon)}
											<div class="{entry.icon} mwb-mini-icon-class"></div>
										{:else}
											<img src={entry.icon} alt="" />
										{/if}
									</div>
									<div class="mwb-mini-result-text">
										<span class="mwb-mini-result-title">
											{#each boldTerms(entry.title, session.term) as token, i (`${i}-${token.value}`)}
												{#if token.bold}<b>{token.value}</b
													>{:else}{token.value}{/if}
											{/each}
										</span>
										{#if entry.subline}
											<span class="mwb-mini-result-sub">
												{#each boldTerms(entry.subline, session.term) as token, i (`${i}-${token.value}`)}
													{#if token.bold}<b>{token.value}</b
														>{:else}{token.value}{/if}
												{/each}
											</span>
										{/if}
									</div>
								</a>
							{/each}
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<div class="mwb-mini-footer">
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
							<a class="mwb-mini-settings-link" href={settingsUrl} target="_blank">
								{translate(APP_NAME, 'Go to admin settings')} →
							</a>
						</div>
					{/if}
				</div>
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
	}

	.mwb-mini-panel {
		position: fixed;
		background: var(--color-main-background);
		color: var(--color-main-text);
		border-radius: var(--border-radius-large, 12px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		max-width: min(680px, calc(100vw - 16px));
		max-height: min(75vh, calc(100vh - 96px));
		display: flex;
		flex-direction: column;
		overflow: hidden;
		z-index: 10001;
	}

	.mwb-mini-header {
		@apply flex flex-col border-b;
		padding: 6px 12px 8px;
		row-gap: 4px;
		border-color: var(--color-border);
		flex-shrink: 0;
	}

	.mwb-mini-footer {
		@apply flex items-center gap-1 w-full;
		padding: 3px 12px;
		border-top: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.mwb-mini-app-title {
		font-size: 0.6rem;
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
		bottom: 100%;
		left: 0;
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

	.mwb-mini-controls-row {
		@apply flex items-center gap-2;
	}

	.mwb-mini-full-search {
		flex-shrink: 0;
		margin-left: auto;
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
		min-height: 120px;
	}

	.mwb-mini-empty,
	.mwb-mini-loading {
		@apply px-4 py-2;
		color: var(--color-text-lighter);
	}

	.mwb-mini-provider {
		@apply mb-4;
	}

	.mwb-mini-provider-header {
		@apply flex items-baseline justify-between gap-2 px-4 pt-2 pb-1;
		border-bottom: 1px solid var(--color-border-dark, var(--color-border));
		margin: 0 0 4px;
	}

	.mwb-mini-provider-name {
		@apply text-sm font-semibold uppercase tracking-wide truncate;
		color: var(--color-text-lighter);
		margin: 0;
	}

	.mwb-mini-provider-full-link {
		@apply text-xs shrink-0 cursor-pointer!;
		color: var(--color-primary-element);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}

	.mwb-mini-result {
		@apply flex items-center gap-3 px-4 py-2 cursor-pointer;
		color: var(--color-main-text);
		text-decoration: none;

		&:hover {
			background: var(--color-background-hover);
		}
	}

	.mwb-mini-result--selected {
		background: var(--color-background-hover);
		outline: 2px solid var(--color-primary-element);
		outline-offset: -2px;
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
		left: 0;
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
