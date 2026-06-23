// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it } from 'vitest';
import { generateArray } from '../../src/lib/array-utils';

describe('generateArray', () => {
	it('produces an array of the requested length', () => {
		expect(generateArray(5, 0)).toHaveLength(5);
	});

	it('fills every element with the default value', () => {
		expect(generateArray(3, 7)).toEqual([7, 7, 7]);
	});

	it('returns an empty array for size 0', () => {
		expect(generateArray(0, 'x')).toEqual([]);
	});

	it('works with string default values', () => {
		expect(generateArray(2, 'hello')).toEqual(['hello', 'hello']);
	});

	it('works with null as default value', () => {
		expect(generateArray(3, null)).toEqual([null, null, null]);
	});

	it('every element is the same object reference when given an object', () => {
		const obj = { a: 1 };
		const result = generateArray(3, obj);
		expect(result[0]).toBe(obj);
		expect(result[1]).toBe(obj);
		expect(result[2]).toBe(obj);
	});
});
