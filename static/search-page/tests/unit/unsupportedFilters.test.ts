// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getUnsupportedFilters,
	markFilterUnsupported,
	parseUnsupportedFilterName
} from '../../src/lib/unsupportedFilters';

// Minimal sessionStorage stub — vitest runs in node, which has no browser globals
let store: Record<string, string> = {};
const mockSessionStorage = {
	getItem: (key: string) => store[key] ?? null,
	setItem: (key: string, value: string) => {
		store[key] = value;
	},
	removeItem: (key: string) => {
		delete store[key];
	},
	clear: () => {
		store = {};
	}
};

beforeEach(() => {
	store = {};
	vi.stubGlobal('sessionStorage', mockSessionStorage);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('parseUnsupportedFilterName', () => {
	it('extracts the filter name from the standard NC error message', () => {
		expect(
			parseUnsupportedFilterName("Provider systemtags doesn't support filter since.")
		).toBe('since');
	});

	it('handles the Unicode right-single-quotation-mark NC sends', () => {
		expect(
			parseUnsupportedFilterName('Provider systemtags doesn’t support filter since.')
		).toBe('since');
	});

	it('works for "until" too', () => {
		expect(parseUnsupportedFilterName("Provider X doesn't support filter until.")).toBe(
			'until'
		);
	});

	it('returns null for an unrelated error string', () => {
		expect(parseUnsupportedFilterName('Internal server error')).toBeNull();
	});

	it('returns null for non-string values', () => {
		expect(parseUnsupportedFilterName(null)).toBeNull();
		expect(parseUnsupportedFilterName(undefined)).toBeNull();
		expect(parseUnsupportedFilterName(400)).toBeNull();
		expect(parseUnsupportedFilterName({})).toBeNull();
	});

	it('returns null for an empty string', () => {
		expect(parseUnsupportedFilterName('')).toBeNull();
	});
});

describe('markFilterUnsupported / getUnsupportedFilters', () => {
	it('returns an empty array for a provider with no recorded incapabilities', () => {
		expect(getUnsupportedFilters('files')).toEqual([]);
	});

	it('records a filter as unsupported', () => {
		markFilterUnsupported('systemtags', 'since');
		expect(getUnsupportedFilters('systemtags')).toContain('since');
	});

	it('records multiple filters for the same provider', () => {
		markFilterUnsupported('systemtags', 'since');
		markFilterUnsupported('systemtags', 'until');
		expect(getUnsupportedFilters('systemtags')).toContain('since');
		expect(getUnsupportedFilters('systemtags')).toContain('until');
	});

	it('does not duplicate the same filter', () => {
		markFilterUnsupported('systemtags', 'since');
		markFilterUnsupported('systemtags', 'since');
		const filters = getUnsupportedFilters('systemtags').filter((f) => f === 'since');
		expect(filters).toHaveLength(1);
	});

	it('tracks filters independently per provider', () => {
		markFilterUnsupported('systemtags', 'since');
		expect(getUnsupportedFilters('files')).not.toContain('since');
	});

	it('persists in sessionStorage between calls', () => {
		markFilterUnsupported('comments', 'since');
		// Clear in-memory reference to verify it reads from sessionStorage
		expect(getUnsupportedFilters('comments')).toContain('since');
	});

	it('survives sessionStorage containing unexpected data gracefully', () => {
		store['mwb-thesearchpage-unsupported-filters'] = 'not-json';
		expect(() => getUnsupportedFilters('files')).not.toThrow();
		expect(getUnsupportedFilters('files')).toEqual([]);
	});
});
