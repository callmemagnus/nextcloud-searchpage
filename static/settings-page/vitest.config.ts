// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	// compiles runes in *.svelte.ts stores
	plugins: [svelte()],
	test: {
		include: ['tests/unit/**/*.test.ts']
	}
});
