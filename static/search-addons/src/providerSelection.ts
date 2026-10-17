// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

export type AppSearchConfigEntry = {
	enabled: boolean;
	providerIds: string[] | null; // null or empty = all providers
};

export function getAppIdFromPath(pathname: string): string | null {
	const match = pathname.match(/\/apps\/([^/]+)/);
	return match ? match[1] : null;
}

export function getConfigForPath(
	pathname: string,
	appSearchConfig: Record<string, AppSearchConfigEntry>
): { enabled: boolean; providerIds: string[] | null } {
	const key = /\/settings(\/|$)/.test(pathname) ? '__settings__' : getAppIdFromPath(pathname);
	if (!key) return { enabled: false, providerIds: null };

	const entry = appSearchConfig[key];
	if (!entry) return { enabled: true, providerIds: null };

	return {
		enabled: entry.enabled,
		providerIds: entry.providerIds?.length ? entry.providerIds : null
	};
}

// undefined = feature disabled or no providers available for this user/page — caller
// should let the native trigger behave normally. null = all providers.
// availableProviderIds: null = restrictions disabled; string[] = restricted list for this user
export function computeEffectiveProviderIds(
	pathname: string,
	appSearchConfig: Record<string, AppSearchConfigEntry>,
	availableProviderIds: string[] | null
): string[] | null | undefined {
	const { enabled, providerIds } = getConfigForPath(pathname, appSearchConfig);
	if (!enabled) return undefined;

	if (availableProviderIds !== null) {
		const effective = providerIds
			? providerIds.filter((id) => availableProviderIds.includes(id))
			: availableProviderIds;
		if (effective.length === 0) return undefined;
		return effective;
	}

	return providerIds;
}
