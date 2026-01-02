<script lang="ts">
	// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
	// SPDX-License-Identifier: AGPL-3.0-or-later

	import { translate } from '@nextcloud/l10n';
	import { APP_NAME } from '../constants';
	import settingsStore from '../states/settingsStore.svelte';

	// Build ordered groups list (admin first, then other groups, then "Default configuration")
	const orderedGroups = $derived.by(() => {
		const groups = [...settingsStore.groups];
		const adminGroup = groups.find((g) => g.id === 'admin');
		const otherGroups = groups.filter((g) => g.id !== 'admin');

		const result = [];
		if (adminGroup) result.push(adminGroup);
		result.push(...otherGroups);
		result.push({ id: '__all__', displayName: translate(APP_NAME, 'Default configuration') });

		return result;
	});

	function handleCheckboxChange(providerId: string, groupId: string, checked: boolean) {
		const map = { ...settingsStore.settings.providerGroupMap };

		if (!map[providerId]) {
			map[providerId] = [];
		}

		if (checked) {
			if (!map[providerId].includes(groupId)) {
				map[providerId] = [...map[providerId], groupId];
			}
		} else {
			map[providerId] = map[providerId].filter((id) => id !== groupId);
		}

		console.log('Updated provider group map:', map);
		settingsStore.updateProviderGroupMap(map);
	}
</script>

{#if settingsStore.settings.enabled}
	{#if settingsStore.newProviders.length > 0}
		<div class="mwb-warning-box">
			<div class="mwb-warning-icon">⚠️</div>
			<div class="mwb-warning-content">
				<p class="mwb-warning-title">
					{translate(APP_NAME, 'New search providers detected')}
				</p>
				<p class="mwb-warning-message">
					{translate(
						APP_NAME,
						'The following provider(s) were not available when settings were last saved: {providers}',
						{ providers: settingsStore.newProviders.map((p) => p.name).join(', ') }
					)}
				</p>
				<p class="mwb-warning-action">
					{translate(
						APP_NAME,
						'Please review the visibility settings for these providers below and save your changes.'
					)}
				</p>
			</div>
		</div>
	{/if}
	<div class="mwb-provider-group-table-container">
		<table class="mwb-provider-group-table">
			<thead>
				<tr>
					<th>{translate(APP_NAME, 'User group')}</th>
					{#each settingsStore.providers as provider (provider.id)}
						<th>{provider.name}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each orderedGroups as group (group.id)}
					<tr class="mwb-group-row">
						<td class="mwb-group-name">{group.displayName}</td>
						{#each settingsStore.providers as provider (provider.id)}
							{@const checkboxId = `provider_${provider.id}_group_${group.id}`}
							{@const labelText = translate(
								APP_NAME,
								'Enable {providerName} for {groupName}',
								{
									providerName: provider.name,
									groupName: group.displayName
								}
							)}
							{@const isChecked = settingsStore.isProviderEnabledForGroup(
								provider.id,
								group.id
							)}
							<td class="mwb-checkbox-cell">
								<input
									type="checkbox"
									id={checkboxId}
									class="checkbox"
									checked={isChecked}
									title={labelText}
									onchange={(e) =>
										handleCheckboxChange(
											provider.id,
											group.id,
											e.currentTarget.checked
										)} />
								<label for={checkboxId}>
									<span class="mwb-screenreader">{labelText}</span>
								</label>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.mwb-warning-box {
		display: flex;
		gap: 12px;
		padding: 16px;
		margin-bottom: 20px;
		border-left: 4px solid var(--color-warning, #f59e0b);
	}

	.mwb-warning-icon {
		font-size: 24px;
		flex-shrink: 0;
		line-height: 1;
	}

	.mwb-warning-content {
		flex: 1;
	}

	.mwb-warning-title {
		margin: 0 0 8px 0;
		font-weight: 600;
		color: var(--color-warning-text, #92400e);
	}

	.mwb-warning-message {
		margin: 0 0 8px 0;
		color: var(--color-main-text);
	}

	.mwb-warning-action {
		margin: 0;
		font-style: italic;
		color: var(--color-text-maxcontrast);
	}

	.mwb-provider-group-table-container {
		margin-top: 20px;
	}

	.mwb-provider-group-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 8px;
		border: 1px solid var(--color-border);
		table-layout: fixed;
	}

	.mwb-provider-group-table th,
	.mwb-provider-group-table td {
		border: 1px solid var(--color-border);
		padding: 8px;
		text-align: left;
	}

	.mwb-provider-group-table th {
		font-weight: bold;
		background-color: var(--color-main-background);
	}

	.mwb-provider-group-table th:first-child,
	.mwb-provider-group-table td:first-child {
		width: 200px;
	}

	.mwb-checkbox-cell {
		text-align: center;
	}

	.mwb-group-name {
		font-weight: 500;
	}

	.mwb-group-row {
		background-color: var(--color-main-background);
	}

	.mwb-group-row:hover {
		background-color: var(--color-background-hover);
	}

	.mwb-checkbox-cell input[type='checkbox'] {
		width: 16px;
		height: 16px;
		cursor: pointer;
	}
</style>
