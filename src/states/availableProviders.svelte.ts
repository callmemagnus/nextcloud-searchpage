// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadState } from '@nextcloud/initial-state';

export type Provider = {
	id: string;
	name: string;
	limit: number;
};

class AvailableProvidersState {
	providers = $state<Provider[]>([]);

	constructor() {
		this.load();
	}

	load() {
		try {
			// Load the pre-filtered list of providers with their limits from backend
			this.providers = loadState<Provider[]>('thesearchpage', 'availableProviders');
		} catch (e) {
			// If initial state is not available, providers will be empty
			console.warn('Failed to load available providers from initial state', e);
			this.providers = [];
		}
	}
}

const availableProviders = new AvailableProvidersState();

export default availableProviders;
