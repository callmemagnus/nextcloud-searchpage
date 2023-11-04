// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { get } from 'svelte/store';
import { labels } from '../states/initialStates';
import { cwarn } from './log';

export function _t(label: string) {
	const translations = get(labels);
	if (translations[label]) {
		return translations[label];
	}

	cwarn(
		`Missing label "${label}" in used language: please help translate: https://github.com/callmemagnus/nextcloud-searchpage`
	);
	return label;
}
