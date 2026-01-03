// SPDX-FileCopyrightText: Magnus Anderssen <magnus@magooweb.com>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadState } from '@nextcloud/initial-state';

class UserState {
	isAdmin = $state<boolean>(false);

	constructor() {
		this.load();
	}

	load() {
		try {
			this.isAdmin = loadState<boolean>('thesearchpage', 'isAdmin');
		} catch (e) {
			// If initial state is not available, default to false
			console.warn('Failed to load user admin status from initial state', e);
			this.isAdmin = false;
		}
	}
}

const userState = new UserState();

export default userState;
