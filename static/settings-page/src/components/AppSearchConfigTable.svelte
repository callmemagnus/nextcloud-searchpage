<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { APP_NAME } from '../constants';
	import settingsStore from '../states/settingsStore.svelte';

	const SETTINGS_KEY = '__settings__';

	type Row = { id: string; name: string; special?: boolean };

	let rows = $derived<Row[]>([
		{ id: SETTINGS_KEY, name: translate(APP_NAME, 'Settings pages'), special: true },
		...settingsStore.settings.apps
	]);

	function getEntry(appId: string) {
		return (
			settingsStore.settings.appSearchConfig[appId] ?? { enabled: true, providerIds: null }
		);
	}

	function onEnabledChange(appId: string, e: Event) {
		settingsStore.updateAppSearchConfig(appId, {
			enabled: (e.target as HTMLInputElement).checked
		});
	}

	function getSelectedIds(appId: string): string[] {
		return getEntry(appId).providerIds ?? [];
	}

	function isAllProviders(appId: string): boolean {
		const ids = getEntry(appId).providerIds;
		return ids === null || ids.length === 0;
	}

	function addProvider(appId: string, providerId: string) {
		if (!providerId) return;
		const current = getSelectedIds(appId);
		if (current.includes(providerId)) return;
		settingsStore.updateAppSearchConfig(appId, {
			providerIds: [...current, providerId]
		});
	}

	function removeProvider(appId: string, providerId: string) {
		const next = getSelectedIds(appId).filter((id) => id !== providerId);
		settingsStore.updateAppSearchConfig(appId, {
			providerIds: next.length ? next : null
		});
	}

	function moveProvider(appId: string, index: number, direction: -1 | 1) {
		const ids = [...getSelectedIds(appId)];
		const target = index + direction;
		if (target < 0 || target >= ids.length) return;
		[ids[index], ids[target]] = [ids[target], ids[index]];
		settingsStore.updateAppSearchConfig(appId, { providerIds: ids });
	}

	function resetToAll(appId: string) {
		settingsStore.updateAppSearchConfig(appId, { providerIds: null });
	}

	function availableToAdd(appId: string) {
		const selected = getSelectedIds(appId);
		return settingsStore.providers.filter((p) => !selected.includes(p.id));
	}
</script>

