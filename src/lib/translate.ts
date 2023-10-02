// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { translate as t } from '@nextcloud/l10n';

export function _t(label: string, rest?: Record<string, string>) {
	return t('thesearchpage', label, rest);
}
