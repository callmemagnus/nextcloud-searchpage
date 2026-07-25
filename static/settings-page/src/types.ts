// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

export type Provider = {
	id: string;
	name: string;
	limit?: number;
};

export type Group = {
	id: string;
	displayName: string;
};

export type NavigationApp = {
	id: string;
	name: string;
};

export type AppSearchConfigEntry = {
	enabled: boolean;
	providerIds: string[] | null; // null or empty = all providers
};

export type Settings = {
	enabled: boolean;
	hijackSearchEnabled: boolean;
	apps: NavigationApp[];
	appSearchConfig: Record<string, AppSearchConfigEntry>;
	providers: Provider[];
	providerGroupMap: Record<string, string[]> | null;
	providerLimits: Record<string, number> | null;
};
