// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { escapeForRegexp } from '../../src/lib/text';

// Preserve the native implementation (may or may not exist depending on Node version).
const nativeEscape = Object.getOwnPropertyDescriptor(RegExp, 'escape')?.value;

function suppressNativeEscape() {
	Object.defineProperty(RegExp, 'escape', {
		value: undefined,
		configurable: true,
		writable: true
	});
}

function restoreNativeEscape() {
	Object.defineProperty(RegExp, 'escape', {
		value: nativeEscape,
		configurable: true,
		writable: true
	});
}

describe('escapeForRegexp — fallback path (RegExp.escape suppressed)', () => {
	beforeEach(suppressNativeEscape);
	afterEach(restoreNativeEscape);

	it('returns plain text unchanged', () => {
		expect(escapeForRegexp('hello')).toBe('hello');
	});

	it('escapes a dot', () => {
		expect(escapeForRegexp('hello.world')).toBe('hello\\.world');
	});

	it('escapes all regex special characters', () => {
		const specials = ['.', '*', '+', '?', '^', '$', '{', '}', '(', ')', '|', '[', ']', '\\'];
		for (const char of specials) {
			expect(escapeForRegexp(char)).toBe(`\\${char}`);
		}
	});

	it('escapes a forward slash', () => {
		expect(escapeForRegexp('a/b')).toBe('a\\/b');
	});

	it('escapes a hyphen', () => {
		expect(escapeForRegexp('a-b')).toBe('a\\-b');
	});

	it('handles an empty string', () => {
		expect(escapeForRegexp('')).toBe('');
	});

	it('the escaped string is usable in a RegExp without throwing', () => {
		const raw = 'price: $1.00 (each)';
		const escaped = escapeForRegexp(raw);
		expect(new RegExp(escaped).test(raw)).toBe(true);
	});
});

describe('escapeForRegexp — native RegExp.escape path', () => {
	afterEach(() => vi.restoreAllMocks());

	it('delegates to RegExp.escape when available', () => {
		vi.spyOn(RegExp, 'escape').mockReturnValue('__native__result');
		const result = escapeForRegexp('hello');
		expect(RegExp.escape).toHaveBeenCalledWith('hello');
		expect(result).toBe('__native__result');
	});
});
