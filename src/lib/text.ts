// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

export function escapeForRegexp(text: string) {
	// @ts-expect-ignore escape is known to be missing as it appeared 2025
	if (typeof RegExp.escape === 'function') {
		// @ts-expect-error escape is known to be missing as it appeared 2025
		return RegExp.escape(text);
	} else {
		return text.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
	}
}
