// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PROVIDER_ALL } from './search';

export function saveInSession(terms: string, providerId: string) {
	const newState = new URLSearchParams();
	if (terms) {
		newState.append('terms', terms);
	}
	if (providerId) {
		newState.append('provider', providerId);
	}

	try {
		history.pushState(
			null,
			'',
			newState.size ? location.pathname + '?' + newState : location.pathname
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
			provider: state.get('provider') || PROVIDER_ALL
		};
	}
	return { terms: '', provider: PROVIDER_ALL };
}
