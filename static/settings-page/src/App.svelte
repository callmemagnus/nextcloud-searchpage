<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { onMount } from 'svelte';
	import { APP_NAME } from './constants';
	import settingsStore from './states/settingsStore.svelte';
	import ProviderRestrictionsTable from './components/ProviderRestrictionsTable.svelte';
	import ProviderLimitsTable from './components/ProviderLimitsTable.svelte';
	import SaveButton from './components/SaveButton.svelte';

	let hasTabbed = $state(false);

	function onKeydown(event: KeyboardEvent) {
		if (event.code === 'Tab' && !hasTabbed) {
			hasTabbed = true;
		}
	}

	onMount(() => {
		settingsStore.init();
	});

	function handleEnabledChange(event: Event) {
		const target = event.target as HTMLInputElement;
		settingsStore.updateEnabled(target.checked);
	}
</script>

<svelte:body onkeydown={onKeydown} />

<div class="mwb-settings {hasTabbed ? 'mwb-tabbed' : ''}">
	<h2>{translate(APP_NAME, 'The Search Page settings')}</h2>

	{#if settingsStore.loading}
		<div class="mwb-loading-state">
			<p>{translate(APP_NAME, 'Loading settings...')}</p>
		</div>
	{:else if settingsStore.error}
		<div class="mwb-error-state">
			<p>
				{translate(APP_NAME, 'Error loading settings: {error}', {
					error: settingsStore.error
				})}
			</p>
		</div>
	{:else}
		<div class="mwb-settings-content">
			<p class="mwb-settings-hint">
				{translate(APP_NAME, 'Configure search provider visibility per group.')}
			</p>

			<div class="mwb-enable-restrictions">
				<p>
					<input
						type="checkbox"
						id="restrict-providers-enabled"
						class="checkbox"
						checked={settingsStore.settings.enabled}
						onchange={handleEnabledChange} />
					<label for="restrict-providers-enabled">
						<strong>{translate(APP_NAME, 'Enable provider restrictions')}</strong>
					</label>
				</p>
			</div>

			<div class="mwb-restrictions-info">
				<p class="mwb-settings-hint">
					{translate(
						APP_NAME,
						'When enabled, you can control which search providers are visible to specific user groups. By default, all providers are enabled for all groups.'
					)}
				</p>
			</div>

			<ProviderRestrictionsTable />
			<ProviderLimitsTable />
			<SaveButton />
		</div>
	{/if}
</div>

<style>
	.mwb-settings {
		width: 100%;
		padding-top: 12px;
		padding-left: 16px;
		padding-right: 8px;
		height: 100%;
		overflow-y: auto;
		color: var(--color-main-text);
		background-color: var(--color-main-background-blur, var(--color-main-background));
	}

	.mwb-loading-state,
	.mwb-error-state {
		padding: 16px;
	}

	.mwb-error-state {
		color: var(--color-error);
	}

	.mwb-settings-content {
		padding-bottom: 24px;
	}

	.mwb-settings-hint {
		color: var(--color-text-maxcontrast);
	}

	.mwb-enable-restrictions {
		margin-top: 24px;
	}

	.mwb-restrictions-info {
		margin-top: 12px;
	}
</style>
