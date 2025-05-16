// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { get, writable } from 'svelte/store';
import { loadFromSession } from '../lib/session';
import availableProviders from './availableProviders';

const session = loadFromSession();

export const terms = writable(session.terms);
export const providerId = writable(session.providers[0]);
export const providerIds = writable(
	(() => {
		if (!session.providers.length) {
			const available = get(availableProviders);
			return available.map(({ id }) => id);
		}
		return session.providers;
	})()
);
export const isolatedProvider = writable<string | null>(null);

availableProviders.subscribe((providers) => {
	if (!providers.length) {
		return;
	}
	const selectedProviders = get(providerIds);
	if (selectedProviders.length === 0) {
		providerIds.set(providers.map(({ id }) => id));
	}
});

export function isAllSelected(arr: string[]) {
	return get(availableProviders).length === arr.length;
}
