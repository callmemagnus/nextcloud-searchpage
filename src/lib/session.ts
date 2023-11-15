// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PROVIDER_ALL } from '$/constants';

export function saveInSession(terms: string, providerIds: string[]) {
	if (!terms.length || !providerIds.length) {
		return;
	}

	const newState = new URLSearchParams();
	if (terms) {
		newState.append('terms', terms);
	}
	if (providerIds) {
		providerIds.forEach((p) => {
			newState.append('provider', p);
		});
	}

	try {
		history.pushState(
			null,
			'',
			(newState.size ? location.pathname + '?' + newState : location.pathname) + location.hash
		);
	} catch (e) {
		// ignore
	}
}

export function loadFromSession() {
	const { search } = location;

	if (search) {
		const state = new URLSearchParams(search);
		return {
			terms: state.get('terms') || '',
			providers: state.getAll('provider') || [PROVIDER_ALL]
		};
	}
	return { terms: '', providers: [PROVIDER_ALL] };
}
