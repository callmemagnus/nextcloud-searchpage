// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

export function generateArray<T>(size: number, defaultValue: T) {
	return Array.from({ length: size }).map(() => defaultValue);
}

export function hasSameValues<T>(arr1: T[], arr2: T[]): boolean {
	if (arr1.length !== arr2.length) {
		return false;
	}

	const sArr1 = [...arr1];
	const sArr2 = [...arr2];
	sArr1.sort();
	sArr2.sort();

	for (let i = 0; i < sArr1.length; i++) {
		if (sArr1[i] !== sArr1[i]) {
			return false;
		}
	}
	return true;
}
