// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck escape is not present

export function escapeForRegexp(text: string) {
	if (typeof RegExp.escape === 'function') {
		return RegExp.escape(text);
	} else {
		return text.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
	}
}
