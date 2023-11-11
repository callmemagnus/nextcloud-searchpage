// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { fetchProviders } from '$lib/search';
import { writable } from 'svelte/store';

export type Provider = {
	id: string;
	name: string;
};

const { subscribe, set } = writable<Provider[]>([]);

async function load() {
	const results = await fetchProviders();
	if (results) {
		set(results);
	}
}

export const providers = { subscribe, load };
