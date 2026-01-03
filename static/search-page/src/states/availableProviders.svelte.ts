// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadState } from '@nextcloud/initial-state';
import { APP_NAME, fetchProviders, type Provider } from '@shared/libs';

class AvailableProvidersState {
	providers = $state<Provider[]>([]);

	constructor() {
		this.load();
	}

	async load() {
		try {
			// Load the pre-filtered list of providers with their limits from backend
			this.providers = loadState<Provider[]>(APP_NAME, 'availableProviders');
			if (this.providers.length === 0) {
				const enabled = loadState<boolean>(APP_NAME, 'isEnabled');
				if (!enabled) {
					// load existing providers
					this.providers = await fetchProviders();
				}
			}
		} catch (e) {
			// If initial state is not available, providers will be empty
			console.warn('Failed to load available providers from initial state', e);
			this.providers = [];
		}
	}
}

const availableProviders = new AvailableProvidersState();

export default availableProviders;