<div class="mwb-app-search-config-section">
	<h3>{translate(APP_NAME, 'Search override per application')}</h3>
	<p class="mwb-settings-hint">
		{translate(
			APP_NAME,
			'Configure which applications have their search button overridden, and which search providers to use (and in which order) when the inline search modal opens.'
		)}
	</p>
	<p class="mwb-settings-hint">
		{translate(
			APP_NAME,
			'The provider restrictions configured above (if any) will be enforced in the mini-search.'
		)}
	</p>

	{#if settingsStore.settings.apps.length === 0}
		<p class="mwb-settings-hint">{translate(APP_NAME, 'No applications found.')}</p>
	{:else}
		<div class="mwb-app-search-config-table-container">
			<table class="mwb-app-search-config-table">
				<thead>
					<tr>
						<th>{translate(APP_NAME, 'Application')}</th>
						<th>{translate(APP_NAME, 'Override search')}</th>
						<th>{translate(APP_NAME, 'Search providers (in order)')}</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.id)}
						{@const entry = getEntry(row.id)}
						{@const enabledId = `app-search-enabled-${row.id}`}
						{@const selectedIds = getSelectedIds(row.id)}
						{@const unselected = availableToAdd(row.id)}
						<tr
							class:mwb-row-special={row.special}
							class:mwb-row-disabled={!entry.enabled}>
							<td>
								{#if row.special}
									<span class="mwb-special-row-name">{row.name}</span>
									<span class="mwb-special-row-hint">/settings/…</span>
								{:else}
									{row.name}
								{/if}
							</td>
							<td class="mwb-checkbox-cell">
								<input
									type="checkbox"
									id={enabledId}
									class="checkbox"
									checked={entry.enabled}
									onchange={(e) => onEnabledChange(row.id, e)} />
								<label for={enabledId}></label>
							</td>
							<td class="mwb-providers-cell">
								{#if isAllProviders(row.id)}
									<span class="mwb-all-providers-label"
										>{translate(APP_NAME, 'All providers')}</span>
								{:else}
									<ol class="mwb-provider-order-list">
										{#each selectedIds as pid, i (pid)}
											{@const providerName =
												settingsStore.providers.find((p) => p.id === pid)
													?.name ?? pid}
											<li class="mwb-provider-order-item">
												<span class="mwb-provider-order-name"
													>{providerName}</span>
												{#if entry.enabled}
													<div class="mwb-provider-order-actions">
														{#if i > 0}
															<button
																aria-label={translate(
																	APP_NAME,
																	'Move up'
																)}
																class="mwb-btn-move"
																onclick={() =>
																	moveProvider(row.id, i, -1)}
																type="button">&uarr;</button>
														{:else}
															<span class="mwb-btn-placeholder"
															></span>
														{/if}
														{#if i < selectedIds.length - 1}
															<button
																aria-label={translate(
																	APP_NAME,
																	'Move down'
																)}
																class="mwb-btn-move"
																onclick={() =>
																	moveProvider(row.id, i, 1)}
																type="button">&darr;</button>
														{:else}
															<span class="mwb-btn-placeholder"
															></span>
														{/if}
														<button
															aria-label={translate(
																APP_NAME,
																'Remove'
															)}
															class="mwb-btn-remove"
															onclick={() =>
																removeProvider(row.id, pid)}
															type="button">&cross;</button>
													</div>
												{/if}
											</li>
										{/each}
									</ol>
								{/if}
								{#if entry.enabled}
									<div class="mwb-provider-add-row">
										{#if unselected.length > 0}
											<select
												onchange={(e) => {
													addProvider(
														row.id,
														(e.target as HTMLSelectElement).value
													);
													(e.target as HTMLSelectElement).value = '';
												}}>
												<option value=""
													>{translate(APP_NAME, 'Add provider…')}</option>
												{#each unselected as p (p.id)}
													<option value={p.id}>{p.name}</option>
												{/each}
											</select>
										{/if}
										{#if !isAllProviders(row.id)}
											<button
												class="mwb-reset-all-btn"
												onclick={() => resetToAll(row.id)}
												type="button"
												>{translate(APP_NAME, 'Use all')}</button>
										{/if}
									</div>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.mwb-app-search-config-section {
		margin-top: 24px;
	}

	.mwb-app-search-config-section h3 {
		margin-top: 0;
		margin-bottom: 8px;
		font-size: 1.1em;
		font-weight: 600;
	}

	.mwb-settings-hint {
		color: var(--color-text-maxcontrast);
		margin-top: 0;
		margin-bottom: 8px;
	}

	.mwb-app-search-config-table-container {
		margin-top: 16px;
	}

	.mwb-app-search-config-table {
		width: 100%;
		border-collapse: collapse;
		max-width: 780px;
		border: 1px solid var(--color-border);
	}

	.mwb-app-search-config-table th,
	.mwb-app-search-config-table td {
		border: 1px solid var(--color-border);
		padding: 8px 12px;
		text-align: left;
		vertical-align: top;
	}

	.mwb-app-search-config-table th {
		font-weight: bold;
		background-color: var(--color-background-dark);
	}

	.mwb-checkbox-cell {
		text-align: center;
		width: 120px;
		vertical-align: middle;
	}

	.mwb-providers-cell {
		min-width: 240px;
	}

	.mwb-row-disabled td {
		opacity: 0.5;
	}

	.mwb-row-special td {
		background: var(--color-background-dark);
	}

	.mwb-special-row-name {
		display: block;
		font-weight: 600;
	}

	.mwb-special-row-hint {
		font-size: 0.8em;
		color: var(--color-text-maxcontrast);
		font-family: monospace;
	}

	.mwb-all-providers-label {
		font-size: 0.9em;
		color: var(--color-text-maxcontrast);
	}

	.mwb-provider-order-list {
		list-style: none;
		margin: 0 0 6px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.mwb-provider-order-item {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--color-background-dark);
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius);
		padding: 3px 6px;
	}

	.mwb-provider-order-name {
		flex: 1;
		font-size: 0.9em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mwb-provider-order-actions {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
	}

	.mwb-btn-placeholder {
		display: inline-block;
		width: 22px;
	}

	.mwb-btn-move,
	.mwb-btn-remove {
		padding: 2px 6px;
		font-size: 0.85em;
		font-weight: 700;
		line-height: 1.4;
		cursor: pointer;
		border-radius: var(--border-radius);
		border: none;
		min-width: 22px;
	}

	.mwb-btn-move {
		background: var(--color-primary-element);
		color: var(--color-primary-element-text);

		&:hover:not(:disabled) {
			background: var(--color-primary-element-hover, var(--color-primary-element));
		}
	}

	.mwb-btn-remove {
		background: #f38a8a;
		color: #fff;

		&:hover {
			background-color: red;
			filter: brightness(90%);
		}
	}

	.mwb-provider-add-row {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;

		select {
			font-size: 0.85em;
		}
	}

	.mwb-reset-all-btn {
		font-size: 0.8em;
		padding: 3px 8px;
		background: none;
		border: 1px solid var(--color-border);
		border-radius: var(--border-radius);
		cursor: pointer;
		color: var(--color-text-maxcontrast);

		&:hover {
			background: var(--color-background-hover);
			color: var(--color-main-text);
		}
	}
</style>
