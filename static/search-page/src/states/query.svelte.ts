// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadFromSession } from '../lib/session';
import availableProviders from './availableProviders.svelte';

const session = loadFromSession();

class QueryState {
	terms = $state(session.terms);
	providerId = $state<string | null>(null);
	providerIds = $state<string[]>(
		(() => {
			if (!session.providers.length) {
				const available = availableProviders.providers;
				return available.map(({ id }) => id);
			}
			return session.providers.filter((id) =>
				availableProviders.providers.map(({ id }) => id).includes(id)
			);
		})()
	);
	isolatedProvider = $state<string | null>(null);
	isAllSelected = $derived(availableProviders.providers.length === this.providerIds.length);

	constructor() {
		// Watch for providers to load and initialize providerIds if empty
		const checkInterval = setInterval(() => {
			const providers = availableProviders.providers;
			if (!providers.length) {
				return;
			}
			if (this.providerIds.length === 0) {
				this.providerIds = providers.map(({ id }) => id);
			}
			// Once initialized, clear the interval
			if (this.providerIds.length > 0 || providers.length > 0) {
				clearInterval(checkInterval);
			}
		}, 50);
	}
}

const queryState = new QueryState();

export default queryState;

// Export individual properties for backward compatibility
export const { terms, providerId, providerIds, isolatedProvider } = queryState;
