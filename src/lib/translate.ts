// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { get } from 'svelte/store';
import { labels } from '../states/initialStates';
import { cwarn } from './log';

export function _t(label: string, ...rest: string[]) {
	const translations = get(labels);
	if (translations[label]) {
		let l = translations[label];
		rest.forEach((text) => {
			l = l.replace('%s', text);
		});
		return l;
	}

	cwarn(
		`Missing label "${label}" in used language: please help translate: https://github.com/callmemagnus/nextcloud-searchpage`
	);

	let l = label;
	rest.forEach((text) => {
		l = l.replace('%s', text);
	});

	return l;
}
