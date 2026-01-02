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

export type Settings = {
	enabled: boolean;
	providers: Provider[];
	providerGroupMap: Record<string, string[]> | null;
	providerLimits: Record<string, number> | null;
};
