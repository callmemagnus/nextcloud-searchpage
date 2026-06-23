// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock() is hoisted above const declarations, so the shared state must also
// be hoisted to avoid a temporal dead zone error in the mock factory.
const mockQueryState = vi.hoisted(() => ({ isAllSelected: true, since: '', until: '' }));

vi.mock('../../src/states/query.svelte', () => ({ default: mockQueryState }));
vi.mock('@shared/libs', () => ({ clog: vi.fn() }));

import { loadFromSession, saveInSession } from '../../src/lib/session';

let searchStore = '';
const pushState = vi.fn();

beforeEach(() => {
	searchStore = '';
	mockQueryState.isAllSelected = true;
	mockQueryState.since = '';
	mockQueryState.until = '';
	pushState.mockClear();

	vi.stubGlobal('location', {
		get search() {
			return searchStore;
		},
		pathname: '/apps/thesearchpage',
		hash: ''
	});
	vi.stubGlobal('history', { pushState });
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('loadFromSession', () => {
	it('returns empty defaults when there is no query string', () => {
		expect(loadFromSession()).toEqual({ terms: '', providers: [], since: '', until: '' });
	});

	it('reads the search term', () => {
		searchStore = '?terms=hello';
		expect(loadFromSession().terms).toBe('hello');
	});

	it('decodes URI-encoded terms', () => {
		searchStore = `?terms=${encodeURI('café table')}`;
		expect(loadFromSession().terms).toBe('café table');
	});

	it('reads individual provider ids', () => {
		searchStore = '?provider=files&provider=comments';
		expect(loadFromSession().providers).toEqual(['files', 'comments']);
	});

	it('collapses the "All" sentinel back to an empty providers array', () => {
		searchStore = '?provider=All';
		expect(loadFromSession().providers).toEqual([]);
	});

	it('reads the since date', () => {
		searchStore = '?since=2024-01-01';
		expect(loadFromSession().since).toBe('2024-01-01');
	});

	it('reads the until date', () => {
		searchStore = '?until=2024-12-31';
		expect(loadFromSession().until).toBe('2024-12-31');
	});

	it('reads all fields together', () => {
		searchStore = '?terms=test&provider=files&since=2024-01-01&until=2024-12-31';
		expect(loadFromSession()).toEqual({
			terms: 'test',
			providers: ['files'],
			since: '2024-01-01',
			until: '2024-12-31'
		});
	});
});

describe('saveInSession', () => {
	function capturedUrl(): string {
		return pushState.mock.calls[0]?.[2] ?? '';
	}

	it('pushes the terms into the URL', () => {
		saveInSession('hello', []);
		expect(capturedUrl()).toContain('terms=hello');
	});

	it('writes "All" when all providers are selected', () => {
		mockQueryState.isAllSelected = true;
		saveInSession('q', ['files', 'comments']);
		expect(capturedUrl()).toContain('provider=All');
	});

	it('lists individual providers when not all are selected', () => {
		mockQueryState.isAllSelected = false;
		saveInSession('q', ['files', 'comments']);
		const url = capturedUrl();
		expect(url).toContain('provider=files');
		expect(url).toContain('provider=comments');
	});

	it('includes since when set on queryState', () => {
		mockQueryState.since = '2024-01-01';
		saveInSession('q', []);
		expect(capturedUrl()).toContain('since=2024-01-01');
	});

	it('includes until when set on queryState', () => {
		mockQueryState.until = '2024-12-31';
		saveInSession('q', []);
		expect(capturedUrl()).toContain('until=2024-12-31');
	});

	it('omits since and until when they are empty', () => {
		saveInSession('q', []);
		const url = capturedUrl();
		expect(url).not.toContain('since=');
		expect(url).not.toContain('until=');
	});

	it('uses just the pathname when no terms, providers, or dates are set', () => {
		// isAllSelected=false + empty providerIds → nothing to append → bare pathname
		mockQueryState.isAllSelected = false;
		saveInSession('', []);
		expect(capturedUrl()).toBe('/apps/thesearchpage');
	});
});
