// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadFromSession, saveInSession } from '$lib/session';
import { get, writable } from 'svelte/store';

const session = loadFromSession();

export const terms = writable(session.terms);
export const providerId = writable(session.providers[0]);
export const providerIds = writable(session.providers);

terms.subscribe((t) => {
	saveInSession(t.trim(), [get(providerId)]);
});
providerId.subscribe((p) => {
	saveInSession(get(terms), [p]);
});
providerIds.subscribe((pIds) => {
	saveInSession(get(terms), pIds);
});
