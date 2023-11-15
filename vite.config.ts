// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as path from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// https://vitejs.dev/config/
export default {
	plugins: [svelte(), cssInjectedByJsPlugin()],
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib'),
			$states: path.resolve(__dirname, './src/states'),
			$components: path.resolve(__dirname, './src/components'),
			$: path.resolve(__dirname, './src')
		}
	},
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['src/tests/setupTests.ts']
	}
};
