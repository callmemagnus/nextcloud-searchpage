// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

export const APP_NAME = 'thesearchpage';
export const PROVIDER_ALL = 'All';

export const USER_GROUPS_URL = (user: string) => `cloud/users/${user}/groups`;

export const GLOBAL_SETTINGS_URL = `/apps/provisioning_api/api/v1/config/apps/${APP_NAME}/global.settings`;
export const GROUP_SETTINGS_URL = (group: string) =>
	`/apps/provisioning_api/api/v1/config/apps/${APP_NAME}/${group}.enabled.providers`;
