// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later
import vue from '@vitejs/plugin-vue2';
import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config';

// https://vitejs.dev/config/
export default defineConfig((config) => {
	const devMode = config.mode === 'dev';

	return {
		...mergeConfig(
			{
				...config,
				plugins: [vue()]
			},
			baseConfig,
			true
		),

		build: {
			sourcemap: devMode,
			minify: !devMode,
			outDir: 'js',
			emptyOutDir: false,
			lib: {
				formats: ['iife'],
				entry: 'src/entry-admin.ts',
				name: 'main',
				fileName: 'admin'
			}
		},

		define: {
			'process.env.NODE_ENV': `"${process.env.NODE_ENV}"`
		}
	};
});
