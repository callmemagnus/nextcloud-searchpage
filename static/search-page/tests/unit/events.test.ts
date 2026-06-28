// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, expect, it, vi } from 'vitest';
import { preventDefault } from '../../src/lib/events';

describe('preventDefault', () => {
	it('calls e.preventDefault() on the event', () => {
		const handler = preventDefault(vi.fn());
		const event = { preventDefault: vi.fn() } as unknown as Event;
		handler(event);
		expect(event.preventDefault).toHaveBeenCalledOnce();
	});

	it('calls the wrapped function', () => {
		const fn = vi.fn();
		const handler = preventDefault(fn);
		const event = { preventDefault: vi.fn() } as unknown as Event;
		handler(event);
		expect(fn).toHaveBeenCalledOnce();
	});

	it('passes the event to the wrapped function', () => {
		const fn = vi.fn();
		const handler = preventDefault(fn);
		const event = { preventDefault: vi.fn(), type: 'submit' } as unknown as Event;
		handler(event);
		expect(fn).toHaveBeenCalledWith(event);
	});
});
