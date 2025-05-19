// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

export function preventDefault<E extends Event, T>(fn: T) {
	return (e: E) => {
		e.preventDefault();
		//@ts-expect-error "this" is not "clearly defined"
		fn.call(this, e);
	};
}
