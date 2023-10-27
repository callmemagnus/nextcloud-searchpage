// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

function readHash(): URLSearchParams {
	if (location.hash.length > 1) {
		return new URLSearchParams(location.hash.split('#')[1]);
	}
	return new URLSearchParams();
}

function setHash(params: URLSearchParams) {
	if (Array.from(params.keys()).length) {
		location.hash = `#${params}`;
	} else {
		location.hash = '#';
	}
}

export function addToHash(key: string, value: string) {
	const params = readHash();
	params.set(key, value);
	setHash(params);
}

export function removeFromHash(key: string) {
	const params = readHash();
	params.delete(key);
	setHash(params);
}

export function readFromHash(key: string) {
	const params = readHash();
	return params.get(key);
}
