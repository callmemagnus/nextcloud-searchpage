import {defineConfig, devices} from '@playwright/test';
import {authFileFromUrl} from './static/search-page/tests/e2e/helpers';

const host = process.env.TARGET_HOST ? process.env.TARGET_HOST : 'localhost';

// TARGET_BY_NAME=1: reach containers by name (nextcloud-XX:80) on a shared docker network
// instead of via host:80XX (set by bin/run-playwright.sh --by-name)
const baseURL = (id: number) => (process.env.TARGET_BY_NAME ? `http://nextcloud-${id}` : `http://${host}:80${id}`);

const setup = (id: number) => ({
	name: `setup-${id}`,
	testMatch: '**/tests/e2e/auth.setup.ts',
	use: {
		baseURL: baseURL(id)
	}
});

const tests = (id: number) => ({
	name: `tests-${id}`,
	testMatch: /.*\.tests\.ts/,
	// Test files share one Nextcloud instance per version and mutate its app settings
	workers: 1,
	use: {
		...devices['Desktop Chrome'],
		baseURL: baseURL(id),
		storageState: authFileFromUrl(baseURL(id))
	},
	dependencies: [`setup-${id}`]
});

const allVersions = [33, 34, 35];

// Set TARGET_NC_VERSION=33 to run only that version (used by bin/run-playwright.sh)
// Set EXCLUDE_NC_VERSION=33 to skip that version (used by bin/run-playwright.sh --exclude)
let versions: number[];
if (process.env.TARGET_NC_VERSION) {
	const v = parseInt(process.env.TARGET_NC_VERSION, 10);
	if (isNaN(v)) throw new Error(`Invalid TARGET_NC_VERSION: "${process.env.TARGET_NC_VERSION}"`);
	versions = [v];
} else if (process.env.EXCLUDE_NC_VERSION) {
	const v = parseInt(process.env.EXCLUDE_NC_VERSION, 10);
	if (isNaN(v)) throw new Error(`Invalid EXCLUDE_NC_VERSION: "${process.env.EXCLUDE_NC_VERSION}"`);
	versions = allVersions.filter((id) => id !== v);
} else {
	versions = allVersions;
}

export default defineConfig({
	workers: 3,
	testDir: './static',
	timeout: 10_000,

	projects: versions.flatMap((id) => [setup(id), tests(id)])
});
