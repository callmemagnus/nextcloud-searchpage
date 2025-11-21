// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { PROVIDER_ALL } from '../constants';
import { checkIsAllSelected } from '../states/query';
import { clog } from './log';

export function saveInSession(terms: string, providerIds: string[]) {
	const newState = new URLSearchParams();
	if (terms) {
		newState.append('terms', encodeURI(terms));
	}
	if (providerIds) {
		if (checkIsAllSelected(providerIds)) {
			newState.append('provider', PROVIDER_ALL);
		} else {
			for (const id of providerIds) {
				newState.append('provider', id);
			}
		}
	}

	try {
		history.pushState(
			null,
			'',
			(newState.size ? location.pathname + '?' + newState : location.pathname) + location.hash
		);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (e) {
		// ignore
	}
}

export function loadFromSession() {
	const { search } = location;

	if (search) {
		const state = new URLSearchParams(search);
		let providers = state.getAll('provider') || [];
		if (providers.length === 1 && providers[0] === PROVIDER_ALL) {
			providers = [];
		}
		const terms = decodeURI(state.get('terms') || '');
		clog('Reading from session (url)', terms, providers);
		return {
			terms,
			providers
		};
	}
	return { terms: '', providers: [] };
}
