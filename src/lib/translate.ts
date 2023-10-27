// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { get } from 'svelte/store';
import { labels } from '../states/initialStates';

export function _t(label: string) {
	const translations = get(labels);
	if (translations[label]) {
		return translations[label];
	}
	console.warn(`Missing label "${label}"`);
	return label;
}
