<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { APP_NAME } from '../constants';
	import settingsStore from '../states/settingsStore.svelte';

	function handleLimitChange(providerId: string, value: string) {
		const limits = { ...settingsStore.settings.providerLimits };
		let limitInt = parseInt(value, 10);

		// Enforce constraints
		if (isNaN(limitInt) || limitInt < 5) {
			limitInt = 5;
		} else if (limitInt > 100) {
			limitInt = 100;
		}

		limits[providerId] = limitInt;
		console.log('Updated provider limits:', limits);
		settingsStore.updateProviderLimits(limits);
	}
</script>

<div class="mwb-provider-limits-section">
	<h3>{translate(APP_NAME, 'Search results per provider')}</h3>
	<p class="mwb-settings-hint">
		{translate(
			APP_NAME,
			'Configure the number of search results to display for each provider (5-100).'
		)}
	</p>
	<p class="mwb-settings-hint mwb-settings-note">
		<strong>{translate(APP_NAME, 'Note:')}</strong>
		{translate(
			APP_NAME,
			'Higher values may result in slower response times, especially for providers with large datasets.'
		)}
	</p>

	<div class="mwb-table-container">
		<table class="mwb-provider-limit-table">
			<thead>
				<tr>
					<th>{translate(APP_NAME, 'Provider')}</th>
					<th>{translate(APP_NAME, 'Results per search')}</th>
				</tr>
			</thead>
			<tbody>
				{#each settingsStore.providers as provider (provider.id)}
					{@const limit = settingsStore.getProviderLimit(provider.id)}
					{@const inputId = `limit_${provider.id}`}
					{@const isAvailable = settingsStore.isProviderAvailableToAnyGroup(provider.id)}
					<tr>
						<td>{provider.name}</td>
						<td class="mwb-limit-cell">
							<input
								type="number"
								id={inputId}
								value={limit}
								min="5"
								max="100"
								step="5"
								class="mwb-limit-input"
								disabled={!isAvailable}
								onchange={(e) =>
									handleLimitChange(provider.id, e.currentTarget.value)} />
							<label for={inputId} class="mwb-screenreader">
								{translate(APP_NAME, 'Number of results for {providerName}', {
									providerName: provider.name
								})}
							</label>
							{#if !isAvailable}
								<span class="mwb-provider-unavailable-hint">
									{translate(APP_NAME, 'Not available to any group')}
								</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.mwb-provider-limits-section {
		margin-top: 32px;
	}

	.mwb-settings-hint {
		color: var(--color-text-maxcontrast);
	}

	.mwb-settings-note {
		margin-top: 8px;
		padding: 8px 12px;
		border-radius: 3px;
		background-color: var(--color-background-dark);
		border-left: 3px solid var(--color-primary-element);
	}

	.mwb-table-container {
		margin-top: 16px;
	}

	.mwb-provider-limit-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 8px;
		max-width: 600px;
		border: 1px solid var(--color-border);
	}

	.mwb-provider-limit-table th,
	.mwb-provider-limit-table td {
		border: 1px solid var(--color-border);
		padding: 8px;
		text-align: left;
	}

	.mwb-provider-limit-table th {
		font-weight: bold;
		background-color: var(--color-background-dark);
	}

	.mwb-limit-cell {
		text-align: center;
	}

	.mwb-limit-input {
		width: 80px;
		text-align: center;
	}

	.mwb-limit-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.mwb-provider-unavailable-hint {
		display: block;
		margin-top: 4px;
		font-style: italic;
		font-size: 0.9em;
		color: var(--color-text-maxcontrast);
	}
</style>
