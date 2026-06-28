// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addToHash, readFromHash, removeFromHash } from '../../src/lib/hash';

let hashStore = '';

beforeEach(() => {
	hashStore = '';
	vi.stubGlobal('location', {
		get hash() {
			return hashStore;
		},
		set hash(v: string) {
			hashStore = v;
		}
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('readFromHash', () => {
	it('returns null when the hash is empty', () => {
		expect(readFromHash('key')).toBeNull();
	});

	it('returns null when the key is not present', () => {
		hashStore = '#other=value';
		expect(readFromHash('key')).toBeNull();
	});

	it('returns the value for a present key', () => {
		addToHash('foo', 'bar');
		expect(readFromHash('foo')).toBe('bar');
	});
});

describe('addToHash', () => {
	it('sets a key in the hash', () => {
		addToHash('k', 'v');
		expect(readFromHash('k')).toBe('v');
	});

	it('overwrites an existing key', () => {
		addToHash('k', 'first');
		addToHash('k', 'second');
		expect(readFromHash('k')).toBe('second');
	});

	it('can hold multiple independent keys', () => {
		addToHash('a', '1');
		addToHash('b', '2');
		expect(readFromHash('a')).toBe('1');
		expect(readFromHash('b')).toBe('2');
	});
});

describe('removeFromHash', () => {
	it('removes an existing key', () => {
		addToHash('k', 'v');
		removeFromHash('k');
		expect(readFromHash('k')).toBeNull();
	});

	it('does not throw when the key is absent', () => {
		expect(() => removeFromHash('nonexistent')).not.toThrow();
	});

	it('leaves other keys intact', () => {
		addToHash('a', '1');
		addToHash('b', '2');
		removeFromHash('a');
		expect(readFromHash('b')).toBe('2');
	});
});
