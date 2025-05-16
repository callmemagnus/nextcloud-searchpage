// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { writable } from 'svelte/store';
import { fetchProviders } from '../lib/search';

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

load();

const availableProviders = { subscribe };

export default availableProviders;
