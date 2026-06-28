// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

const SESSION_KEY = 'mwb-thesearchpage-unsupported-filters';

// Matches NC error "Provider X doesn't support filter since." — dot covers the Unicode apostrophe ’
export function parseUnsupportedFilterName(data: unknown): string | null {
	if (typeof data !== 'string') return null;
	const match = data.match(/doesn.t support filter (\w+)/i);
	return match?.[1] ?? null;
}

type UnsupportedFilters = Record<string, string[]>;

function load(): UnsupportedFilters {
	try {
		return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}');
	} catch {
		return {};
	}
}

export function markFilterUnsupported(providerId: string, filterName: string): void {
	const data = load();
	const existing = data[providerId] ?? [];
	if (existing.includes(filterName)) return;
	data[providerId] = [...existing, filterName];
	try {
		sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
	} catch {
		// ignore quota / private-browsing errors
	}
}

export function getUnsupportedFilters(providerId: string): string[] {
	return load()[providerId] ?? [];
}
