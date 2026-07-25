import { defineConfig, devices } from '@playwright/test';

const host = process.env.TARGET_HOST ? process.env.TARGET_HOST : 'localhost';

function authFileFromUrl(url: string) {
	const s = url.split(':');
	return `.playwright/auth/user-${s[2]}.json`;
}

const setup = (id: number) => ({
	name: `setup-${id}`,
	testMatch: '**/tests/e2e/auth.setup.ts',
	use: {
		baseURL: `http://${host}:80${id}`
	}
});

const tests = (id: number) => ({
	name: `tests-${id}`,
	testMatch: /.*\.tests\.ts/,
	use: {
		...devices['Desktop Chrome'],
		baseURL: `http://${host}:80${id}`,
		storageState: authFileFromUrl(`http://${host}:80${id}`)
	},
	dependencies: [`setup-${id}`]
});

const allVersions = [33, 34];

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
	workers: 1,
	testDir: './static',
	timeout: 10_000,

	projects: versions.flatMap((id) => [setup(id), tests(id)])
});
