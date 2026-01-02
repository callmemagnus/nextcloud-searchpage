// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { fetchGroups, fetchSettings } from '../lib/api';
import type { Group, Provider, Settings } from '../types';
import { fetchProviders } from '@shared/libs';

class SettingsStore {
	providers = $state<Provider[]>([]);
	groups = $state<Group[]>([]);
	settings = $state<Settings>({
		enabled: false,
		providers: [],
		providerGroupMap: {},
		providerLimits: {}
	});
	newProviders = $state<Provider[]>([]);
	loading = $state(true);
	error = $state<string | null>(null);

	async init() {
		this.loading = true;
		this.error = null;

		try {
			const [providers, groups, settings] = await Promise.all([
				fetchProviders(),
				fetchGroups(),
				fetchSettings()
			]);

			if (
				settings.providers?.length !== 0 &&
				providers.length !== settings.providers?.length
			) {
				const knownProviders = settings.providers.map((p) => p.id);
				this.newProviders = providers.reduce((acc, provider) => {
					if (knownProviders.includes(provider.id)) {
						acc.push(provider);
					}
					return acc;
				}, [] as Provider[]);
			}

			this.providers = providers.map(({ id, name }) => ({ id, name }));
			this.groups = groups;
			this.settings = settings;

			let settingsWithDefaults = settings;

			if (
				settings.providerGroupMap === null ||
				Object.keys(settings.providerGroupMap).length === 0
			) {
				settingsWithDefaults = {
					...settingsWithDefaults,
					providerGroupMap: providers.reduce(
						(acc, provider) => {
							acc[provider.id] = [...groups.map(({ id }) => id), '__all__'];
							return acc;
						},
						{} as Record<string, string[]>
					)
				};
			}

			if (settings.providerLimits === null) {
				settingsWithDefaults = {
					...settingsWithDefaults,
					providerLimits: providers.reduce(
						(acc, provider) => {
							acc[provider.id] = 10;
							return acc;
						},
						{} as Record<string, number>
					)
				};
			}
			this.settings = settingsWithDefaults;
		} catch (e) {
			this.error = (e as Error).message || 'Failed to load settings';
			console.error('Error initializing settings:', e);
		} finally {
			this.loading = false;
		}
	}

	updateEnabled(enabled: boolean) {
		this.settings.enabled = enabled;
	}

	updateProviderGroupMap(providerGroupMap: Record<string, string[]>) {
		this.settings.providerGroupMap = providerGroupMap;
	}

	updateProviderLimits(providerLimits: Record<string, number>) {
		this.settings.providerLimits = providerLimits;
	}

	isProviderEnabledForGroup(providerId: string, groupId: string): boolean {
		// If restrictions are not enabled, all providers are enabled for all groups
		if (!this.settings.enabled || !this.settings.providerGroupMap) {
			return true;
		}

		// If provider has group settings, check if this group is in the list
		if (providerId in this.settings.providerGroupMap) {
			return this.settings.providerGroupMap[providerId].includes(groupId);
		}

		// Provider is not in the map but restrictions are enabled and other settings exist
		// This means all groups were unchecked for this provider
		return false;
	}

	isProviderAvailableToAnyGroup(providerId: string): boolean {
		// If restrictions are not enabled, all providers are available
		if (!this.settings.enabled || !this.settings.providerGroupMap) {
			return true;
		}

		// If no settings exist (initial state), default to available
		if (Object.keys(this.settings.providerGroupMap).length === 0) {
			return true;
		}

		// If provider has restrictions configured, check if at least one group is assigned
		if (providerId in this.settings.providerGroupMap) {
			return this.settings.providerGroupMap[providerId].length > 0;
		}

		// Provider is not in the map but restrictions are enabled and other settings exist
		// This means all groups were unchecked for this provider
		return false;
	}

	getProviderLimit(providerId: string): number {
		return this.settings?.providerLimits?.[providerId] ?? 10;
	}
}

const settingsStore = new SettingsStore();
export default settingsStore;
