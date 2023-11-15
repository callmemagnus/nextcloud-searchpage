// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config';

// https://vitejs.dev/config/
export default defineConfig((config) => {
	const devMode = config.mode === 'dev';
	return {
		...mergeConfig(config, baseConfig, true),
		build: {
			sourcemap: devMode,
			minify: !devMode,
			emptyOutDir: false,
			outDir: 'js',
			lib: {
				formats: ['iife'],
				entry: 'src/entry-searchPage.ts',
				name: 'main'
			}
		}
	};
});
