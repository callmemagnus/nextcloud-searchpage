// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadFromSession, saveInSession } from '$lib/session';
import { get, writable } from 'svelte/store';

const session = loadFromSession();

export const terms = writable(session.terms);
export const providerIds = writable(session.providers);

terms.subscribe((t) => {
	saveInSession(t.trim(), get(providerIds));
});
providerIds.subscribe((pIds) => {
	saveInSession(get(terms), pIds);
});
