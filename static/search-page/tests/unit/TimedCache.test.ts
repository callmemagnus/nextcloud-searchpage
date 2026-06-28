// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TimedCache from '../../src/lib/TimedCache';

const TTL = 1000;

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

describe('TimedCache — basic operations', () => {
	it('returns undefined for a key that was never set', () => {
		const cache = new TimedCache<string>(TTL);
		expect(cache.get('missing')).toBeUndefined();
	});

	it('stores and retrieves a value', () => {
		const cache = new TimedCache<string>(TTL);
		cache.set('a', 'hello');
		expect(cache.get('a')).toBe('hello');
	});

	it('has() returns true for a freshly set key', () => {
		const cache = new TimedCache<number>(TTL);
		cache.set('x', 42);
		expect(cache.has('x')).toBe(true);
	});

	it('has() returns false for a missing key', () => {
		const cache = new TimedCache<number>(TTL);
		expect(cache.has('nope')).toBe(false);
	});

	it('delete() removes a key', () => {
		const cache = new TimedCache<string>(TTL);
		cache.set('a', 'v');
		cache.delete('a');
		expect(cache.has('a')).toBe(false);
		expect(cache.get('a')).toBeUndefined();
	});

	it('delete() returns true when the key existed', () => {
		const cache = new TimedCache<string>(TTL);
		cache.set('a', 'v');
		expect(cache.delete('a')).toBe(true);
	});

	it('delete() returns false when the key did not exist', () => {
		const cache = new TimedCache<string>(TTL);
		expect(cache.delete('ghost')).toBe(false);
	});

	it('clear() removes all entries', () => {
		const cache = new TimedCache<number>(TTL);
		cache.set('a', 1);
		cache.set('b', 2);
		cache.clear();
		expect(cache.size).toBe(0);
		expect(cache.get('a')).toBeUndefined();
	});

	it('size reflects the number of live entries', () => {
		const cache = new TimedCache<number>(TTL);
		expect(cache.size).toBe(0);
		cache.set('a', 1);
		cache.set('b', 2);
		expect(cache.size).toBe(2);
	});

	it('keys() iterates over all stored keys', () => {
		const cache = new TimedCache<number>(TTL);
		cache.set('a', 1);
		cache.set('b', 2);
		expect([...cache.keys()]).toEqual(['a', 'b']);
	});

	it('set() overwrites an existing key', () => {
		const cache = new TimedCache<string>(TTL);
		cache.set('k', 'first');
		cache.set('k', 'second');
		expect(cache.get('k')).toBe('second');
	});

	it('set() returns the cache instance (fluent interface)', () => {
		const cache = new TimedCache<string>(TTL);
		expect(cache.set('k', 'v')).toBe(cache);
	});
});

describe('TimedCache — TTL expiry', () => {
	it('has() returns false after TTL elapses', () => {
		const cache = new TimedCache<string>(TTL);
		cache.set('a', 'val');
		vi.advanceTimersByTime(TTL + 1);
		expect(cache.has('a')).toBe(false);
	});

	it('get() returns undefined after TTL elapses', () => {
		const cache = new TimedCache<string>(TTL);
		cache.set('a', 'val');
		vi.advanceTimersByTime(TTL + 1);
		expect(cache.get('a')).toBeUndefined();
	});

	it('has() evicts the expired entry from the internal map', () => {
		const cache = new TimedCache<string>(TTL);
		cache.set('a', 'val');
		vi.advanceTimersByTime(TTL + 1);
		cache.has('a'); // triggers eviction
		expect(cache.size).toBe(0);
	});

	it('entry is still valid one millisecond before TTL', () => {
		const cache = new TimedCache<string>(TTL);
		cache.set('a', 'val');
		vi.advanceTimersByTime(TTL - 1);
		expect(cache.has('a')).toBe(true);
		expect(cache.get('a')).toBe('val');
	});

	it('a re-set key gets a fresh TTL', () => {
		const cache = new TimedCache<string>(TTL);
		cache.set('a', 'first');
		vi.advanceTimersByTime(TTL - 1); // almost expired
		cache.set('a', 'second'); // refresh
		vi.advanceTimersByTime(TTL - 1); // still within new TTL
		expect(cache.get('a')).toBe('second');
	});
});
