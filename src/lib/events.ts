// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

//@ts-expect-error
export function preventDefault(fn) {
	return (e: Event) => {
		e.preventDefault();
		//@ts-expect-error
		fn.call(this, e);
	};
}
