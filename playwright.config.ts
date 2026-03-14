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

// Set TARGET_NC_VERSION=33 to run only that version (used by bin/e2e-local.sh)
const versions = process.env.TARGET_NC_VERSION
	? [parseInt(process.env.TARGET_NC_VERSION, 10)]
	: [30, 31, 32, 33];

if (versions.some(isNaN)) {
	throw new Error(`Invalid TARGET_NC_VERSION: "${process.env.TARGET_NC_VERSION}"`);
}

export default defineConfig({
	workers: 1,
	testDir: './static',
	timeout: 30_000,

	projects: versions.flatMap((id) => [setup(id), tests(id)])
});
