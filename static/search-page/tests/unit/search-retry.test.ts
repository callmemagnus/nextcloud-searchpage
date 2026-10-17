// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@nextcloud/axios', () => ({ default: { get: mocks.get } }));
vi.mock('@nextcloud/router', () => ({ generateOcsUrl: vi.fn((p: string) => `/ocs/v2.php/${p}`) }));
vi.mock('../../src/states/availableProviders.svelte', () => ({
	default: { providers: [{ id: 'mail', limit: 20 }] }
}));
vi.mock('../../src/states/query.svelte', () => ({
	default: { since: '2026-01-01', until: '' }
}));
vi.mock('@shared/libs', () => ({ clog: vi.fn() }));

import { searchOnProvider } from '../../src/lib/search';

const ok = (entries: unknown[]) => ({
	data: { ocs: { meta: { statuscode: 200 }, data: { cursor: 1, isPaginated: true, entries } } }
});
const rejectsSince = {
	ocs: { meta: { statuscode: 400 }, data: "Provider mail doesn't support filter since." }
};

let store: Record<string, string> = {};
beforeEach(() => {
	store = {};
	vi.stubGlobal('sessionStorage', {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => (store[k] = v)
	});
	mocks.get.mockReset();
});

describe('searchOnProvider', () => {
	it('sends the provider limit and the since filter', async () => {
		mocks.get.mockResolvedValueOnce(ok([{ title: 'a' }]));

		const result = await searchOnProvider('mail', 'limit-term', 0);

		const url = new URL(mocks.get.mock.calls[0][0], 'http://x');
		expect(url.searchParams.get('limit')).toBe('20');
		expect(url.searchParams.get('since')).not.toBeNull();
		expect(result).toMatchObject({ providerId: 'mail', entries: [{ title: 'a' }] });
	});

	it('retries once without a filter the provider rejects in a 200 response', async () => {
		mocks.get
			.mockResolvedValueOnce({ data: rejectsSince })
			.mockResolvedValueOnce(ok([{ title: 'a' }]));

		const result = await searchOnProvider('mail', 'ocs-error-term', 0);

		expect(mocks.get).toHaveBeenCalledTimes(2);
		expect(mocks.get.mock.calls[0][0]).toContain('since=');
		expect(mocks.get.mock.calls[1][0]).not.toContain('since=');
		expect(result?.entries).toHaveLength(1);
	});

	it('retries once without a filter the provider rejects with an HTTP error', async () => {
		mocks.get
			.mockRejectedValueOnce({ response: { data: rejectsSince } })
			.mockResolvedValueOnce(ok([{ title: 'a' }]));

		const result = await searchOnProvider('mail', 'http-error-term', 0);

		expect(mocks.get).toHaveBeenCalledTimes(2);
		expect(mocks.get.mock.calls[1][0]).not.toContain('since=');
		expect(result?.entries).toHaveLength(1);
	});

	it('returns null without retrying on other errors', async () => {
		mocks.get.mockRejectedValueOnce(new Error('network down'));

		expect(await searchOnProvider('mail', 'network-term', 0)).toBeNull();
		expect(mocks.get).toHaveBeenCalledTimes(1);
	});

	it('serves an identical query from cache', async () => {
		mocks.get.mockResolvedValueOnce(ok([]));

		await searchOnProvider('mail', 'cached-term', 0);
		await searchOnProvider('mail', 'cached-term', 0);

		expect(mocks.get).toHaveBeenCalledTimes(1);
	});
});

describe('searchOnProvider when the rejected filter cannot be dropped', () => {
	it('gives up instead of waiting on itself when sessionStorage is unavailable', async () => {
		vi.stubGlobal('sessionStorage', {
			getItem: () => null,
			setItem: () => {
				throw new Error('QuotaExceededError');
			}
		});
		mocks.get.mockResolvedValueOnce({ data: rejectsSince });

		expect(await searchOnProvider('mail', 'no-storage-term', 0)).toBeNull();
		expect(mocks.get).toHaveBeenCalledTimes(1);
	});

	it('gives up when the provider rejects a filter that was not sent', async () => {
		mocks.get.mockResolvedValueOnce({
			data: {
				ocs: {
					meta: { statuscode: 400 },
					data: "Provider mail doesn't support filter person."
				}
			}
		});

		expect(await searchOnProvider('mail', 'unsent-filter-term', 0)).toBeNull();
		expect(mocks.get).toHaveBeenCalledTimes(1);
	});
});
