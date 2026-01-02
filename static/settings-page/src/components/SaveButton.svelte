<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate as t } from '@nextcloud/l10n';
	import { APP_NAME } from '../constants';
	import { saveSettings } from '../lib/api';
	import settingsStore from '../states/settingsStore.svelte';

	let saving = $state(false);
	let saveMessage = $state<string | null>(null);
	let saveSuccess = $state(false);

	async function handleSave() {
		saving = true;
		saveMessage = null;

		try {
			const result = await saveSettings({
				...settingsStore.settings,
				providers: settingsStore.providers
			});

			if (result.success) {
				saveSuccess = true;
				saveMessage = result.message || t(APP_NAME, 'Settings saved successfully');
			} else {
				saveSuccess = false;
				saveMessage = result.error || t(APP_NAME, 'Error saving settings');
			}
		} catch (e) {
			saveSuccess = false;
			saveMessage = t(APP_NAME, 'Error saving settings');
			console.error('Error saving settings:', e);
		} finally {
			saving = false;

			// Clear message after 5 seconds
			setTimeout(() => {
				saveMessage = null;
			}, 5000);
		}
	}
</script>

<div class="mwb-save-section">
	<button class="button primary" disabled={saving} onclick={handleSave} type="button">
		{saving ? t(APP_NAME, 'Saving...') : t(APP_NAME, 'Save')}
	</button>

	{#if saveMessage}
		<div class="mwb-save-message {saveSuccess ? 'mwb-success' : 'mwb-error'}">
			{saveMessage}
		</div>
	{/if}
</div>

<style>
	.mwb-save-section {
		margin-top: 16px;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.mwb-save-message {
		padding: 8px 12px;
		border-radius: 3px;
	}

	.mwb-save-message.mwb-success {
		color: var(--color-success);
		background-color: var(--color-success-background, rgba(70, 176, 88, 0.1));
	}

	.mwb-save-message.mwb-error {
		color: var(--color-error);
		background-color: var(--color-error-background, rgba(233, 50, 45, 0.1));
	}
</style>
