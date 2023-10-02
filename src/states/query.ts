// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { get, writable } from 'svelte/store';
import { loadFromSession, saveInSession } from '../lib/session';

const session = loadFromSession();

export const terms = writable(session.terms);
export const providerId = writable(session.provider);

terms.subscribe((t) => {
	saveInSession(t.trim(), get(providerId));
});
providerId.subscribe((p) => {
	saveInSession(get(terms), p);
});
