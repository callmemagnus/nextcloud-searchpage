// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

export function generateArray<T>(size: number, defaultValue: T) {
	return Array.from({ length: size }).map(() => defaultValue);
}
