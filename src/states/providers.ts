// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { writable } from 'svelte/store';
import { fetchUsableProviders } from '$lib/search';

export type Provider = {
	id: string;
	name: string;
};

const { subscribe, set } = writable<Provider[]>([]);

async function load() {
	const results = await fetchUsableProviders();
	if (results) {
		set(results);
	}
}

export const providers = { subscribe, load };
